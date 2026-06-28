// models/Complaint.js
// const mongoose = require("mongoose");
// 
// const complaintSchema = new mongoose.Schema({
    // username: { type: String, required: true },  // from localStorage login
    // message: { type: String, required: true }, 
    //  images: [{ type: String }], 
    //  videos: [{ type: String }],  // complaint text
    // createdAt: { type: Date, default: Date.now }
// });
// 
// module.exports = mongoose.model("Complaint", complaintSchema);
// 

const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    username: { type: String, required: true },
    message: { type: String, required: true },

    images: [{ type: String }],
    videos: [{ type: String }],

    status: {
        type: String,
        enum: ["Pending", "Resolved"],
        default: "Pending"
    },

    adminReply: {
        type: String,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
