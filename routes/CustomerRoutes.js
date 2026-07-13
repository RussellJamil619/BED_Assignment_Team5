// Russell's
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/CustomerController');
const { validate, check } = require('../middlewares/ValidateCustomer');
const authenticate = require('../middlewares/CustomerAuth'); // ← my middlewre 

// ===== PUBLIC ROUTES (No token needed) =====
router.post('/register', validate.register, check, ctrl.register);
router.post('/login', validate.login, check, ctrl.login);

// ===== PROTECTED ROUTES (Token needed - uses authenticate) =====
// CUSTOMER
router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, validate.update, check, ctrl.updateProfile);
router.delete('/account', authenticate, ctrl.deleteAccount);
router.get('/customers', authenticate, ctrl.getAllCustomers);

// FEEDBACK
router.post('/feedback', authenticate, validate.feedback, check, ctrl.submitFeedback);
router.get('/feedback/stall/:stallId', ctrl.getFeedbackByStall);
router.get('/feedback/my', authenticate, ctrl.getMyFeedback);
router.put('/feedback/:feedbackId', authenticate, validate.feedback, check, ctrl.updateFeedback);
router.delete('/feedback/:feedbackId', authenticate, ctrl.deleteFeedback);

// LIKES
router.post('/likes', authenticate, validate.like, check, ctrl.likeMenuItem);
router.delete('/likes/:menuItemId', authenticate, ctrl.unlikeMenuItem);
router.get('/likes/count/:menuItemId', ctrl.getLikesCount);
router.get('/likes/my', authenticate, ctrl.getMyLikes);

// COMPLAINT
router.post('/complaints', authenticate, validate.complaint, check, ctrl.submitComplaint);
router.get('/complaints/my', authenticate, ctrl.getMyComplaints);
router.get('/complaints/stall/:stallId', authenticate, ctrl.getComplaintsByStall);
router.get('/complaints/all', authenticate, ctrl.getAllComplaints);
router.put('/complaints/:complaintId', authenticate, validate.status, check, ctrl.updateComplaintStatus);
router.delete('/complaints/:complaintId', authenticate, ctrl.deleteComplaint);

module.exports = router;