// leslie_folders/models/stallModel.js
// Owner: Leslie

const sql = require("mssql");
const dbConfig = require("../../dbConfig"); // two levels up to root

let poolPromise = null;
function getPool() {
  if (!poolPromise) poolPromise = sql.connect(dbConfig);
  return poolPromise;
}

async function getAllStalls(filters = {}) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("hawker_centre_id", sql.Int, filters.hawker_centre_id ?? null)
    .query(`
      SELECT stall_id, hawker_centre_id, stall_owner_id,
             stall_name, unit_number, cuisine_specialty
      FROM Stall
      WHERE (@hawker_centre_id IS NULL OR hawker_centre_id = @hawker_centre_id)
      ORDER BY hawker_centre_id, unit_number
    `);
  return result.recordset;
}

async function getStallById(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT stall_id, hawker_centre_id, stall_owner_id,
             stall_name, unit_number, cuisine_specialty
      FROM Stall
      WHERE stall_id = @id
    `);
  return result.recordset[0];
}

// L7 — stall plus every dish it sells, in one round trip
async function getStallWithMenuItems(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query(`
      SELECT s.stall_id, s.hawker_centre_id, s.stall_owner_id,
             s.stall_name, s.unit_number, s.cuisine_specialty,
             mi.menu_item_id, mi.name, mi.description,
             mi.price, mi.category, mi.is_available
      FROM Stall s
      LEFT JOIN MenuItem mi ON s.stall_id = mi.stall_id
      WHERE s.stall_id = @id
      ORDER BY mi.category, mi.name
    `);
  // LEFT JOIN: a brand-new stall with zero dishes still returns, with an empty list

  if (result.recordset.length === 0) return undefined;

  const first = result.recordset[0];
  const stall = {
    stall_id:          first.stall_id,
    hawker_centre_id:  first.hawker_centre_id,
    stall_owner_id:    first.stall_owner_id,
    stall_name:        first.stall_name,
    unit_number:       first.unit_number,
    cuisine_specialty: first.cuisine_specialty,
    menuitems: []
  };
  for (const row of result.recordset) {
    if (row.menu_item_id !== null) { // null when the stall has no dishes
      stall.menuitems.push({
        menu_item_id: row.menu_item_id,
        name:         row.name,
        description:  row.description,
        price:        row.price,
        category:     row.category,
        is_available: row.is_available
      });
    }
  }
  return stall;
}

async function createStall(data) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("hawker_centre_id",  sql.Int,          data.hawker_centre_id)
    .input("stall_owner_id",    sql.Int,          data.stall_owner_id)
    .input("stall_name",        sql.VarChar(100), data.stall_name)
    .input("unit_number",       sql.VarChar(20),  data.unit_number)
    .input("cuisine_specialty", sql.VarChar(50),  data.cuisine_specialty ?? null)
    .query(`
      INSERT INTO Stall (hawker_centre_id, stall_owner_id, stall_name, unit_number, cuisine_specialty)
      OUTPUT INSERTED.*
      VALUES (@hawker_centre_id, @stall_owner_id, @stall_name, @unit_number, @cuisine_specialty)
    `);
  return result.recordset[0];
}

async function updateStall(id, data) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id",                sql.Int,          id)
    .input("hawker_centre_id",  sql.Int,          data.hawker_centre_id)
    .input("stall_owner_id",    sql.Int,          data.stall_owner_id)
    .input("stall_name",        sql.VarChar(100), data.stall_name)
    .input("unit_number",       sql.VarChar(20),  data.unit_number)
    .input("cuisine_specialty", sql.VarChar(50),  data.cuisine_specialty ?? null)
    .query(`
      UPDATE Stall
      SET hawker_centre_id  = @hawker_centre_id,
          stall_owner_id    = @stall_owner_id,
          stall_name        = @stall_name,
          unit_number       = @unit_number,
          cuisine_specialty = @cuisine_specialty
      OUTPUT INSERTED.*
      WHERE stall_id = @id
    `);
  return result.recordset[0];
}

async function deleteStall(id) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query("DELETE FROM Stall WHERE stall_id = @id");
  return result.rowsAffected[0];
}

// ---- existence / duplicate checks (used by the controller for clear 400s/409s) ----

async function hawkerCentreExists(id) {
  const pool = await getPool();
  const r = await pool.request().input("id", sql.Int, id)
    .query("SELECT 1 AS found FROM HawkerCentre WHERE hawker_centre_id = @id");
  return r.recordset.length > 0;
}

async function stallOwnerExists(id) {
  const pool = await getPool();
  const r = await pool.request().input("id", sql.Int, id)
    .query("SELECT 1 AS found FROM StallOwner WHERE stall_owner_id = @id");
  return r.recordset.length > 0;
}

// Same unit number can exist in DIFFERENT centres, not twice in one centre.
// excludeStallId lets an update keep its own unit number without matching itself.
async function unitTaken(hawkerCentreId, unitNumber, excludeStallId = null) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("hc",      sql.Int,         hawkerCentreId)
    .input("unit",    sql.VarChar(20), unitNumber)
    .input("exclude", sql.Int,         excludeStallId)
    .query(`
      SELECT 1 AS found FROM Stall
      WHERE hawker_centre_id = @hc AND unit_number = @unit
        AND (@exclude IS NULL OR stall_id <> @exclude)
    `);
  return r.recordset.length > 0;
}

module.exports = {
  getAllStalls,
  getStallById,
  getStallWithMenuItems,
  createStall,
  updateStall,
  deleteStall,
  hawkerCentreExists,
  stallOwnerExists,
  unitTaken
};