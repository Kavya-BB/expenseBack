const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
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
    roomRating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comments: {
        type: String
    }
}, { timestamps: true });

const Rating = new mongoose.model('Rating', ratingSchema);

module.exports = Rating;