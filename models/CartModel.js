const { sql, getPool } = require("../db");

async function getCart(customerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT c.cart_id, c.menu_item_id, m.name AS item_name, m.price,
             c.quantity, (m.price * c.quantity) AS line_total,
             m.stall_id, s.stall_name
      FROM Cart c
      JOIN MenuItem m ON c.menu_item_id = m.menu_item_id
      JOIN Stall s    ON m.stall_id = s.stall_id
      WHERE c.customer_id = @customerId
      ORDER BY s.stall_id, c.cart_id;
    `);
  return result.recordset;
}

async function addToCart(customerId, menuItemId, quantity) {
  const pool = await getPool();
  // Upsert: if the dish is already in the cart, add to its quantity
  await pool.request()
    .input("customerId", sql.Int, customerId)
    .input("menuItemId", sql.Int, menuItemId)
    .input("quantity", sql.Int, quantity)
    .query(`
      MERGE Cart AS target
      USING (SELECT @customerId AS cid, @menuItemId AS mid) AS src
        ON target.customer_id = src.cid AND target.menu_item_id = src.mid
      WHEN MATCHED THEN
        UPDATE SET quantity = target.quantity + @quantity
      WHEN NOT MATCHED THEN
        INSERT (customer_id, menu_item_id, quantity)
        VALUES (@customerId, @menuItemId, @quantity);
    `);
  return getCart(customerId);
}

async function updateCartItem(cartId, customerId, quantity) {
  const pool = await getPool();
  const result = await pool.request()
    .input("cartId", sql.Int, cartId)
    .input("customerId", sql.Int, customerId)
    .input("quantity", sql.Int, quantity)
    .query(`UPDATE Cart SET quantity = @quantity
            WHERE cart_id = @cartId AND customer_id = @customerId;`);
  return result.rowsAffected[0]; // 0 = not found or not theirs
}

async function removeCartItem(cartId, customerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("cartId", sql.Int, cartId)
    .input("customerId", sql.Int, customerId)
    .query(`DELETE FROM Cart WHERE cart_id = @cartId AND customer_id = @customerId;`);
  return result.rowsAffected[0];
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };