// leslie_folders/models/menuItemModel.js
// Owner: Leslie

const sql = require("mssql");
const dbConfig = require("../../dbConfig"); // two levels up: leslie_folders/models -> root

// Reuse one connection pool instead of connecting on every request
let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

async function getAllMenuItems(filters = {}) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("stall_id", sql.Int, filters.stall_id ?? null)
    .input("category", sql.VarChar(50), filters.category ?? null)
    .query(`
      SELECT menu_item_id, stall_id, name, description, price, category, is_available
      FROM MenuItem
      WHERE (@stall_id IS NULL OR stall_id = @stall_id)
        AND (@category IS NULL OR category = @category)
      ORDER BY stall_id, name
    `);
  // If a filter is null, "@param IS NULL" is true so that condition is ignored.
  // Lets one query handle all filter combinations.

  return result.recordset;
}

async function getMenuItemById(id) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT menu_item_id, stall_id, name, description, price, category, is_available
      FROM MenuItem
      WHERE menu_item_id = @id
    `);

  return result.recordset[0]; // undefined if no row matched
}

// Many-to-many read: MenuItem -> MenuItemCuisine -> Cuisine
async function getMenuItemWithCuisines(id) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT
        mi.menu_item_id, mi.stall_id, mi.name, mi.description,
        mi.price, mi.category, mi.is_available,
        c.cuisine_id, c.cuisine_name
      FROM MenuItem mi
      LEFT JOIN MenuItemCuisine mic ON mi.menu_item_id = mic.menu_item_id
      LEFT JOIN Cuisine c           ON mic.cuisine_id  = c.cuisine_id
      WHERE mi.menu_item_id = @id
    `);
  // LEFT JOIN not INNER: a dish with no cuisines tagged should still be returned

  if (result.recordset.length === 0) return undefined;

  // SQL gives one row per cuisine, so the dish columns repeat.
  // Take them from the first row, then collect the cuisines into an array.
  const first = result.recordset[0];

  const menuItem = {
    menu_item_id: first.menu_item_id,
    stall_id:     first.stall_id,
    name:         first.name,
    description:  first.description,
    price:        first.price,
    category:     first.category,
    is_available: first.is_available,
    cuisines:     []
  };

  for (const row of result.recordset) {
    if (row.cuisine_id !== null) { // null when the dish has no cuisines
      menuItem.cuisines.push({
        cuisine_id:   row.cuisine_id,
        cuisine_name: row.cuisine_name
      });
    }
  }

  return menuItem;
}

async function createMenuItem(data) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("stall_id",     sql.Int,           data.stall_id)
    .input("name",         sql.VarChar(100),  data.name)
    .input("description",  sql.VarChar(255),  data.description ?? null)
    .input("price",        sql.Decimal(10,2), data.price)
    .input("category",     sql.VarChar(50),   data.category)
    .input("is_available", sql.Bit,           data.is_available)
    .query(`
      INSERT INTO MenuItem (stall_id, name, description, price, category, is_available)
      OUTPUT INSERTED.*
      VALUES (@stall_id, @name, @description, @price, @category, @is_available)
    `);
  // OUTPUT INSERTED.* returns the new row including the auto-generated id

  return result.recordset[0];
}

async function updateMenuItem(id, data) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id",           sql.Int,           id)
    .input("stall_id",     sql.Int,           data.stall_id)
    .input("name",         sql.VarChar(100),  data.name)
    .input("description",  sql.VarChar(255),  data.description ?? null)
    .input("price",        sql.Decimal(10,2), data.price)
    .input("category",     sql.VarChar(50),   data.category)
    .input("is_available", sql.Bit,           data.is_available)
    .query(`
      UPDATE MenuItem
      SET stall_id     = @stall_id,
          name         = @name,
          description  = @description,
          price        = @price,
          category     = @category,
          is_available = @is_available
      OUTPUT INSERTED.*
      WHERE menu_item_id = @id
    `);

  return result.recordset[0]; // undefined if the id did not exist
}

async function deleteMenuItem(id) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM MenuItem WHERE menu_item_id = @id");

  return result.rowsAffected[0]; // 0 = not found, 1 = deleted
}

// Used before insert/update so we can return a clear error
// instead of letting the foreign key blow up
async function stallExists(stallId) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input("stall_id", sql.Int, stallId)
    .query("SELECT 1 AS found FROM Stall WHERE stall_id = @stall_id");

  return result.recordset.length > 0;
}

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  getMenuItemWithCuisines,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  stallExists
};