const HygieneGrade = require("../models/HygieneGrade");

async function createHygieneGrade(req, res) {
  try {
    const { inspectionId, validFrom, validTo } = req.body;
    const result = await HygieneGrade.createHygieneGrade({ inspectionId, validFrom, validTo });
    res.status(201).json({ message: "Hygiene grade assigned", ...result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getHygieneHistory(req, res) {
  try {
    const history = await HygieneGrade.getHygieneHistory(req.params.stallId);
    res.json(history);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { createHygieneGrade, getHygieneHistory };