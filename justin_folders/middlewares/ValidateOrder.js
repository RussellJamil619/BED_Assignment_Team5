// Owner: Jusitn

const Joi = require("joi");

const cartItemSchema = Joi.object({
  menu_item_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(50).required(),
});

// Note: no price/total from client — the server computes those
const checkoutSchema = Joi.object({
  payment_method: Joi.string().valid("Cash", "NETS", "PayNow").required(),
});

const addonsSchema = Joi.object({
  addons: Joi.array().items(
    Joi.object({
      order_item_id: Joi.number().integer().required(),
      addon_id: Joi.number().integer().required(),
    })
  ).min(1).required(),
});

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
const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const orderStatusSchema = Joi.object({
  status: Joi.string().valid("Preparing", "Ready", "Collected", "Cancelled").required(),
});

module.exports = { validateBody, cartItemSchema, checkoutSchema, addonsSchema, updateCartItemSchema, orderStatusSchema };