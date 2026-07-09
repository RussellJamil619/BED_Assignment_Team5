// Owner: Jusitn

const Joi = require("joi");

const updatePaymentSchema = Joi.object({
  payment_status: Joi.string().valid("Success", "Pending", "Failed").required(),
});

// reuse the same validateBody helper style as validateOrder.js
function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };
}

module.exports = { validateBody, updatePaymentSchema };