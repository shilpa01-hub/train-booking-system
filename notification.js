// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    type: { type: String, enum: ["user", "public"], required: true },
    username: { type: String }, // only for type 'user'
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
