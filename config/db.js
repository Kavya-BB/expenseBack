const mongoose = require('mongoose');

async function configureDB() {
    try {
        // await mongoose.connect('mongodb://127.0.0.1:27017/pgfinder-april2025');
        await mongoose.connect(process.env.DB_URL);
        // await mongoose.connect(process.env.DB_URL, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true
        // });
        // console.log(process.env.DB_URL);
        console.log('connected to db');
    } catch(err) {
        console.log('error connecting to db', err.message);
    }
}

module.exports = configureDB;