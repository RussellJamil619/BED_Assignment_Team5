// Owner: Jusitn

const orderModel = require("../models/orderModel");

async function checkout(req, res) {
  try {
    const orders = await orderModel.checkout(req.user.customer_id, req.body.payment_method);
    res.status(201).json({
      message: `Checkout complete: ${orders.length} order(s) created`,
      orders,
    });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Checkout failed" });
  }
}

async function addAddons(req, res) {
  try {
    const result = await orderModel.addAddonsToOrder(
      parseInt(req.params.id, 10), req.user.customer_id, req.body.addons);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Failed to add add-ons" });
  }
}

async function myOrders(req, res) {
  try {
    res.json(await orderModel.getMyOrders(req.user.customer_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load orders" });
  }
}
async function updateStatus(req, res) {
  try {
    const rows = await orderModel.updateOrderStatus(
      Number(req.params.id), req.user.customer_id, req.body.status
    );
    if (rows === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
}

async function cancel(req, res) {
  try {
    const rows = await orderModel.cancelOrder(Number(req.params.id), req.user.customer_id);
    if (rows === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel order" });
  }
}

module.exports = { checkout, addAddons, myOrders, updateStatus, cancel };