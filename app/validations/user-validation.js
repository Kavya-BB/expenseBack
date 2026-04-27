const Joi = require('joi');

const registerValidationSchema = Joi.object({
    name: Joi.string().trim().min(4).max(64).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().trim().min(8).max(128).required(),
    role: Joi.string().valid('user', 'owner', 'admin')
});

const loginValidationSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().trim().min(4).max(64).required()
})

module.exports = { registerValidationSchema, loginValidationSchema };