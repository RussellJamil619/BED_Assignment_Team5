// middlewares/validateMenuItem.js
// Owner: Leslie

const Joi = require("joi");

const VALID_CATEGORIES = ["Main", "Drink", "Dessert"];

// Rules mirror the MenuItem table constraints
const menuItemBodySchema = Joi.object({
  stall_id: Joi.number().integer().positive().required().messages({
    "number.base":     "stall_id must be a number",
    "number.positive": "stall_id must be greater than 0",
    "any.required":    "stall_id is required"
  }),

  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "name cannot be empty",
    "string.max":   "name cannot exceed 100 characters",
    "any.required": "name is required"
  }),

  description: Joi.string().trim().max(255).allow("", null).messages({
    "string.max": "description cannot exceed 255 characters"
  }), // allow('', null) because the column is nullable

  price: Joi.number().positive().precision(2).max(999.99).required().messages({
    "number.base":     "price must be a number",
    "number.positive": "price must be greater than 0",
    "any.required":    "price is required"
  }), // precision(2) matches DECIMAL(10,2)

  category: Joi.string().valid(...VALID_CATEGORIES).required().messages({
    "any.only":     `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
    "any.required": "category is required"
  }),

  is_available: Joi.boolean().default(true) // client can omit this
});

// URL params arrive as strings, so "/menuitems/abc" must be rejected here
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Menu item ID must be a number"
  })
});

// Optional filters: /menuitems?stall_id=1&category=Drink
const querySchema = Joi.object({
  stall_id: Joi.number().integer().positive(),
  category: Joi.string().valid(...VALID_CATEGORIES).messages({
    "any.only": `category filter must be one of: ${VALID_CATEGORIES.join(", ")}`
  })
});

// One helper so body, params and query all validate the same way
function validateWith(schema, source) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // collect all errors, not just the first
      stripUnknown: true,  // drop fields we didn't ask for
      convert: true        // coerce "5" to 5 (params are always strings)
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map(d => d.message)
      });
    }

    req[source] = value; // pass on the cleaned version
    next();
  };
}

const validateMenuItem      = validateWith(menuItemBodySchema, "body");
const validateMenuItemId    = validateWith(idParamSchema, "params");
const validateMenuItemQuery = validateWith(querySchema, "query");

module.exports = {
  validateMenuItem,
  validateMenuItemId,
  validateMenuItemQuery
};