// dbConfig.js - reads database settings from .env (contains NO secrets itself)
require("dotenv").config();

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,       // e.g. "localhost"
  database: process.env.DB_DATABASE,   // "HawkerCentreDB"
  options: {
    encrypt: true,
    trustServerCertificate: true       // needed for local SQL Server
  }
};
