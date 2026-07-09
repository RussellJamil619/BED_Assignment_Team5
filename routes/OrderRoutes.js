const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {
  validateBody,
  checkoutSchema,
  addonsSchema,
} = require("../middlewares/ValidateOrder");
const verifyToken = require("../middlewares/authMiddleware");

router.use(verifyToken);

router.post(
  "/checkout",
  validateBody(checkoutSchema),
  orderController.checkout,
);
router.get("/mine", orderController.myOrders);
router.post(
  "/:id/addons",
  validateBody(addonsSchema),
  orderController.addAddons,
);

module.exports = router;
