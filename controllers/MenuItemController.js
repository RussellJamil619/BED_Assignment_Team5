// controllers/menuItemController.js
// Owner: Leslie

const menuItemModel = require("../models/MenuItemModel");

const FK_VIOLATION = 547; // SQL Server error number for a foreign key breach

// GET /menuitems  (optionally ?stall_id=1&category=Drink)
async function getAllMenuItems(req, res) {
  try {
    const items = await menuItemModel.getAllMenuItems(req.query);

    res.status(200).json({
      count: items.length,
      data: items
    });
  } catch (err) {
    console.error("getAllMenuItems failed:", err);
    res.status(500).json({ message: "Error retrieving menu items" });
  }
}

// GET /menuitems/:id
async function getMenuItemById(req, res) {
  try {
    const { id } = req.params;
    const item = await menuItemModel.getMenuItemById(id);

    // Model returns undefined when nothing matched
    if (!item) {
      return res.status(404).json({ message: `Menu item ${id} not found` });
    }

    res.status(200).json(item);
  } catch (err) {
    console.error("getMenuItemById failed:", err);
    res.status(500).json({ message: "Error retrieving menu item" });
  }
}

// GET /menuitems/:id/cuisines
async function getMenuItemWithCuisines(req, res) {
  try {
    const { id } = req.params;
    const item = await menuItemModel.getMenuItemWithCuisines(id);

    if (!item) {
      return res.status(404).json({ message: `Menu item ${id} not found` });
    }

    res.status(200).json(item);
  } catch (err) {
    console.error("getMenuItemWithCuisines failed:", err);
    res.status(500).json({ message: "Error retrieving menu item cuisines" });
  }
}

// POST /menuitems
async function createMenuItem(req, res) {
  try {
    // Joi checks stall_id is a positive number, but only the database
    // knows whether that stall actually exists
    const exists = await menuItemModel.stallExists(req.body.stall_id);
    if (!exists) {
      return res.status(400).json({
        message: `Cannot create menu item: stall ${req.body.stall_id} does not exist`
      });
    }

    const newItem = await menuItemModel.createMenuItem(req.body);

    res.status(201).json(newItem); // 201 = a new resource was created
  } catch (err) {
    console.error("createMenuItem failed:", err);
    res.status(500).json({ message: "Error creating menu item" });
  }
}

// PUT /menuitems/:id
async function updateMenuItem(req, res) {
  try {
    const { id } = req.params;

    const exists = await menuItemModel.stallExists(req.body.stall_id);
    if (!exists) {
      return res.status(400).json({
        message: `Cannot update menu item: stall ${req.body.stall_id} does not exist`
      });
    }

    const updated = await menuItemModel.updateMenuItem(id, req.body);

    if (!updated) {
      return res.status(404).json({ message: `Menu item ${id} not found` });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("updateMenuItem failed:", err);
    res.status(500).json({ message: "Error updating menu item" });
  }
}

// DELETE /menuitems/:id
async function deleteMenuItem(req, res) {
  try {
    const { id } = req.params;
    const rowsDeleted = await menuItemModel.deleteMenuItem(id);

    if (rowsDeleted === 0) {
      return res.status(404).json({ message: `Menu item ${id} not found` });
    }

    res.status(200).json({ message: `Menu item ${id} deleted successfully` });
  } catch (err) {
    // If the dish is already in an order, a like, or a cuisine link,
    // SQL Server refuses to delete it. That is a conflict (409), not a crash.
    if (err.number === FK_VIOLATION) {
      return res.status(409).json({
        message: `Cannot delete menu item ${req.params.id} because it is used by existing orders, likes, or cuisine links`,
        hint: "Set is_available to false instead"
      });
    }

    console.error("deleteMenuItem failed:", err);
    res.status(500).json({ message: "Error deleting menu item" });
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  getMenuItemWithCuisines,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};