const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const Notification = require("../models/notification"); // ✅ Add this
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ---------------- MULTER SETUP ---------------- */

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "..", "uploads");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
        const ext = path.extname(file.originalname).toLowerCase();
        allowed.test(ext) ? cb(null, true) : cb(new Error("Invalid file type"));
    }
});

/* ---------------- POST : USER SUBMIT COMPLAINT ---------------- */

router.post(
    "/",
    upload.fields([
        { name: "images", maxCount: 10 },
        { name: "videos", maxCount: 3 }
    ]),
    async (req, res) => {
        try {
            const { username, message } = req.body;
            if (!message) return res.status(400).json({ error: "Message required" });

            const images = req.files?.images
                ? req.files.images.map(f => f.filename)
                : [];

            const videos = req.files?.videos
                ? req.files.videos.map(f => f.filename)
                : [];

            const complaint = new Complaint({
                username,
                message,
                images,
                videos
            });

            await complaint.save();
            res.status(201).json({ message: "Complaint submitted" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/* ---------------- GET : ADMIN FETCH ALL ---------------- */

router.get("/", async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

/* ---------------- PUT : ADMIN RESOLVE COMPLAINT ---------------- */

router.put("/:id/resolve", async (req, res) => {
    try {
        const { adminReply } = req.body;

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                status: "Resolved",
                adminReply
            },
            { new: true }
        );

        if (!complaint)
            return res.status(404).json({ error: "Complaint not found" });

        // ------------------- CREATE PERSONAL NOTIFICATION -------------------
        await Notification.create({
            type: "user",
            username: complaint.username,
            message: `Your complaint has been resolved: "${adminReply}"`,
            read: false
        });

        res.json({ message: "Complaint resolved and user notified", complaint });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ---------------- DELETE : ADMIN DELETE ---------------- */

router.delete("/:id", async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        // 🧹 Delete image files
        if (complaint.images && complaint.images.length > 0) {
            complaint.images.forEach(img => {
                const imgPath = path.join(__dirname, "..", "uploads", img);
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            });
        }

        // 🧹 Delete video files
        if (complaint.videos && complaint.videos.length > 0) {
            complaint.videos.forEach(vid => {
                const vidPath = path.join(__dirname, "..", "uploads", vid);
                if (fs.existsSync(vidPath)) fs.unlinkSync(vidPath);
            });
        }

        await Complaint.findByIdAndDelete(req.params.id);

        res.json({ message: "Complaint deleted successfully" });
    } catch (err) {
        console.error("DELETE COMPLAINT ERROR:", err);
        res.status(500).json({ error: "Server error while deleting complaint" });
    }
});

module.exports = router;
