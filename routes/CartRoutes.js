const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { validateBody, cartItemSchema } = require("../middlewares/validate");
const verifyToken = require("../middlewares/authMiddleware"); // <-- Russell's JWT middleware

router.use(verifyToken); // all cart routes require login

router.get("/", cartController.viewCart);
router.post("/", validateBody(cartItemSchema), cartController.addItem);
router.put("/:cartId", cartController.updateItem);
router.delete("/:cartId", cartController.removeItem);

module.exports = router;