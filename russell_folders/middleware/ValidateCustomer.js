// Russell's - Customer Validations
const { body, validationResult } = require('express-validator');

const validate = {
    // CUSTOMER
    register: [
        body('name').notEmpty().withMessage('Name required'),
        body('email').isEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 8 }).withMessage('Password min 8 chars')
    ],
    login: [
        body('email').isEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password required')
    ],
    update: [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('phone').optional().isMobilePhone('any').withMessage('Valid phone required')
    ],

    // FEEDBACK
    feedback: [
        body('stall_id').isInt({ min: 1 }).withMessage('Valid stall ID required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
        body('comments').optional().isLength({ max: 500 }).withMessage('Comments max 500 chars')
    ],

    // LIKES
    like: [
        body('menu_item_id').isInt({ min: 1 }).withMessage('Valid menu item ID required')
    ],

    // COMPLAINT
    complaint: [
        body('stall_id').isInt({ min: 1 }).withMessage('Valid stall ID required'),
        body('subject').notEmpty().withMessage('Subject required').isLength({ max: 100 }),
        body('description').optional().isLength({ max: 500 })
    ],
    status: [
        body('status').isIn(['Open', 'Resolved']).withMessage('Status must be Open or Resolved')
    ]
};

const check = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

module.exports = { validate, check };