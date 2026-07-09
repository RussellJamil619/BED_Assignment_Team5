// Russell's

const { executeQuery, sql } = require('../db');

class Feedback {
    static async create(data) {
        const query = `
            INSERT INTO Feedback (customer_id, stall_id, rating, comments, feedback_date)
            OUTPUT INSERTED.feedback_id, INSERTED.rating, INSERTED.comments
            VALUES (@customer_id, @stall_id, @rating, @comments, GETDATE())
        `;
        const params = {
            customer_id: { type: sql.Int, value: data.customer_id },
            stall_id: { type: sql.Int, value: data.stall_id },
            rating: { type: sql.Int, value: data.rating },
            comments: { type: sql.VarChar, value: data.comments || null }
        };
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    static async getByStall(stallId) {
        const query = `
            SELECT f.*, c.name as customer_name 
            FROM Feedback f 
            INNER JOIN Customer c ON f.customer_id = c.customer_id 
            WHERE f.stall_id = @stallId 
            ORDER BY f.feedback_date DESC
        `;
        const params = { stallId: { type: sql.Int, value: stallId } };
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    static async getByCustomer(customerId) {
        const query = `
            SELECT f.*, s.stall_name 
            FROM Feedback f 
            INNER JOIN Stall s ON f.stall_id = s.stall_id 
            WHERE f.customer_id = @customerId 
            ORDER BY f.feedback_date DESC
        `;
        const params = { customerId: { type: sql.Int, value: customerId } };
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    static async getAvgRating(stallId) {
        const query = `
            SELECT AVG(CAST(rating AS DECIMAL(3,2))) as avg_rating, COUNT(*) as total 
            FROM Feedback WHERE stall_id = @stallId
        `;
        const params = { stallId: { type: sql.Int, value: stallId } };
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    static async getByCustomerAndStall(customerId, stallId) {
        const query = `SELECT * FROM Feedback WHERE customer_id = @customerId AND stall_id = @stallId`;
        const params = {
            customerId: { type: sql.Int, value: customerId },
            stallId: { type: sql.Int, value: stallId }
        };
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    static async update(id, customerId, data) {
        const query = `UPDATE Feedback SET rating = @rating, comments = @comments WHERE feedback_id = @id AND customer_id = @customerId`;
        const params = {
            id: { type: sql.Int, value: id },
            customerId: { type: sql.Int, value: customerId },
            rating: { type: sql.Int, value: data.rating },
            comments: { type: sql.VarChar, value: data.comments || null }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id, customerId) {
        const query = `DELETE FROM Feedback WHERE feedback_id = @id AND customer_id = @customerId`;
        const params = {
            id: { type: sql.Int, value: id },
            customerId: { type: sql.Int, value: customerId }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }
}

module.exports = Feedback;