// Owner: Justin
const { sql, getPool } = require("../db");

// Get the customer's cart_id, creating a Cart row if they don't have one yet
async function getOrCreateCartId(pool, customerId) {
  const existing = await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`SELECT cart_id FROM Cart WHERE customer_id = @customerId;`);

  if (existing.recordset.length > 0) {
    return existing.recordset[0].cart_id;
  }

  const created = await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`INSERT INTO Cart (customer_id, created_at)
            OUTPUT INSERTED.cart_id
            VALUES (@customerId, GETDATE());`);
  return created.recordset[0].cart_id;
}

async function getCart(customerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT ci.cart_item_id, ci.menu_item_id, m.name AS item_name, m.price,
             ci.quantity, (m.price * ci.quantity) AS line_total,
             m.stall_id, s.stall_name
      FROM Cart c
      JOIN CartItem ci ON c.cart_id = ci.cart_id
      JOIN MenuItem m  ON ci.menu_item_id = m.menu_item_id
      JOIN Stall s     ON m.stall_id = s.stall_id
      WHERE c.customer_id = @customerId
      ORDER BY s.stall_id, ci.cart_item_id;
    `);
  return result.recordset;
}

async function addToCart(customerId, menuItemId, quantity) {
  const pool = await getPool();
  const cartId = await getOrCreateCartId(pool, customerId);

  // Upsert: if the dish is already in this cart, add to its quantity
  await pool.request()
    .input("cartId", sql.Int, cartId)
    .input("menuItemId", sql.Int, menuItemId)
    .input("quantity", sql.Int, quantity)
    .query(`
      MERGE CartItem AS target
      USING (SELECT @cartId AS cid, @menuItemId AS mid) AS src
        ON target.cart_id = src.cid AND target.menu_item_id = src.mid
      WHEN MATCHED THEN
        UPDATE SET quantity = target.quantity + @quantity
      WHEN NOT MATCHED THEN
        INSERT (cart_id, menu_item_id, quantity)
        VALUES (@cartId, @menuItemId, @quantity);
    `);
  return getCart(customerId);
}

async function updateCartItem(cartItemId, customerId, quantity) {
  const pool = await getPool();
  const result = await pool.request()
    .input("cartItemId", sql.Int, cartItemId)
    .input("customerId", sql.Int, customerId)
    .input("quantity", sql.Int, quantity)
    .query(`
      UPDATE ci
      SET ci.quantity = @quantity
      FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = @cartItemId AND c.customer_id = @customerId;
    `);
  return result.rowsAffected[0];
}

async function removeCartItem(cartItemId, customerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("cartItemId", sql.Int, cartItemId)
    .input("customerId", sql.Int, customerId)
    .query(`
      DELETE ci
      FROM CartItem ci
      JOIN Cart c ON ci.cart_id = c.cart_id
      WHERE ci.cart_item_id = @cartItemId AND c.customer_id = @customerId;
    `);
  return result.rowsAffected[0];
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };