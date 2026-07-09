// Owner: Jusitn

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { validateBody, updatePaymentSchema } = require("../middlewares/validatePayment");
const verifyToken = require("../middlewares/authMiddleware"); // <-- match Russell's actual filename

router.use(verifyToken); // all payment routes require login

router.get("/mine", paymentController.myPayments);
router.get("/:id", paymentController.getPayment);
router.put("/:id", validateBody(updatePaymentSchema), paymentController.updatePayment);

module.exports = router;