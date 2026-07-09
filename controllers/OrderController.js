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

module.exports = { checkout, addAddons, myOrders };