// db.js
const sql = require("mssql");
const dotenv = require('dotenv');
const path = require('path');

// Load .env.russell from the root folder
const envPath = path.join(__dirname, '.env.russell');
console.log('📝 Looking for .env at:', envPath);

// Check if file exists
const fs = require('fs');
if (fs.existsSync(envPath)) {
    console.log('✅ Found .env.russell!');
    dotenv.config({ path: envPath });
} else {
    console.log('❌ .env.russell NOT found at:', envPath);
    // Try loading .env as fallback
    dotenv.config();
}

console.log('📝 DB_SERVER from env:', process.env.DB_SERVER);
console.log('📝 DB_DATABASE from env:', process.env.DB_DATABASE);

// Use SQL Server Authentication
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'HawkerCentreDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

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