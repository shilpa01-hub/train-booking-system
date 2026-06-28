const mongoose = require("mongoose");

const trainAvailabilitySchema = new mongoose.Schema({
  trainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Train",
    required: true
  },

  journeyDate: {
    type: Date,
    required: true
  },

  availableSeats: {
    sleeper: { type: Number, default: 0 },
    ac1: { type: Number, default: 0 },
    ac2: { type: Number, default: 0 },
    ac3: { type: Number, default: 0 }
  },
  

  waitingList: {
    sleeper: { type: Number, default: 0 },
    ac1: { type: Number, default: 0 },
    ac2: { type: Number, default: 0 },
    ac3: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model("TrainAvailability", trainAvailabilitySchema);
