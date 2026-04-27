const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pg',
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    razorpay_order_id: {
        type: String,
    },
    razorpay_payment_id: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'complete', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

const Payment = new mongoose.model('Payment', paymentSchema);

module.exports = Payment;