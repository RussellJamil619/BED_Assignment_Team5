// Owner: Justin

const { sql, getPool } = require("../../db");

// ---- FEATURE: checkout with multi-vendor split (transactional) ----
async function checkout(customerId, paymentMethod) {
  const pool = await getPool();

  const cart = (
    await pool.request().input("customerId", sql.Int, customerId).query(`
      SELECT ci.menu_item_id, ci.quantity, m.price, m.stall_id
      FROM Cart c
      JOIN CartItem ci ON c.cart_id = ci.cart_id
      JOIN MenuItem m  ON ci.menu_item_id = m.menu_item_id
      WHERE c.customer_id = @customerId;
    `)
  ).recordset;

  if (cart.length === 0) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  const byStall = {};
  for (const line of cart) (byStall[line.stall_id] ||= []).push(line);

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const createdOrders = [];

    for (const stallId of Object.keys(byStall)) {
      const lines = byStall[stallId];
      const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

      const orderRes = await new sql.Request(tx)
        .input("customerId", sql.Int, customerId)
        .input("stallId", sql.Int, Number(stallId))
        .input("total", sql.Decimal(10, 2), total).query(`
          INSERT INTO Orders (customer_id, stall_id, total_amount, status)
          OUTPUT INSERTED.order_id
          VALUES (@customerId, @stallId, @total, 'Preparing');
        `);
      const orderId = orderRes.recordset[0].order_id;

      for (const l of lines) {
        await new sql.Request(tx)
          .input("orderId", sql.Int, orderId)
          .input("menuItemId", sql.Int, l.menu_item_id)
          .input("quantity", sql.Int, l.quantity)
          .input("subtotal", sql.Decimal(10, 2), l.price * l.quantity)
          .query(`INSERT INTO OrderItem (order_id, menu_item_id, quantity, subtotal)
                  VALUES (@orderId, @menuItemId, @quantity, @subtotal);`);
      }

      await new sql.Request(tx)
        .input("orderId", sql.Int, orderId)
        .input("amount", sql.Decimal(10, 2), total)
        .input("method", sql.VarChar(20), paymentMethod)
        .query(`INSERT INTO Payment (order_id, amount, payment_method, payment_status)
                VALUES (@orderId, @amount, @method, 'Success');`);

      createdOrders.push({
        order_id: orderId,
        stall_id: Number(stallId),
        total_amount: total,
      });
    }

    await new sql.Request(tx)
      .input("customerId", sql.Int, customerId)
      .query(`
        DELETE ci
        FROM CartItem ci
        JOIN Cart c ON ci.cart_id = c.cart_id
        WHERE c.customer_id = @customerId;
      `);

    await tx.commit();
    return createdOrders;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

// ---- FEATURE: add-ons with server-side price validation ----
async function addAddonsToOrder(orderId, customerId, addons) {
  const pool = await getPool();

  // Order must exist AND belong to this customer
  const order = (
    await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("customerId", sql.Int, customerId)
      .query(`SELECT order_id FROM Orders
            WHERE order_id = @orderId AND customer_id = @customerId;`)
  ).recordset[0];
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    let addedTotal = 0;
    const applied = [];

    for (const a of addons) {
      // Validate the target OrderItem belongs to THIS order
      const orderItem = (
        await new sql.Request(tx)
          .input("orderItemId", sql.Int, a.order_item_id)
          .input("orderId", sql.Int, orderId)
          .query(`SELECT order_item_id FROM OrderItem
                  WHERE order_item_id = @orderItemId AND order_id = @orderId;`)
      ).recordset[0];

      if (!orderItem) {
        const err = new Error(`Order item ${a.order_item_id} not found in this order`);
        err.status = 400;
        throw err;
      }

      // Look up the REAL price — ignore anything the client sent
      const row = (
        await new sql.Request(tx).input("addonId", sql.Int, a.addon_id)
          .query(`SELECT addon_id, name, price FROM Addon
                WHERE addon_id = @addonId AND is_available = 1;`)
      ).recordset[0];

      if (!row) {
        const err = new Error(`Invalid add-on id: ${a.addon_id}`);
        err.status = 400;
        throw err;
      }

      const unitPrice = row.price; // server-trusted price
      addedTotal += unitPrice;

      await new sql.Request(tx)
        .input("orderItemId", sql.Int, a.order_item_id)
        .input("addonId", sql.Int, a.addon_id)
        .input("unitPrice", sql.Decimal(10, 2), unitPrice)
        .query(`INSERT INTO OrderAddon (order_item_id, addon_id, unit_price)
                VALUES (@orderItemId, @addonId, @unitPrice);`);

      applied.push({
        order_item_id: a.order_item_id,
        addon_id: row.addon_id,
        name: row.name,
        unit_price: unitPrice,
      });
    }

    await new sql.Request(tx)
      .input("orderId", sql.Int, orderId)
      .input("addedTotal", sql.Decimal(10, 2), addedTotal)
      .query(`UPDATE Orders SET total_amount = total_amount + @addedTotal
              WHERE order_id = @orderId;`);

    await tx.commit();
    return { order_id: orderId, added_total: addedTotal, addons: applied };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

// ---- FEATURE: order history, auth-scoped ----
async function getMyOrders(customerId) {
  const pool = await getPool();

  const orders = (
    await pool.request().input("customerId", sql.Int, customerId).query(`
      SELECT o.order_id, o.stall_id, s.stall_name, o.order_datetime,
             o.total_amount, o.status, p.payment_method, p.payment_status
      FROM Orders o
      JOIN Stall s        ON o.stall_id = s.stall_id
      LEFT JOIN Payment p ON o.order_id = p.order_id
      WHERE o.customer_id = @customerId
      ORDER BY o.order_datetime DESC;
    `)
  ).recordset;

  if (orders.length === 0) return [];

  const items = (
    await pool.request().input("customerId", sql.Int, customerId).query(`
      SELECT oi.order_id, oi.menu_item_id, m.name AS item_name, oi.quantity, oi.subtotal
      FROM OrderItem oi
      JOIN Orders o   ON oi.order_id = o.order_id
      JOIN MenuItem m ON oi.menu_item_id = m.menu_item_id
      WHERE o.customer_id = @customerId;
    `)
  ).recordset;

  const byOrder = {};
  for (const it of items) (byOrder[it.order_id] ||= []).push(it);
  for (const o of orders) o.items = byOrder[o.order_id] || [];

  return orders;

  
}
// ---- Update order status ----
async function updateOrderStatus(orderId, customerId, status) {
  const pool = await getPool();
  const result = await pool.request()
    .input("orderId", sql.Int, orderId)
    .input("customerId", sql.Int, customerId)
    .input("status", sql.VarChar(20), status)
    .query(`UPDATE Orders SET status = @status
            WHERE order_id = @orderId AND customer_id = @customerId;`);
  return result.rowsAffected[0]; // 0 = not found or not theirs
}

// ---- Cancel (delete) an order and its dependents, in a transaction ----
async function cancelOrder(orderId, customerId) {
  const pool = await getPool();

  const owns = (
    await pool.request()
      .input("orderId", sql.Int, orderId)
      .input("customerId", sql.Int, customerId)
      .query(`SELECT order_id FROM Orders
              WHERE order_id = @orderId AND customer_id = @customerId;`)
  ).recordset[0];
  if (!owns) return 0;

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx).input("orderId", sql.Int, orderId).query(`
      DELETE oa FROM OrderAddon oa
      JOIN OrderItem oi ON oa.order_item_id = oi.order_item_id
      WHERE oi.order_id = @orderId;
    `);
    await new sql.Request(tx).input("orderId", sql.Int, orderId)
      .query(`DELETE FROM Payment WHERE order_id = @orderId;`);
    await new sql.Request(tx).input("orderId", sql.Int, orderId)
      .query(`DELETE FROM OrderItem WHERE order_id = @orderId;`);
    const res = await new sql.Request(tx).input("orderId", sql.Int, orderId)
      .query(`DELETE FROM Orders WHERE order_id = @orderId;`);

    await tx.commit();
    return res.rowsAffected[0];
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = { checkout, addAddonsToOrder, getMyOrders, updateOrderStatus, cancelOrder };