const Inspection = require("../models/Inspection");

async function getAllInspections(req, res) {
  try {
    const { stallId } = req.query;
    const inspections = await Inspection.getAllInspections(stallId);
    res.json(inspections);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getInspectionById(req, res) {
  try {
    const inspection = await Inspection.getInspectionById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ error: "Inspection not found" });
    }
    res.json(inspection);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function createInspection(req, res) {
  try {
    const { stallId, officerId, score, remarks } = req.body;
    const inspectionId = await Inspection.createInspection({ stallId, officerId, score, remarks });
    res.status(201).json({ message: "Inspection recorded", inspection_id: inspectionId });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function updateInspection(req, res) {
  try {
    await Inspection.updateInspection(req.params.id, req.body);
    res.json({ message: "Inspection updated" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteInspection(req, res) {
  try {
    await Inspection.deleteInspection(req.params.id);
    res.json({ message: "Inspection deleted" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection
};