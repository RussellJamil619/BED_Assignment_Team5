// Russell's - Feedback Model
const { sql, getPool } = require('../db');

class Feedback {
    static async create(data) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `
                INSERT INTO Feedback (customer_id, stall_id, rating, comments, feedback_date)
                OUTPUT INSERTED.feedback_id, INSERTED.rating, INSERTED.comments
                VALUES (@customer_id, @stall_id, @rating, @comments, GETDATE())
            `;
            const result = await pool.request()
                .input('customer_id', sql.Int, data.customer_id)
                .input('stall_id', sql.Int, data.stall_id)
                .input('rating', sql.Int, data.rating)
                .input('comments', sql.VarChar, data.comments || null)
                .query(query);
            return result.recordset[0];
        } catch (error) {
            console.error('🔴 Error creating feedback:', error);
            throw error;
        }
    }

    static async getByStall(stallId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `
                SELECT f.*, c.name as customer_name 
                FROM Feedback f 
                INNER JOIN Customer c ON f.customer_id = c.customer_id 
                WHERE f.stall_id = @stallId 
                ORDER BY f.feedback_date DESC
            `;
            const result = await pool.request()
                .input('stallId', sql.Int, stallId)
                .query(query);
            return result.recordset;
        } catch (error) {
            console.error('🔴 Error getting feedback by stall:', error);
            throw error;
        }
    }

    static async getByCustomer(customerId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `
                SELECT f.*, s.stall_name 
                FROM Feedback f 
                INNER JOIN Stall s ON f.stall_id = s.stall_id 
                WHERE f.customer_id = @customerId 
                ORDER BY f.feedback_date DESC
            `;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(query);
            return result.recordset;
        } catch (error) {
            console.error('🔴 Error getting feedback by customer:', error);
            throw error;
        }
    }

    static async getAvgRating(stallId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `
                SELECT AVG(CAST(rating AS DECIMAL(3,2))) as avg_rating, COUNT(*) as total 
                FROM Feedback WHERE stall_id = @stallId
            `;
            const result = await pool.request()
                .input('stallId', sql.Int, stallId)
                .query(query);
            return result.recordset[0];
        } catch (error) {
            console.error('🔴 Error getting average rating:', error);
            throw error;
        }
    }

    static async getByCustomerAndStall(customerId, stallId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `SELECT * FROM Feedback WHERE customer_id = @customerId AND stall_id = @stallId`;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('stallId', sql.Int, stallId)
                .query(query);
            return result.recordset[0] || null;
        } catch (error) {
            console.error('🔴 Error checking feedback:', error);
            throw error;
        }
    }

    static async update(id, customerId, data) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `UPDATE Feedback SET rating = @rating, comments = @comments WHERE feedback_id = @id AND customer_id = @customerId`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('customerId', sql.Int, customerId)
                .input('rating', sql.Int, data.rating)
                .input('comments', sql.VarChar, data.comments || null)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error updating feedback:', error);
            throw error;
        }
    }

    static async delete(id, customerId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `DELETE FROM Feedback WHERE feedback_id = @id AND customer_id = @customerId`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('customerId', sql.Int, customerId)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error deleting feedback:', error);
            throw error;
        }
    }
}

module.exports = Feedback;