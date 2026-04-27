const Rating = require('../models/rating-model.js');
const ratingValidationSchema = require('../validations/rating-validation.js');
const Booking = require('../models/booking-model.js');
const Pg = require('../models/pg-model.js');
const ratingCltr = {};

ratingCltr.create = async (req, res) => {
    const body = req.body;
    try {
        const userId = req.userId;
        const { pgId, roomRating, comments } = body;
        const { error } = ratingValidationSchema.validate(body);
        if(error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const pgExists = await Pg.findById(pgId);
        if (!pgExists) {
            return res.status(404).json({ error: 'Pg not found' });
        }
        const booking = await Booking.findOne({
            userId,
            pgId,
            status: "confirmed"
        });
        if(!booking) {
            return res.status(403).json({ error: 'Only users with a confirmed booking can rate this Pg' });
        }
        let rating = await Rating.findOne({ userId, pgId });
        if(rating) {
            rating.roomRating = roomRating;
            rating.comments = comments;
        } else {
            rating = new Rating({ userId, pgId, roomRating, comments });
        }
        await rating.save();
        const allRatings = await Rating.find({ pgId });
        const averageRating = allRatings.reduce((sum, r) => sum + r.roomRating, 0) / allRatings.length;
        await Pg.findByIdAndUpdate(pgId, {
            rating: Number(averageRating.toFixed(1))
        });
        res.status(200).json({ message: "Rating saved successfully", rating });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

ratingCltr.getPgRatings = async (req, res) => {
    try {
        const pgId = req.params.pgId;
        const pgExists = await Pg.findById(pgId);
        if (!pgExists) {
            return res.status(404).json({ error: 'Pg not found' });
        }
        const ratings = await Rating.find({ pgId }).populate('userId', 'name email');
        res.status(200).json(ratings);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong!!!' });
    }
}

module.exports = ratingCltr;