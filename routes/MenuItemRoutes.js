// routes/menuItemRoutes.js
// Owner: Leslie

const express = require("express");
const router = express.Router();

const controller = require("../controllers/menuItemController");
const {
  validateMenuItem,
  validateMenuItemId,
  validateMenuItemQuery
} = require("../middlewares/ValidateMenuItem.js");

// Paths are relative to the prefix in app.js: app.use("/menuitems", menuItemRoutes)

router.get("/", validateMenuItemQuery, controller.getAllMenuItems);

// Must come BEFORE "/:id" — Express matches top to bottom, so "/:id"
// would otherwise swallow "5/cuisines"
router.get("/:id/cuisines", validateMenuItemId, controller.getMenuItemWithCuisines);

router.get("/:id", validateMenuItemId, controller.getMenuItemById);

// Validation runs before the controller. If it fails it sends a 400
// and never calls next(), so the controller is skipped.
router.post("/", validateMenuItem, controller.createMenuItem);

// PUT checks both the id and the body, so two middlewares run
router.put("/:id", validateMenuItemId, validateMenuItem, controller.updateMenuItem);

// DELETE has no body, so only the id is validated
router.delete("/:id", validateMenuItemId, controller.deleteMenuItem);

module.exports = router;