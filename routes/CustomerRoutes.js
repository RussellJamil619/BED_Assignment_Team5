// Russell's - Customer Routes
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/CustomerController');  // ← This has authenticate inside it
const { validate, check } = require('../middlewares/ValidateCustomer');

// ===== PUBLIC ROUTES =====
router.post('/register', validate.register, check, ctrl.register);
router.post('/login', validate.login, check, ctrl.login);

// ===== PROTECTED ROUTES (use ctrl.authenticate) =====
router.get('/profile', ctrl.authenticate, ctrl.getProfile);
router.put('/profile', ctrl.authenticate, validate.update, check, ctrl.updateProfile);
router.delete('/account', ctrl.authenticate, ctrl.deleteAccount);
router.get('/customers', ctrl.authenticate, ctrl.getAllCustomers);

// FEEDBACK
router.post('/feedback', ctrl.authenticate, validate.feedback, check, ctrl.submitFeedback);
router.get('/feedback/stall/:stallId', ctrl.getFeedbackByStall);
router.get('/feedback/my', ctrl.authenticate, ctrl.getMyFeedback);
router.put('/feedback/:feedbackId', ctrl.authenticate, validate.feedback, check, ctrl.updateFeedback);
router.delete('/feedback/:feedbackId', ctrl.authenticate, ctrl.deleteFeedback);

// LIKES
router.post('/likes', ctrl.authenticate, validate.like, check, ctrl.likeMenuItem);
router.delete('/likes/:menuItemId', ctrl.authenticate, ctrl.unlikeMenuItem);
router.get('/likes/count/:menuItemId', ctrl.getLikesCount);
router.get('/likes/my', ctrl.authenticate, ctrl.getMyLikes);

// COMPLAINT
router.post('/complaints', ctrl.authenticate, validate.complaint, check, ctrl.submitComplaint);
router.get('/complaints/my', ctrl.authenticate, ctrl.getMyComplaints);
router.get('/complaints/stall/:stallId', ctrl.authenticate, ctrl.getComplaintsByStall);
router.get('/complaints/all', ctrl.authenticate, ctrl.getAllComplaints);
router.put('/complaints/:complaintId', ctrl.authenticate, validate.status, check, ctrl.updateComplaintStatus);
router.delete('/complaints/:complaintId', ctrl.authenticate, ctrl.deleteComplaint);

module.exports = router;