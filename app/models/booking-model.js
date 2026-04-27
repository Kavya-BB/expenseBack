const mongoose = require('mongoose');

const bookingschema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pg',
        required: true
    },
    roomType: {
        type: String,
        required: true
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: Number,
        required: true
    },
    durationType: {
        type: String,
        enum: ['month', 'week'],
        default: 'month',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingschema);

module.exports = Booking;