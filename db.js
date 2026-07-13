// db.js
const sql = require("mssql");
const dbConfig = require("./dbConfig");

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
}

module.exports = { sql, getPool };