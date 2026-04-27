const mongoose = require('mongoose');
const Booking = require('../models/booking-model.js');
const Pg = require('../models/pg-model.js');
const bookingValidationSchema = require('../validations/booking-validation.js');
const bookingCltr = {};

bookingCltr.createBooking = async (req, res) => {
    const body = req.body;
    try {
        const { error } = bookingValidationSchema.validate(body);
        if(error) {
            return res.status(400).json({ error: error.details });
        }
        const { pgId, roomType, duration, durationType } = req.body;
        const userId = req.userId;
        const existingBooking = await Booking.findOne({
            userId,
            pgId,
            status: { $in: ['pending', 'confirmed'] }
        });
        if(existingBooking) {
            return res.status(400).json({ error: 'You already have an active booking for this Pg'});
        }
        const pg = await Pg.findById(pgId);
        if(!pg) {
            return res.status(404).json({ error: 'Pg not found' });
        }
        const selectedRoom = pg.roomTypes.find(ele => ele.roomType === roomType);
        if(!selectedRoom) {
            return res.status(400).json({ error: 'Invalid room type'});
        }
        if(selectedRoom.count <= 0) {
            return res.status(400).json({ error: 'Room not available' });
        }
        let amount;
        if(durationType == 'month') {
            amount = selectedRoom.rent * duration;
        } else if(durationType == 'week') {
            amount = (selectedRoom.rent / 4) * duration;
        } else {
            return res.status(400).json({ error: "durationType must be 'month' or 'week'" });
        }
        amount = Math.round(Number(amount) * 100) / 100;
        const booking = await Booking.create({
            userId,
            pgId,
            roomType,
            duration,
            durationType,
            amount,
            status: 'pending'
        });
        const populatedBooking = await Booking.findById(booking._id)
            .populate("userId", "name email")
            .populate("pgId", "pgname location")
        res.status(201).json({ success: true, booking: populatedBooking });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

bookingCltr.confirmBooking = async (req, res) => {
    const bookingId = req.params.id;
    try {
        let booking = await Booking.findById(bookingId);
        if(!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if(booking.status === "confirmed") {
            return res.status(400).json({ error: 'Already confirmed' });
        }
        const pg = await Pg.findById(booking.pgId);
        if(!pg) {
            return res.status(404).json({ error: 'Pg not found' });
        }
        if(req.role == 'owner') {
            if(!pg.ownerId || pg.ownerId.toString() != req.userId) {
                return res.status(403).json({ error: 'You are not authorized to confirm this booking' });
            }
        }
        const selectedRoom = pg.roomTypes.find(ele => ele.roomType == booking.roomType);
        if(!selectedRoom) {
            return res.status(400).json({ error: 'Room type not found in pg' });
        }
        if (selectedRoom.count <= 0) {
            return res.status(400).json({ error: "Room not available" });
        }
        selectedRoom.count  = selectedRoom.count - 1;
        if(selectedRoom.count < 0) {
            selectedRoom.count = 0;
        }
        await pg.save();
        booking.status = 'confirmed';
        await booking.save();
        const populated = await Booking.findById(bookingId)
            .populate('userId', 'name email')
            .populate('pgId', 'pgname location');
        res.json({ message: 'Confirm booking successfully', booking: populated })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

bookingCltr.cancelBooking = async (req, res) => {
    const bookingId = req.params.id;
    const role = req.role;
    try {
        let booking = await Booking.findById(bookingId);
        if(!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        if(booking.status == "cancelled") {
            return res.status(400).json({ error: 'Already cancelled' });
        }
        if(role == 'user') {
            if (booking.userId.toString() !== req.userId) {
                return res.status(403).json({ error: 'You can cancel only your own bookings' });
            }
        } else if(role == 'owner') {
            const pg = await Pg.findById(booking.pgId);
            if(!pg) {
                return res.status(404).json({ error: 'Pg not found' });
            }
            if (!pg.ownerId || pg.ownerId.toString() !== req.userId) {
                return res.status(403).json({ error: 'Not authorized to cancel this booking' });
            }
        }
        if(booking.status == "confirmed") {
            const pg = await Pg.findById(booking.pgId);
            if(pg) {
                const selectedRoom = pg.roomTypes.find(ele => ele.roomType == booking.roomType);
                if(selectedRoom) {
                    selectedRoom.count = (selectedRoom.count || 0) + 1;
                    await pg.save();
                }
            }
            
        }
        booking.status = 'cancelled';
        await booking.save();
        const populated = await Booking.findById(bookingId)
            .populate('userId', 'name email')
            .populate('pgId', 'pgname location');
        res.json({ message: 'Booking cancelled successfully', booking: populated });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

bookingCltr.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'name email')
            .populate('pgId', 'pgname location')
        res.json({ bookings });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

bookingCltr.getUserBookings = async (req, res) => {
    try {
        const userId = req.userId;
        const bookings = await Booking.find({ userId })
            .populate('userId', 'name email')
            .populate('pgId', 'pgname location');
        res.json({ bookings });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

bookingCltr.getOwnerBookings = async (req, res) => {
    try {
        const ownerId = req.userId;
        const ownerPg = await Pg.find({ ownerId }).select('_id');
        if(!ownerPg || ownerPg.length == 0) {
            return res.json({ bookings: [] });
        }
        const pgIds = ownerPg.map(pg => pg._id);
        const bookings = await Booking.find({ pgId: { $in: pgIds }})
            .populate('userId', 'name email')
            .populate('pgId', 'pgname location');
        res.json({ bookings });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

module.exports = bookingCltr;