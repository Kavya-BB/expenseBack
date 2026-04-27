const User = require('../models/user-model.js');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidationSchema, loginValidationSchema } = require('../validations/user-validation.js');
const userCtlr = {};

userCtlr.register = async (req, res) => {
    const body = req.body;
    const { error, value } = registerValidationSchema.validate(body, { abortEarly: false });
    if(error) {
        return res.status(400).json({ error: error.details });
    }
    try {
        const userByEmail = await User.findOne({ email: value.email });
        if(userByEmail) {
            return res.status(400).json({ error: 'email already taken '});
        }
        const user =new User(value);
        const salt = await bcryptjs.genSalt();
        const hash = await bcryptjs.hash(user.password, salt);
        user.password = hash;
        
        if(user.role === 'admin') {
            const adminExist = await User.findOne({ role: "admin" });
            if(adminExist) {
                return res.status(403).json({ error: 'register as owner/user' });
            }
        }
        await user.save();
        res.status(201).json(user);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!'});
    }
}

userCtlr.login = async (req, res) => {
    const body = req.body;
    const { error, value } = loginValidationSchema.validate(body, { abortEarly: false });
    if(error) {
        return res.status(400).json({ error: error.details });
    }
    const user = await User.findOne({ email: value.email });
    if(!user) {
        return res.status(401).json({ error: 'invalid email/password' });
    }
    const passwordMatch = await bcryptjs.compare(value.password, user.password);
    if(!passwordMatch) {
        return res.status(401).json({ error: 'invalid email/password' });
    }
    const tokenData = { userId: user._id, role: user.role };
    console.log(tokenData);
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '70d' });
    res.json({ token: token });
};

userCtlr.allusers = async (req, res) => {
    try {
        let users;
        if(req.role === 'admin') {
            users = await User.find();
        } else if (req.role === 'owner') {
            users = await User.find({ role: 'user' });
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(users);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
};

userCtlr.account = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if(!user) {
            return res.status(404).json({ error: 'user not found' });
        }
        res.json(user);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
};

userCtlr.updateAccount = async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    try {
        if (req.role !== 'admin' && req.userId.toString() !== id) {
            return res.status(403).json({ error: 'You can update only your account' });
        }
        const user = await User.findByIdAndUpdate(id, body, { new: true });
        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
};

userCtlr.deleteAccount = async (req, res) => {
    const id = req.params.id;
    try {
        if (req.role !== 'admin') {
            return res.status(403).json({ error: 'Only admin can delete accounts' });
        }
        const user = await User.findById(id);
        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Admin deletion not allowed' });
        }
        await User.findByIdAndDelete(id);
        res.json({ message: 'User deleted successfully', user });
    } catch(err){
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
};

module.exports = userCtlr;