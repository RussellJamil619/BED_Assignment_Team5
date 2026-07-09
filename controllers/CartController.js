const cartModel = require("../models/cartModel");

async function viewCart(req, res) {
  try {
    res.json(await cartModel.getCart(req.user.customer_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load cart" });
  }
}

async function addItem(req, res) {
  try {
    const { menu_item_id, quantity } = req.body;
    const cart = await cartModel.addToCart(req.user.customer_id, menu_item_id, quantity);
    res.status(201).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
}

async function updateItem(req, res) {
  try {
    const affected = await cartModel.updateCartItem(
      parseInt(req.params.cartId, 10), req.user.customer_id, req.body.quantity);
    if (affected === 0) return res.status(404).json({ error: "Cart item not found" });
    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update cart" });
  }
}

async function removeItem(req, res) {
  try {
    const affected = await cartModel.removeCartItem(
      parseInt(req.params.cartId, 10), req.user.customer_id);
    if (affected === 0) return res.status(404).json({ error: "Cart item not found" });
    res.json({ message: "Removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove item" });
  }
}

module.exports = { viewCart, addItem, updateItem, removeItem };