const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value,
        })),
      },
    });
  }
  next();
};

module.exports = { handleValidationErrors };
