const express = require("express");
const router = express.Router();
const controller = require("../controllers/inspectionController");
const validateInspection = require("../middlewares/ValidateInspection");

router.get("/", controller.getAllInspections);
router.get("/:id", controller.getInspectionById);
router.post("/", validateInspection, controller.createInspection);
router.put("/:id", controller.updateInspection);
router.delete("/:id", controller.deleteInspection);

module.exports = router;