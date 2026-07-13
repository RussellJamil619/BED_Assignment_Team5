// Russell's - Customer Model
const { sql, getPool } = require('../db');

console.log('✅ db module loaded:', { sql: !!sql, getPool: !!getPool });

class Customer {
    // ===== CUSTOMER CRUD =====
    static async createCustomer(data) {
        try {
            console.log('🟢 createCustomer called with:', { 
                name: data.name, 
                email: data.email, 
                phone: data.phone 
            });
            
            console.log('🟢 Calling getPool()...');
            const pool = await getPool();
            
            console.log('🟢 getPool() returned:', pool);
            console.log('🟢 pool type:', typeof pool);
            
            if (!pool) {
                console.error('🔴 Pool is undefined!');
                throw new Error('Database pool is undefined. Check your database connection.');
            }
            
            console.log('🟢 Pool has request method:', typeof pool.request === 'function');
            
            const query = `
                INSERT INTO Customer (name, email, password_hash, phone, created_at)
                OUTPUT INSERTED.customer_id, INSERTED.name, INSERTED.email, INSERTED.phone
                VALUES (@name, @email, @password_hash, @phone, GETDATE())
            `;
            
            console.log('🟢 Executing query...');
            const result = await pool.request()
                .input('name', sql.VarChar, data.name)
                .input('email', sql.VarChar, data.email)
                .input('password_hash', sql.VarChar, data.password_hash)
                .input('phone', sql.VarChar, data.phone || null)
                .query(query);
            
            console.log('🟢 Query successful! Result:', result.recordset[0]);
            return result.recordset[0];
        } catch (error) {
            console.error('🔴 Error creating customer:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            console.log('🟢 findByEmail called with:', email);
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `SELECT * FROM Customer WHERE email = @email`;
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query(query);
            
            console.log('🟢 findByEmail result:', result.recordset[0] || 'not found');
            return result.recordset[0] || null;
        } catch (error) {
            console.error('🔴 Error finding customer by email:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            console.log('🟢 findById called with:', id);
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `SELECT customer_id, name, email, phone, created_at FROM Customer WHERE customer_id = @id`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);
            
            return result.recordset[0] || null;
        } catch (error) {
            console.error('🔴 Error finding customer by ID:', error);
            throw error;
        }
    }

    static async getAllCustomers() {
        try {
            console.log('🟢 getAllCustomers called');
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `SELECT customer_id, name, email, phone, created_at FROM Customer ORDER BY created_at DESC`;
            const result = await pool.request().query(query);
            return result.recordset;
        } catch (error) {
            console.error('🔴 Error getting all customers:', error);
            throw error;
        }
    }

    static async updateCustomer(id, data) {
        try {
            console.log('🟢 updateCustomer called for id:', id);
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `UPDATE Customer SET name = @name, phone = @phone WHERE customer_id = @id`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.VarChar, data.name)
                .input('phone', sql.VarChar, data.phone || null)
                .query(query);
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error updating customer:', error);
            throw error;
        }
    }

    static async deleteCustomer(id) {
        try {
            console.log('🟢 deleteCustomer called for id:', id);
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `DELETE FROM Customer WHERE customer_id = @id`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(query);
            
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error deleting customer:', error);
            throw error;
        }
    }

    // ===== FEEDBACK CRUD =====
    static async createFeedback(data) {
        try {
            console.log('🟢 createFeedback called');
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

    static async getFeedbackByStall(stallId) {
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

    static async getFeedbackByCustomer(customerId) {
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

    static async getFeedbackByCustomerAndStall(customerId, stallId) {
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

    static async updateFeedback(id, customerId, data) {
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

    static async deleteFeedback(id, customerId) {
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

    // ===== LIKES =====
    static async createLike(customerId, menuItemId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `INSERT INTO Likes (customer_id, menu_item_id, liked_at) VALUES (@customerId, @menuItemId, GETDATE())`;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('menuItemId', sql.Int, menuItemId)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error creating like:', error);
            throw error;
        }
    }

    static async getLike(customerId, menuItemId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `SELECT * FROM Likes WHERE customer_id = @customerId AND menu_item_id = @menuItemId`;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('menuItemId', sql.Int, menuItemId)
                .query(query);
            return result.recordset[0] || null;
        } catch (error) {
            console.error('🔴 Error getting like:', error);
            throw error;
        }
    }

    static async getLikesCount(menuItemId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `SELECT COUNT(*) as count FROM Likes WHERE menu_item_id = @menuItemId`;
            const result = await pool.request()
                .input('menuItemId', sql.Int, menuItemId)
                .query(query);
            return result.recordset[0].count || 0;
        } catch (error) {
            console.error('🔴 Error getting likes count:', error);
            throw error;
        }
    }

    static async getLikesByCustomer(customerId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `
                SELECT l.*, mi.name as item_name, s.stall_name 
                FROM Likes l 
                INNER JOIN MenuItem mi ON l.menu_item_id = mi.menu_item_id 
                INNER JOIN Stall s ON mi.stall_id = s.stall_id 
                WHERE l.customer_id = @customerId 
                ORDER BY l.liked_at DESC
            `;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .query(query);
            return result.recordset;
        } catch (error) {
            console.error('🔴 Error getting likes by customer:', error);
            throw error;
        }
    }

    static async deleteLike(customerId, menuItemId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `DELETE FROM Likes WHERE customer_id = @customerId AND menu_item_id = @menuItemId`;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('menuItemId', sql.Int, menuItemId)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error deleting like:', error);
            throw error;
        }
    }

    // ===== COMPLAINT CRUD =====
    static async createComplaint(data) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
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
            console.error('🔴 Error creating complaint:', error);
            throw error;
        }
    }

    static async getComplaintsByCustomer(customerId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
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
            console.error('🔴 Error getting complaints by customer:', error);
            throw error;
        }
    }

    static async getComplaintsByStall(stallId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
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
            console.error('🔴 Error getting complaints by stall:', error);
            throw error;
        }
    }

    static async getAllComplaints() {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
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
            console.error('🔴 Error getting all complaints:', error);
            throw error;
        }
    }

    static async getComplaintById(id) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
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
            console.error('🔴 Error getting complaint by ID:', error);
            throw error;
        }
    }

    static async updateComplaintStatus(id, status) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `UPDATE Complaint SET status = @status WHERE complaint_id = @id`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('status', sql.VarChar, status)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error updating complaint status:', error);
            throw error;
        }
    }

    static async deleteComplaint(id, customerId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `DELETE FROM Complaint WHERE complaint_id = @id AND customer_id = @customerId`;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('customerId', sql.Int, customerId)
                .query(query);
            return result.rowsAffected[0] > 0;
        } catch (error) {
            console.error('🔴 Error deleting complaint:', error);
            throw error;
        }
    }

    // ===== HELPER =====
    static async hasOrdered(customerId, stallId) {
        try {
            const pool = await getPool();
            
            if (!pool) {
                throw new Error('Database pool is undefined');
            }
            
            const query = `SELECT COUNT(*) as count FROM Orders WHERE customer_id = @customerId AND stall_id = @stallId`;
            const result = await pool.request()
                .input('customerId', sql.Int, customerId)
                .input('stallId', sql.Int, stallId)
                .query(query);
            return result.recordset[0].count > 0;
        } catch (error) {
            console.error('🔴 Error checking orders:', error);
            throw error;
        }
    }
}

module.exports = Customer;