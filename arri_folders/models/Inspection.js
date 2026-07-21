const { sql, getPool } = require("../db");

async function getAllInspections(stallId) {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT i.inspection_id, i.stall_id, s.stall_name, i.officer_id, o.name AS officer_name,
           i.inspection_date, i.score, i.remarks
    FROM Inspection i
    JOIN Stall s   ON i.stall_id = s.stall_id
    JOIN Officer o ON i.officer_id = o.officer_id
  `;

  if (stallId) {
    query += ` WHERE i.stall_id = @stallId`;
    request.input("stallId", sql.Int, stallId);
  }
  query += ` ORDER BY i.inspection_date DESC;`;

  const result = await request.query(query);
  return result.recordset;
}

async function getInspectionById(inspectionId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("inspectionId", sql.Int, inspectionId)
    .query(`
      SELECT i.inspection_id, i.stall_id, s.stall_name, i.officer_id, o.name AS officer_name,
             i.inspection_date, i.score, i.remarks
      FROM Inspection i
      JOIN Stall s   ON i.stall_id = s.stall_id
      JOIN Officer o ON i.officer_id = o.officer_id
      WHERE i.inspection_id = @inspectionId;
    `);

  return result.recordset[0] || null;
}

async function createInspection({ stallId, officerId, score, remarks }) {
  const pool = await getPool();

  const stallCheck = await pool.request()
    .input("stallId", sql.Int, stallId)
    .query(`SELECT stall_id FROM Stall WHERE stall_id = @stallId;`);
  if (stallCheck.recordset.length === 0) {
    const err = new Error("stallId does not exist");
    err.status = 400;
    throw err;
  }

  const officerCheck = await pool.request()
    .input("officerId", sql.Int, officerId)
    .query(`SELECT officer_id FROM Officer WHERE officer_id = @officerId;`);
  if (officerCheck.recordset.length === 0) {
    const err = new Error("officerId does not exist");
    err.status = 400;
    throw err;
  }

  const result = await pool.request()
    .input("stallId", sql.Int, stallId)
    .input("officerId", sql.Int, officerId)
    .input("score", sql.Int, score)
    .input("remarks", sql.NVarChar, remarks || null)
    .query(`
      INSERT INTO Inspection (stall_id, officer_id, score, remarks)
      OUTPUT INSERTED.inspection_id
      VALUES (@stallId, @officerId, @score, @remarks);
    `);

  return result.recordset[0].inspection_id;
}

async function updateInspection(inspectionId, { score, remarks }) {
  const pool = await getPool();

  const existing = await pool.request()
    .input("inspectionId", sql.Int, inspectionId)
    .query(`SELECT inspection_id FROM Inspection WHERE inspection_id = @inspectionId;`);
  if (existing.recordset.length === 0) {
    const err = new Error("Inspection not found");
    err.status = 404;
    throw err;
  }

  await pool.request()
    .input("inspectionId", sql.Int, inspectionId)
    .input("score", sql.Int, score)
    .input("remarks", sql.NVarChar, remarks)
    .query(`UPDATE Inspection SET score = @score, remarks = @remarks
            WHERE inspection_id = @inspectionId;`);
}

async function deleteInspection(inspectionId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("inspectionId", sql.Int, inspectionId)
    .query(`DELETE FROM Inspection WHERE inspection_id = @inspectionId;`);

  if (result.rowsAffected[0] === 0) {
    const err = new Error("Inspection not found");
    err.status = 404;
    throw err;
  }
}

module.exports = {
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection
};