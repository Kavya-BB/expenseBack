const mongoose = require('mongoose');

const pgSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pgname: {
        type: String,
        required: true
    },
    location: {
        address: { type: String, required: true },
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        }
    },
    roomTypes: [
        {
            roomType: { type: String, required: true },
            count: { type: Number, required: true },
            rent: { type: Number, required: true, min: 0 }
        }
    ],
    description: {
        type: String
    },
    amenities: [{ type: String }],
    pgPhotos: [{ type: String }],
    pgCertificate: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const Pg = mongoose.model('Pg', pgSchema);

module.exports = Pg;