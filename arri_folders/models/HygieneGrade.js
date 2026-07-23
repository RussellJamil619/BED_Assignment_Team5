const { sql, getPool } = require("../db");

function deriveGrade(score) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

// ---- FEATURE: derive and assign a hygiene grade from an inspection score ----
async function createHygieneGrade({ inspectionId, validFrom, validTo }) {
  const pool = await getPool();

  const inspection = (await pool.request()
    .input("inspectionId", sql.Int, inspectionId)
    .query(`SELECT inspection_id, stall_id, score FROM Inspection WHERE inspection_id = @inspectionId;`)
  ).recordset[0];

  if (!inspection) {
    const err = new Error("inspectionId does not exist");
    err.status = 400;
    throw err;
  }

  const grade = deriveGrade(inspection.score);

  const result = await pool.request()
    .input("stallId", sql.Int, inspection.stall_id)
    .input("inspectionId", sql.Int, inspectionId)
    .input("grade", sql.Char(1), grade)
    .input("validFrom", sql.Date, validFrom)
    .input("validTo", sql.Date, validTo)
    .query(`
      INSERT INTO HygieneGrade (stall_id, inspection_id, grade, valid_from, valid_to)
      OUTPUT INSERTED.grade_id
      VALUES (@stallId, @inspectionId, @grade, @validFrom, @validTo);
    `);

  return { grade_id: result.recordset[0].grade_id, grade };
}

// ---- FEATURE: view a stall's hygiene grade history ----
async function getHygieneHistory(stallId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("stallId", sql.Int, stallId)
    .query(`
      SELECT g.grade_id, g.stall_id, s.stall_name, g.inspection_id, g.grade, g.valid_from, g.valid_to
      FROM HygieneGrade g
      JOIN Stall s ON g.stall_id = s.stall_id
      WHERE g.stall_id = @stallId
      ORDER BY g.valid_from DESC;
    `);

  return result.recordset;
}

module.exports = { createHygieneGrade, getHygieneHistory, deriveGrade };