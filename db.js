// db.js
const sql = require("mssql");
const dbConfig = require("./dbConfig");   // <-- db.js imports dbConfig.js here

let poolPromise;
function getPool() { /* ... creates one shared pool ... */ }

module.exports = { sql, getPool };