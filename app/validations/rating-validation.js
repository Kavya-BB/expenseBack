const Joi = require('joi');

const ratingValidationSchema = Joi.object({
    pgId: Joi.string().required().messages({
        'any.required': 'Pg id is required'
    }),
    roomRating: Joi.number().min(1).max(5).required().messages({
        'any.required': 'Rating is required'
    }),
    comments: Joi.string().allow("").max(500).messages({
        'string.max': 'Comment cannot exceed 500 characters'
    })
});

module.exports = ratingValidationSchema;