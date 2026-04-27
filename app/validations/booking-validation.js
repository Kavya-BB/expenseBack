const Joi = require('joi');

const bookingValidationSchema = Joi.object({
    pgId: Joi.string().hex().length(24).required().messages({
        'any.required': 'Pg Id is required'
    }),
    roomType: Joi.string().required().messages({
        'any.required': 'Room type is required'
    }),
    duration: Joi.number().min(1).required().messages({
        'any.required': 'Duration is required'
    }),
    durationType: Joi.string().valid('month', 'week').required().messages({
        'any.required': 'Duration type is required'
    })
});

module.exports = bookingValidationSchema;