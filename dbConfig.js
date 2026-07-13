require("dotenv").config();

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    instanceName: process.env.DB_INSTANCE,   // SQLEXPRESS
    encrypt: false,                           // local dev, no SSL
    trustServerCertificate: true
  },
  port: parseInt(process.env.DB_PORT, 10),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};