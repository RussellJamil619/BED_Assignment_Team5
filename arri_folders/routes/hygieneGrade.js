const express = require("express");
const router = express.Router();
const controller = require("../controllers/hygieneGradeController");
const validateHygieneGrade = require("../middlewares/ValidateHygieneGrade");

router.post("/", validateHygieneGrade, controller.createHygieneGrade);
router.get("/stall/:stallId", controller.getHygieneHistory);

module.exports = router;