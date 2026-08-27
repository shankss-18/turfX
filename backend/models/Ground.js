const mongoose = require('mongoose')

const groundSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    location : {
        type : String,
        required: true
    },
    openTime : {
        type : String,
        required: true
    },
    closeTime : {
        type : String,
        required: true
    },
    slotDurationMins : {
        type: Number,
        default: 60
    },
    pricePerSlot: {
        type: Number,
        required: true
    },
    peakPrice: {
        type: Number,
    },
}, {timestamps: true})

module.exports = mongoose.model('Ground', groundSchema)