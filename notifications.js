// routes/notification.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");

// -----------------
// GET: Fetch notifications for a user
// -----------------
router.get("/", async (req, res) => {
    const username = req.query.username; // username of logged-in user
    if (!username) return res.status(400).json({ error: "Username is required" });

    try {
        const notifications = await Notification.find({
            $or: [
                { type: "public" },
                { type: "user", username }
            ]
        }).sort({ createdAt: -1 });

        res.json(notifications);
    } catch (err) {
        console.error("FETCH NOTIFICATIONS ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// -----------------
// POST: Admin sends public notification
// -----------------
router.post("/public", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
        const notif = await Notification.create({
            type: "public",
            message
        });

        res.json({ message: "Public notification sent", notif });
    } catch (err) {
        console.error("PUBLIC NOTIFICATION ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// -----------------
// POST: Admin sends user-specific notification
// -----------------
router.post("/user", async (req, res) => {
    const { username, message } = req.body;
    if (!username || !message) return res.status(400).json({ error: "Username and message required" });

    try {
        const notif = await Notification.create({
            type: "user",
            username,
            message
        });

        res.json({ message: "User notification sent", notif });
    } catch (err) {
        console.error("USER NOTIFICATION ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// -----------------
// PUT: Mark notification as read
// -----------------
router.put("/:id/read", async (req, res) => {
    try {
        const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        if (!notif) return res.status(404).json({ error: "Notification not found" });

        res.json({ message: "Notification marked as read", notif });
    } catch (err) {
        console.error("MARK READ ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
