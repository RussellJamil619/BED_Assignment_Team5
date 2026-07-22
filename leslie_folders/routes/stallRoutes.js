// leslie_folders/routes/stallRoutes.js
// Owner: Leslie

const express = require("express");
const router = express.Router();

const controller = require("../controllers/stallController");
const {
  validateStall,
  validateStallId,
  validateStallQuery
} = require("../middlewares/validateStall");

// Prefix set in app.js:
// app.use("/stalls", require("./leslie_folders/routes/stallRoutes"))

router.get("/", validateStallQuery, controller.getAllStalls);

// Before "/:id" so "5/menuitems" isn't swallowed by the id route
router.get("/:id/menuitems", validateStallId, controller.getStallWithMenuItems);

router.get("/:id", validateStallId, controller.getStallById);

router.post("/", validateStall, controller.createStall);

router.put("/:id", validateStallId, validateStall, controller.updateStall);

router.delete("/:id", validateStallId, controller.deleteStall);

module.exports = router;