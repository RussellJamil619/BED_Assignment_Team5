// Owner: Justin

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/PaymentController");
const {
  validateBody,
  updatePaymentSchema,
} = require("../middlewares/ValidatePayment");
const verifyToken = require("../middlewares/authMiddleware"); // TODO: re-enable when Russell's file is in
router.use(verifyToken); // all payment routes require login

router.get("/mine", paymentController.myPayments);
router.get("/:id", paymentController.getPayment);
router.put(
  "/:id",
  validateBody(updatePaymentSchema),
  paymentController.updatePayment,
);

module.exports = router;
