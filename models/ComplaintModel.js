// Russell's

const { executeQuery, sql } = require('../db');

class Complaint {
    static async create(data) {
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

    static async getByCustomer(customerId) {
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

    static async getByStall(stallId) {
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

    static async getAll() {
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

    static async getById(id) {
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

    static async updateStatus(id, status) {
        const query = `UPDATE Complaint SET status = @status WHERE complaint_id = @id`;
        const params = {
            id: { type: sql.Int, value: id },
            status: { type: sql.VarChar, value: status }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id, customerId) {
        const query = `DELETE FROM Complaint WHERE complaint_id = @id AND customer_id = @customerId`;
        const params = {
            id: { type: sql.Int, value: id },
            customerId: { type: sql.Int, value: customerId }
        };
        const result = await executeQuery(query, params);
        return result.rowsAffected[0] > 0;
    }
}

module.exports = Complaint;