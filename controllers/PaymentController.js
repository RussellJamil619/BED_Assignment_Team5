// Owner: Jusitn

const paymentModel = require("../models/paymentModel");

async function myPayments(req, res) {
  try {
    res.json(await paymentModel.getMyPayments(req.user.customer_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payments" });
  }
}

async function getPayment(req, res) {
  try {
    const payment = await paymentModel.getPaymentById(
      parseInt(req.params.id, 10), req.user.customer_id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payment" });
  }
}

async function updatePayment(req, res) {
  try {
    const affected = await paymentModel.updatePaymentStatus(
      parseInt(req.params.id, 10), req.user.customer_id, req.body.payment_status);
    if (affected === 0) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update payment" });
  }
}
async function remove(req, res) {
  try {
    const rows = await paymentModel.deletePayment(Number(req.params.id), req.user.customer_id);
    if (rows === 0) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete payment" });
  }
}

module.exports = { myPayments, getPayment, updatePayment, remove };