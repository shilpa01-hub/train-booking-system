const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  trainId: { type: String, required: true },
  trainName: { type: String, required: true },

  date: { type: String, required: true },

  ticketType: {
    type: String,
    enum: ["RESERVED", "GENERAL"],
    required: true
  },

  coach: {
    type: String,
    required: function () {
      return this.ticketType === "RESERVED";
    }
  },

  passengers: [
    {
      name: String,
      age: Number,
      gender: String,
      cancelled: { type: Boolean, default: false },
      seatNo: String,
      berth: String
    }
  ],

  passengerCount: {
    type: Number,
    required: function () {
      return this.ticketType === "GENERAL";
    }
  },

  fromStation: String,
  toStation: String,

  departureTime: {
    type: String,
    required: function () {
      return this.ticketType === "RESERVED";
    }
  },

  arrivalTime: {
    type: String,
    required: function () {
      return this.ticketType === "RESERVED";
    }
  },

  totalFare: Number,

  email: { type: String, required: true },
  username: { type: String, required: true },

 status: {
  type: String,
  enum: ["PENDING", "CONFIRMED", "CANCELLED", "PARTIALLY_CANCELLED"],
  default: "PENDING"
},
  pnr: { type: String, unique: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", BookingSchema);
