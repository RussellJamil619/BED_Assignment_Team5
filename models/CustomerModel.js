// Russell's

const { executeQuery, sql } = require('../db');

class Customer {
    // ===== CUSTOMER CRUD =====
    static async createCustomer(data) {
        const query = `
            INSERT INTO Customer (name, email, password_hash, phone, created_at)
            OUTPUT INSERTED.customer_id, INSERTED.name, INSERTED.email, INSERTED.phone
            VALUES (@name, @email, @password_hash, @phone, GETDATE())
        `;
        const params = {
            name: { type: sql.VarChar, value: data.name },
            email: { type: sql.VarChar, value: data.email },
            password_hash: { type: sql.VarChar, value: data.password_hash },
            phone: { type: sql.VarChar, value: data.phone || null }
        };
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    static async findByEmail(email) {
        const query = `SELECT * FROM Customer WHERE email = @email`;
        const params = { email: { type: sql.VarChar, value: email } };
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    static async findById(id) {
        const query = `SELECT customer_id, name, email, phone, created_at FROM Customer WHERE customer_id = @id`;
        const params = { id: { type: sql.Int, value: id } };
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    static async getAllCustomers() {
        const query = `SELECT customer_id, name, email, phone, created_at FROM Customer ORDER BY created_at DESC`;
        const result = await executeQuery(query);
        return result.recordset;
    }

    static async updateCustomer(id, data) {
        const query = `UPDATE Customer SET name = @name, phone = @phone WHERE customer_id = @id`;
        const params = {
            id: { type: sql.Int, value: id },
            name: { type: sql.VarChar, value: data.name },
            phone: { type: sql.VarChar, value: data.phone || null }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    static async deleteCustomer(id) {
        const query = `DELETE FROM Customer WHERE customer_id = @id`;
        const params = { id: { type: sql.Int, value: id } };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    // ===== FEEDBACK CRUD =====
    static async createFeedback(data) {
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

    static async getFeedbackByStall(stallId) {
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

    static async getFeedbackByCustomer(customerId) {
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

    static async getFeedbackByCustomerAndStall(customerId, stallId) {
        const query = `SELECT * FROM Feedback WHERE customer_id = @customerId AND stall_id = @stallId`;
        const params = {
            customerId: { type: sql.Int, value: customerId },
            stallId: { type: sql.Int, value: stallId }
        };
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    static async updateFeedback(id, customerId, data) {
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

    static async deleteFeedback(id, customerId) {
        const query = `DELETE FROM Feedback WHERE feedback_id = @id AND customer_id = @customerId`;
        const params = {
            id: { type: sql.Int, value: id },
            customerId: { type: sql.Int, value: customerId }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    // ===== LIKES (M:N Junction Table) =====
    static async createLike(customerId, menuItemId) {
        const query = `INSERT INTO Likes (customer_id, menu_item_id, liked_at) VALUES (@customerId, @menuItemId, GETDATE())`;
        const params = {
            customerId: { type: sql.Int, value: customerId },
            menuItemId: { type: sql.Int, value: menuItemId }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    static async getLike(customerId, menuItemId) {
        const query = `SELECT * FROM Likes WHERE customer_id = @customerId AND menu_item_id = @menuItemId`;
        const params = {
            customerId: { type: sql.Int, value: customerId },
            menuItemId: { type: sql.Int, value: menuItemId }
        };
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    static async getLikesCount(menuItemId) {
        const query = `SELECT COUNT(*) as count FROM Likes WHERE menu_item_id = @menuItemId`;
        const params = { menuItemId: { type: sql.Int, value: menuItemId } };
        const result = await executeQuery(query, params);
        return result.recordset[0].count || 0;
    }

    static async getLikesByCustomer(customerId) {
        const query = `
            SELECT l.*, mi.name as item_name, s.stall_name 
            FROM Likes l 
            INNER JOIN MenuItem mi ON l.menu_item_id = mi.menu_item_id 
            INNER JOIN Stall s ON mi.stall_id = s.stall_id 
            WHERE l.customer_id = @customerId 
            ORDER BY l.liked_at DESC
        `;
        const params = { customerId: { type: sql.Int, value: customerId } };
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    static async deleteLike(customerId, menuItemId) {
        const query = `DELETE FROM Likes WHERE customer_id = @customerId AND menu_item_id = @menuItemId`;
        const params = {
            customerId: { type: sql.Int, value: customerId },
            menuItemId: { type: sql.Int, value: menuItemId }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    // ===== COMPLAINT CRUD =====
    static async createComplaint(data) {
        const query = `
            INSERT INTO Complaint (customer_id, stall_id, subject, description, status, complaint_date)
            OUTPUT INSERTED.complaint_id, INSERTED.subject, INSERTED.description, INSERTED.status
            VALUES (@customer_id, @stall_id, @subject, @description, 'Open', GETDATE())
        `;
        const params = {
            customer_id: { type: sql.Int, value: data.customer_id },
            stall_id: { type: sql.Int, value: data.stall_id },
            subject: { type: sql.VarChar, value: data.subject },
            description: { type: sql.VarChar, value: data.description || null }
        };
        const result = await executeQuery(query, params);
        return result.recordset[0];
    }

    static async getComplaintsByCustomer(customerId) {
        const query = `
            SELECT c.*, s.stall_name 
            FROM Complaint c 
            INNER JOIN Stall s ON c.stall_id = s.stall_id 
            WHERE c.customer_id = @customerId 
            ORDER BY c.complaint_date DESC
        `;
        const params = { customerId: { type: sql.Int, value: customerId } };
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    static async getComplaintsByStall(stallId) {
        const query = `
            SELECT c.*, cust.name as customer_name 
            FROM Complaint c 
            INNER JOIN Customer cust ON c.customer_id = cust.customer_id 
            WHERE c.stall_id = @stallId 
            ORDER BY c.complaint_date DESC
        `;
        const params = { stallId: { type: sql.Int, value: stallId } };
        const result = await executeQuery(query, params);
        return result.recordset;
    }

    static async getAllComplaints() {
        const query = `
            SELECT c.*, cust.name as customer_name, s.stall_name 
            FROM Complaint c 
            INNER JOIN Customer cust ON c.customer_id = cust.customer_id 
            INNER JOIN Stall s ON c.stall_id = s.stall_id 
            ORDER BY c.complaint_date DESC
        `;
        const result = await executeQuery(query);
        return result.recordset;
    }

    static async getComplaintById(id) {
        const query = `
            SELECT c.*, cust.name as customer_name, s.stall_name 
            FROM Complaint c 
            INNER JOIN Customer cust ON c.customer_id = cust.customer_id 
            INNER JOIN Stall s ON c.stall_id = s.stall_id 
            WHERE c.complaint_id = @id
        `;
        const params = { id: { type: sql.Int, value: id } };
        const result = await executeQuery(query, params);
        return result.recordset[0] || null;
    }

    static async updateComplaintStatus(id, status) {
        const query = `UPDATE Complaint SET status = @status WHERE complaint_id = @id`;
        const params = {
            id: { type: sql.Int, value: id },
            status: { type: sql.VarChar, value: status }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    static async deleteComplaint(id, customerId) {
        const query = `DELETE FROM Complaint WHERE complaint_id = @id AND customer_id = @customerId`;
        const params = {
            id: { type: sql.Int, value: id },
            customerId: { type: sql.Int, value: customerId }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    // ===== HELPER =====
    static async hasOrdered(customerId, stallId) {
        const query = `SELECT COUNT(*) as count FROM Orders WHERE customer_id = @customerId AND stall_id = @stallId`;
        const params = {
            customerId: { type: sql.Int, value: customerId },
            stallId: { type: sql.Int, value: stallId }
        };
        const result = await executeQuery(query, params);
        return result.recordset[0].count > 0;
    }
}

module.exports = Customer;