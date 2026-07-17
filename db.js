// db.js
const sql = require("mssql");
require("dotenv").config();   // load standard .env

console.log('📝 DB_USER from env:', process.env.DB_USER);
console.log('📝 DB_SERVER from env:', process.env.DB_SERVER);

// Use SQL Server Authentication
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'HawkerCentreDB',
    options: {
        instanceName: process.env.DB_INSTANCE,   // SQLEXPRESS
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

console.log('📝 User:', config.user);
console.log('📝 Server:', config.server);
console.log('📝 Database:', config.database);

let poolPromise;

async function getPool() {
    if (poolPromise) {
        return poolPromise;
    }
    try {
        console.log('🔄 Connecting to database...');
        poolPromise = await sql.connect(config);
        console.log('✅ Database connected successfully!');
        return poolPromise;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

module.exports = { sql, getPool };