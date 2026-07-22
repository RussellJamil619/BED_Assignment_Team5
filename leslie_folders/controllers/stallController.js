// leslie_folders/controllers/stallController.js
// Owner: Leslie

const stallModel = require("../models/stallModel");

const FK_VIOLATION = 547;

// Shared by create and update: both need the same three checks.
// Returns an error message string, or null if everything is fine.
async function validateReferences(body, excludeStallId = null) {
  if (!(await stallModel.hawkerCentreExists(body.hawker_centre_id))) {
    return `Hawker centre ${body.hawker_centre_id} does not exist`;
  }
  if (!(await stallModel.stallOwnerExists(body.stall_owner_id))) {
    return `Stall owner ${body.stall_owner_id} does not exist`;
  }
  if (await stallModel.unitTaken(body.hawker_centre_id, body.unit_number, excludeStallId)) {
    return `Unit ${body.unit_number} is already taken in hawker centre ${body.hawker_centre_id}`;
  }
  return null;
}

// GET /stalls  (optionally ?hawker_centre_id=1)
async function getAllStalls(req, res) {
  try {
    const stalls = await stallModel.getAllStalls(req.query);
    res.status(200).json({ count: stalls.length, data: stalls });
  } catch (err) {
    console.error("getAllStalls failed:", err);
    res.status(500).json({ message: "Error retrieving stalls" });
  }
}

// GET /stalls/:id
async function getStallById(req, res) {
  try {
    const { id } = req.params;
    const stall = await stallModel.getStallById(id);
    if (!stall) return res.status(404).json({ message: `Stall ${id} not found` });
    res.status(200).json(stall);
  } catch (err) {
    console.error("getStallById failed:", err);
    res.status(500).json({ message: "Error retrieving stall" });
  }
}

// GET /stalls/:id/menuitems  (L7 — one call, stall + dishes)
async function getStallWithMenuItems(req, res) {
  try {
    const { id } = req.params;
    const stall = await stallModel.getStallWithMenuItems(id);
    if (!stall) return res.status(404).json({ message: `Stall ${id} not found` });
    res.status(200).json(stall);
  } catch (err) {
    console.error("getStallWithMenuItems failed:", err);
    res.status(500).json({ message: "Error retrieving stall menu" });
  }
}

// POST /stalls
async function createStall(req, res) {
  try {
    const problem = await validateReferences(req.body);
    if (problem) {
      // Duplicate unit is a conflict with existing data -> 409; missing FK -> 400
      const status = problem.includes("already taken") ? 409 : 400;
      return res.status(status).json({ message: `Cannot create stall: ${problem}` });
    }
    const newStall = await stallModel.createStall(req.body);
    res.status(201).json(newStall);
  } catch (err) {
    console.error("createStall failed:", err);
    res.status(500).json({ message: "Error creating stall" });
  }
}

// PUT /stalls/:id
async function updateStall(req, res) {
  try {
    const { id } = req.params;
    // exclude own id so a stall can keep its current unit number
    const problem = await validateReferences(req.body, Number(id));
    if (problem) {
      const status = problem.includes("already taken") ? 409 : 400;
      return res.status(status).json({ message: `Cannot update stall: ${problem}` });
    }
    const updated = await stallModel.updateStall(id, req.body);
    if (!updated) return res.status(404).json({ message: `Stall ${id} not found` });
    res.status(200).json(updated);
  } catch (err) {
    console.error("updateStall failed:", err);
    res.status(500).json({ message: "Error updating stall" });
  }
}

// DELETE /stalls/:id
async function deleteStall(req, res) {
  try {
    const { id } = req.params;
    const rowsDeleted = await stallModel.deleteStall(id);
    if (rowsDeleted === 0) {
      return res.status(404).json({ message: `Stall ${id} not found` });
    }
    res.status(200).json({ message: `Stall ${id} deleted successfully` });
  } catch (err) {
    if (err.number === FK_VIOLATION) {
      return res.status(409).json({
        message: `Cannot delete stall ${req.params.id} because it still has menu items, rental agreements, or other records`,
        hint: "Delete or reassign the stall's menu items first"
      });
    }
    console.error("deleteStall failed:", err);
    res.status(500).json({ message: "Error deleting stall" });
  }
}

module.exports = {
  getAllStalls,
  getStallById,
  getStallWithMenuItems,
  createStall,
  updateStall,
  deleteStall
};