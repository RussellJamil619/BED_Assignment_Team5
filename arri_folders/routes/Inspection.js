const express = require("express");
const router = express.Router();
const controller = require("../controllers/inspectionController");
const validateInspection = require("../middlewares/ValidateInspection");
const authMiddleware = require("../middlewares/AuthMiddleware"); // Leslie's shared middleware
const requireOfficerRole = require("../middlewares/RequireOfficerRole");

router.get("/", controller.getAllInspections);
router.get("/:id", controller.getInspectionById);
router.post("/", validateInspection, controller.createInspection);
router.put("/:id", controller.updateInspection);
router.delete("/:id", controller.deleteInspection);
router.post("/", authMiddleware, requireOfficerRole, validateInspection, controller.createInspection);
router.put("/:id", authMiddleware, requireOfficerRole, controller.updateInspection);
router.delete("/:id", authMiddleware, requireOfficerRole, controller.deleteInspection);

module.exports = router;