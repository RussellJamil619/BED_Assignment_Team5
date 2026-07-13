// db.js
const sql = require("mssql");
const dotenv = require('dotenv');

// Load YOUR .env file
dotenv.config({ path: '.env.russell' });

const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'HawkerCentreDB',
    options: {
        trustedConnection: true,
        encrypt: true,
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