// Russell's - Customer Controller
const Customer = require('../models/CustomerModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ===== AUTH MIDDLEWARE (inside controller) =====
exports.authenticate = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ===== CUSTOMER =====
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const existing = await Customer.findByEmail(email);
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);
        const customer = await Customer.createCustomer({ name, email, password_hash: hash, phone });
        const token = jwt.sign({ id: customer.customer_id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(201).json({ message: 'Registered', token, customer });
    } catch (err) {
        console.error('❌ Register error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const customer = await Customer.findByEmail(email);
        if (!customer) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, customer.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: customer.customer_id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        
        delete customer.password_hash;
        res.json({ message: 'Logged in', token, customer });
    } catch (err) {
        console.error('❌ Login error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id);
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        console.error('❌ Get profile error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        await Customer.updateCustomer(req.user.id, req.body);
        const customer = await Customer.findById(req.user.id);
        res.json({ message: 'Updated', customer });
    } catch (err) {
        console.error('❌ Update profile error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        await Customer.deleteCustomer(req.user.id);
        res.json({ message: 'Account deleted' });
    } catch (err) {
        console.error('❌ Delete account error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.getAllCustomers();
        res.json(customers);
    } catch (err) {
        console.error('❌ Get all customers error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// ===== FEEDBACK =====
exports.submitFeedback = async (req, res) => {
    try {
        const { stall_id, rating, comments } = req.body;
        const customerId = req.user.id;

        const ordered = await Customer.hasOrdered(customerId, stall_id);
        if (!ordered) return res.status(403).json({ error: 'Must order from this stall first' });

        const existing = await Customer.getFeedbackByCustomerAndStall(customerId, stall_id);
        if (existing) return res.status(409).json({ error: 'Already left feedback' });

        const feedback = await Customer.createFeedback({ customer_id: customerId, stall_id, rating, comments });
        const avg = await Customer.getAvgRating(stall_id);
        res.status(201).json({ feedback, average: avg });
    } catch (err) {
        console.error('❌ Submit feedback error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getFeedbackByStall = async (req, res) => {
    try {
        const feedback = await Customer.getFeedbackByStall(req.params.stallId);
        const avg = await Customer.getAvgRating(req.params.stallId);
        res.json({ feedback, average: avg });
    } catch (err) {
        console.error('❌ Get feedback by stall error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getMyFeedback = async (req, res) => {
    try {
        const feedback = await Customer.getFeedbackByCustomer(req.user.id);
        res.json(feedback);
    } catch (err) {
        console.error('❌ Get my feedback error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.updateFeedback = async (req, res) => {
    try {
        await Customer.updateFeedback(req.params.feedbackId, req.user.id, req.body);
        res.json({ message: 'Feedback updated' });
    } catch (err) {
        console.error('❌ Update feedback error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        await Customer.deleteFeedback(req.params.feedbackId, req.user.id);
        res.json({ message: 'Feedback deleted' });
    } catch (err) {
        console.error('❌ Delete feedback error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// ===== LIKES =====
exports.likeMenuItem = async (req, res) => {
    try {
        const { menu_item_id } = req.body;
        const customerId = req.user.id;

        const existing = await Customer.getLike(customerId, menu_item_id);
        if (existing) return res.status(409).json({ error: 'Already liked' });

        await Customer.createLike(customerId, menu_item_id);
        const count = await Customer.getLikesCount(menu_item_id);
        res.status(201).json({ message: 'Liked', total_likes: count });
    } catch (err) {
        console.error('❌ Like error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.unlikeMenuItem = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const customerId = req.user.id;

        const existing = await Customer.getLike(customerId, menuItemId);
        if (!existing) return res.status(404).json({ error: 'Not liked' });

        await Customer.deleteLike(customerId, menuItemId);
        const count = await Customer.getLikesCount(menuItemId);
        res.json({ message: 'Unliked', total_likes: count });
    } catch (err) {
        console.error('❌ Unlike error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getLikesCount = async (req, res) => {
    try {
        const count = await Customer.getLikesCount(req.params.menuItemId);
        res.json({ total_likes: count });
    } catch (err) {
        console.error('❌ Get likes count error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getMyLikes = async (req, res) => {
    try {
        const likes = await Customer.getLikesByCustomer(req.user.id);
        res.json(likes);
    } catch (err) {
        console.error('❌ Get my likes error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// ===== COMPLAINT =====
exports.submitComplaint = async (req, res) => {
    try {
        const { stall_id, subject, description } = req.body;
        const customerId = req.user.id;

        const ordered = await Customer.hasOrdered(customerId, stall_id);
        if (!ordered) return res.status(403).json({ error: 'Must order from this stall first' });

        const complaint = await Customer.createComplaint({ customer_id: customerId, stall_id, subject, description });
        res.status(201).json(complaint);
    } catch (err) {
        console.error('❌ Submit complaint error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getMyComplaints = async (req, res) => {
    try {
        const complaints = await Customer.getComplaintsByCustomer(req.user.id);
        res.json(complaints);
    } catch (err) {
        console.error('❌ Get my complaints error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getComplaintsByStall = async (req, res) => {
    try {
        const complaints = await Customer.getComplaintsByStall(req.params.stallId);
        res.json(complaints);
    } catch (err) {
        console.error('❌ Get complaints by stall error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Customer.getAllComplaints();
        res.json(complaints);
    } catch (err) {
        console.error('❌ Get all complaints error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Open', 'Resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        await Customer.updateComplaintStatus(req.params.complaintId, status);
        res.json({ message: `Status updated to ${status}` });
    } catch (err) {
        console.error('❌ Update complaint status error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteComplaint = async (req, res) => {
    try {
        await Customer.deleteComplaint(req.params.complaintId, req.user.id);
        res.json({ message: 'Complaint deleted' });
    } catch (err) {
        console.error('❌ Delete complaint error:', err.message);
        res.status(500).json({ error: err.message });
    }
};