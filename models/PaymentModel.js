// Owner: Jusitn

const { sql, getPool } = require("../db");

// Payment history for the logged-in customer (Payment -> Orders -> customer)
async function getMyPayments(customerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT p.payment_id, p.order_id, p.amount, p.payment_method,
             p.payment_status, p.payment_datetime,
             o.stall_id, s.stall_name, o.status AS order_status
      FROM Payment p
      JOIN Orders o ON p.order_id = o.order_id
      JOIN Stall s  ON o.stall_id = s.stall_id
      WHERE o.customer_id = @customerId
      ORDER BY p.payment_datetime DESC;
    `);
  return result.recordset;
}

// One payment, scoped to its owner (returns undefined if not theirs)
async function getPaymentById(paymentId, customerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("paymentId", sql.Int, paymentId)
    .input("customerId", sql.Int, customerId)
    .query(`
      SELECT p.payment_id, p.order_id, p.amount, p.payment_method,
             p.payment_status, p.payment_datetime, o.customer_id
      FROM Payment p
      JOIN Orders o ON p.order_id = o.order_id
      WHERE p.payment_id = @paymentId AND o.customer_id = @customerId;
    `);
  return result.recordset[0];
}

// Update status (e.g. confirm a Pending payment), scoped to owner.
// rowsAffected 0 = not found or not theirs.
async function updatePaymentStatus(paymentId, customerId, newStatus) {
  const pool = await getPool();
  const result = await pool.request()
    .input("paymentId", sql.Int, paymentId)
    .input("customerId", sql.Int, customerId)
    .input("newStatus", sql.VarChar(20), newStatus)
    .query(`
      UPDATE p
      SET p.payment_status = @newStatus
      FROM Payment p
      JOIN Orders o ON p.order_id = o.order_id
      WHERE p.payment_id = @paymentId AND o.customer_id = @customerId;
    `);
  return result.rowsAffected[0];
}

module.exports = { getMyPayments, getPaymentById, updatePaymentStatus };