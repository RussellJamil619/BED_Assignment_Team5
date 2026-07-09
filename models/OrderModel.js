// Owner: Jusitn

const { sql, getPool } = require("../db");

// ---- FEATURE: checkout with multi-vendor split (transactional) ----
async function checkout(customerId, paymentMethod) {
  const pool = await getPool();

  // Read cart using authoritative prices from MenuItem (never trust client totals)
  const cart = (await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT c.menu_item_id, c.quantity, m.price, m.stall_id
      FROM Cart c
      JOIN MenuItem m ON c.menu_item_id = m.menu_item_id
      WHERE c.customer_id = @customerId;
    `)).recordset;

  if (cart.length === 0) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  // Group lines by stall -> one order per vendor
  const byStall = {};
  for (const line of cart) (byStall[line.stall_id] ||= []).push(line);

  // All-or-nothing: every order/payment happens in one transaction
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
        .input("total", sql.Decimal(10, 2), total)
        .query(`
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

      // One payment per order (Payment.order_id is UNIQUE)
      await new sql.Request(tx)
        .input("orderId", sql.Int, orderId)
        .input("amount", sql.Decimal(10, 2), total)
        .input("method", sql.VarChar(20), paymentMethod)
        .query(`INSERT INTO Payment (order_id, amount, payment_method, payment_status)
                VALUES (@orderId, @amount, @method, 'Success');`);

      createdOrders.push({ order_id: orderId, stall_id: Number(stallId), total_amount: total });
    }

    // Cart emptied only after all orders succeed
    await new sql.Request(tx)
      .input("customerId", sql.Int, customerId)
      .query(`DELETE FROM Cart WHERE customer_id = @customerId;`);

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
  const order = (await pool.request()
    .input("orderId", sql.Int, orderId)
    .input("customerId", sql.Int, customerId)
    .query(`SELECT order_id FROM Orders
            WHERE order_id = @orderId AND customer_id = @customerId;`)).recordset[0];
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
      // Look up the REAL price — ignore anything the client sent
      const row = (await new sql.Request(tx)
        .input("addonId", sql.Int, a.addon_id)
        .query(`SELECT addon_id, name, price FROM Addon
                WHERE addon_id = @addonId AND is_active = 1;`)).recordset[0];

      if (!row) {
        const err = new Error(`Invalid add-on id: ${a.addon_id}`);
        err.status = 400;
        throw err; // rolls back everything
      }

      const priceEach = row.price;          // server-trusted price
      const subtotal  = priceEach * a.quantity;
      addedTotal += subtotal;

      await new sql.Request(tx)
        .input("orderId", sql.Int, orderId)
        .input("addonId", sql.Int, a.addon_id)
        .input("quantity", sql.Int, a.quantity)
        .input("priceEach", sql.Decimal(10, 2), priceEach)
        .input("subtotal", sql.Decimal(10, 2), subtotal)
        .query(`INSERT INTO OrderAddon (order_id, addon_id, quantity, price_each, subtotal)
                VALUES (@orderId, @addonId, @quantity, @priceEach, @subtotal);`);

      applied.push({ addon_id: row.addon_id, name: row.name, quantity: a.quantity, price_each: priceEach, subtotal });
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

  const orders = (await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT o.order_id, o.stall_id, s.stall_name, o.order_datetime,
             o.total_amount, o.status, p.payment_method, p.payment_status
      FROM Orders o
      JOIN Stall s        ON o.stall_id = s.stall_id
      LEFT JOIN Payment p ON o.order_id = p.order_id
      WHERE o.customer_id = @customerId
      ORDER BY o.order_datetime DESC;
    `)).recordset;

  if (orders.length === 0) return [];

  const items = (await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT oi.order_id, oi.menu_item_id, m.name AS item_name, oi.quantity, oi.subtotal
      FROM OrderItem oi
      JOIN Orders o   ON oi.order_id = o.order_id
      JOIN MenuItem m ON oi.menu_item_id = m.menu_item_id
      WHERE o.customer_id = @customerId;
    `)).recordset;

  const byOrder = {};
  for (const it of items) (byOrder[it.order_id] ||= []).push(it);
  for (const o of orders) o.items = byOrder[o.order_id] || [];

  return orders;
}

module.exports = { checkout, addAddonsToOrder, getMyOrders };