const mongoose = require('mongoose');

async function configureDB() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/pgfinder-april2025');
        console.log('connected to db');
    } catch(err) {
        console.log('error connecting to db', err.message);
    }
}

module.exports = configureDB;