// Russell's - Complaint Model
const { sql, getPool } = require('../db');

class Complaint {
    static async create(data) {
        try {
            const pool = await getPool();
            const query = `
                INSERT INTO Complaint (customer_id, stall_id, subject, description, status, complaint_date)
                OUTPUT INSERTED.complaint_id, INSERTED.subject, INSERTED.description, INSERTED.status
                VALUES (@customer_id, @stall_id, @subject, @description, 'Open', GETDATE())
            `;
            const result = await pool.request()
                .input('customer_id', sql.Int, data.customer_id)
                .input('stall_id', sql.Int, data.stall_id)
                .input('subject', sql.VarChar, data.subject)
                .input('description', sql.VarChar, data.description || null)
                .query(query);
            return result.recordset[0];
        } catch (error) {
            console.error('Error creating complaint:', error);
            throw error;
        }
    }

    static async getByCustomer(customerId) {
        try {
            const pool = await getPool();
            const query = `
                SELECT c.*, s.stall_name 
                FROM Complaint c 
                INNER JOIN Stall s ON c.stall_id = s.stall_id 
                WHERE c.customer_id = @customerId 
                ORDER BY c.complaint_date DESC
            `;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(query);
            return result.recordset;
        } catch (error) {
            console.error('Error getting complaints by customer:', error);
            throw error;
        }
    }

    static async getByStall(stallId) {
        try {
            const pool = await getPool();
            const query = `
                SELECT c.*, cust.name as customer_name 
                FROM Complaint c 
                INNER JOIN Customer cust ON c.customer_id = cust.customer_id 
                WHERE c.stall_id = @stallId 
                ORDER BY c.complaint_date DESC
            `;
            const result = await pool.request()
                .input('stallId', sql.Int, stallId)
                .query(query);
            return result.recordset;
        } catch (error) {
            console.error('Error getting complaints by stall:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const pool = await getPool();
            const query = `
                SELECT c.*, cust.name as customer_name, s.stall_name 
                FROM Complaint c 
                INNER JOIN Customer cust ON c.customer_id = cust.customer_id 
                INNER JOIN Stall s ON c.stall_id = s.stall_id 
                ORDER BY c.complaint_date DESC
            `;
            const result = await pool.request().query(query);
            return result.recordset;
        } catch (error) {
            console.error('Error getting all complaints:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const pool = await getPool();
            const query = `
                SELECT c.*, cust.name as customer_name, s.stall_name 
                FROM Complaint c 
                INNER JOIN Customer cust ON c.customer_id = cust.customer_id 
                INNER JOIN Stall s ON c.stall_id = s.stall_id 
                WHERE c.complaint_id = @id
            `;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error getting complaint by ID:', error);
            throw error;
        }
    }

    static async updateStatus(id, status) {
        try {
            const pool = await getPool();
            const query = `UPDATE Complaint SET status = @status WHERE complaint_id = @id`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('status', sql.VarChar, status)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error updating complaint status:', error);
            throw error;
        }
    }

    static async delete(id, customerId) {
        try {
            const pool = await getPool();
            const query = `DELETE FROM Complaint WHERE complaint_id = @id AND customer_id = @customerId`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('customerId', sql.Int, customerId)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('Error deleting complaint:', error);
            throw error;
        }
    }
}

module.exports = Complaint;