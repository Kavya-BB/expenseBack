const Payment = require('../models/payment-model.js');
const Booking = require('../models/booking-model.js');
const instance = require('../utils/razorpay.js');
const crypto = require('crypto');
const paymentCltr = {};

paymentCltr.createOrder = async (req, res) => {
    try {
        const { amount, bookingId } = req.body;
        const userId = req.userId;
        const booking = await Booking
            .findById(bookingId)
            .populate('pgId');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        const order = await instance.orders.create({
            amount: amount * 100,
            currency: 'INR'
        });
        await Payment.create({
            userId,
            ownerId: booking.pgId.ownerId,
            pgId: booking.pgId._id,
            bookingId,
            amount,
            razorpay_order_id: order.id,
            paymentStatus: 'pending'
        });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


paymentCltr.getKey = (req, res) => {
    res.json({
        key: process.env.RAZORPAY_API_KEY
    });
};

paymentCltr.userPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.userId })
            .populate('pgId bookingId');
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

paymentCltr.ownerPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ ownerId: req.userId })
            .populate('pgId bookingId userId');
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

paymentCltr.adminPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('pgId bookingId userId ownerId');
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

paymentCltr.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(sign)
      .digest("hex");
    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }
    const payment = await Payment.findOne({ razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.paymentStatus = "complete";
    await payment.save();
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: "paid"
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ error: err.message });
  }
};


module.exports = paymentCltr;
