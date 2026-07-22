// Owner: Justin

const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const {
  validateBody,
  cartItemSchema,
} = require("../middlewares/ValidateOrder");
// const verifyToken = require("../middlewares/authMiddleware"); // TODO: re-enable when Russell's file is in
// router.use(verifyToken); // all cart routes require login

router.get("/", cartController.viewCart);
router.post("/", validateBody(cartItemSchema), cartController.addItem);
router.put("/:cartId", cartController.updateItem);
router.delete("/:cartId", cartController.removeItem);

module.exports = router;