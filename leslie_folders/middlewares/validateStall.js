// leslie_folders/middlewares/validateStall.js
// Owner: Leslie

const Joi = require("joi");

const stallBodySchema = Joi.object({
  hawker_centre_id: Joi.number().integer().positive().required().messages({
    "number.base":  "hawker_centre_id must be a number",
    "any.required": "hawker_centre_id is required"
  }),

  stall_owner_id: Joi.number().integer().positive().required().messages({
    "number.base":  "stall_owner_id must be a number",
    "any.required": "stall_owner_id is required"
  }),

  stall_name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "stall_name cannot be empty",
    "string.max":   "stall_name cannot exceed 100 characters",
    "any.required": "stall_name is required"
  }),

  // e.g. "01-23" — letters/digits/dash keeps it flexible for basement units like "B1-07"
  unit_number: Joi.string().trim().pattern(/^[A-Za-z0-9-]{1,20}$/).required().messages({
    "string.pattern.base": "unit_number may only contain letters, numbers, and dashes (max 20 chars)",
    "any.required":        "unit_number is required"
  }),

  cuisine_specialty: Joi.string().trim().max(50).allow("", null).messages({
    "string.max": "cuisine_specialty cannot exceed 50 characters"
  })
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "Stall ID must be a number"
  })
});

const querySchema = Joi.object({
  hawker_centre_id: Joi.number().integer().positive().messages({
    "number.base": "hawker_centre_id filter must be a number"
  })
});

function validateWith(schema, source) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map(d => d.message)
      });
    }
    req[source] = value;
    next();
  };
}

module.exports = {
  validateStall:      validateWith(stallBodySchema, "body"),
  validateStallId:    validateWith(idParamSchema, "params"),
  validateStallQuery: validateWith(querySchema, "query")
};