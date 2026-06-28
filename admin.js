
const express = require('express');
const router = express.Router();
const Train = require('../models/train');
const User = require("../models/user");
const Booking = require("../models/booking");
const TrainAvailability = require('../models/trainavailability');



// ADD or UPDATE train
router.get('/trains', async (req, res) => {
    try {
        const trains = await Train.find();
        res.json(trains);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trains' });
    }
});
router.post('/trains', async (req, res) => {
    try {
        const trainData = req.body;

        // 1️⃣ Check if train already exists using trainName
        let existingTrain = await Train.findOne({
            trainName: trainData.trainName
        });

        if (existingTrain) {
            // 2️⃣ UPDATE existing train
            existingTrain.trainType = trainData.trainType;
            existingTrain.from = trainData.from;
            existingTrain.to = trainData.to;
            existingTrain.departure = trainData.departure;
            existingTrain.arrival = trainData.arrival;
            existingTrain.routeStations = trainData.routeStations;
            existingTrain.totalSleeperSeats = trainData.totalSleeperSeats;
            existingTrain.totalAC1Seats = trainData.totalAC1Seats;
             existingTrain.totalAC2Seats = trainData.totalAC2Seats;
              existingTrain.totalAC3Seats = trainData.totalAC3Seats;
            existingTrain.fareSleeper = trainData.fareSleeper;
            

// AC fares
            existingTrain.fareAC1 = trainData.fareAC1;
            existingTrain.fareAC2 = trainData.fareAC2;
            existingTrain.fareAC3 = trainData.fareAC3; 
            existingTrain.fareGeneral = trainData.fareGeneral;

            await existingTrain.save();

            return res.json({ message: 'Train updated successfully' });
        } else {
            // 3️⃣ ADD new train
            const newTrain = new Train(trainData);
           const savedTrain = await newTrain.save();
            for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    await TrainAvailability.create({
        trainId: savedTrain._id,
        journeyDate: date, 
           availableSeats: {// store as YYYY-MM-DD
        sleeper: savedTrain.totalSleeperSeats,
        ac1: savedTrain.totalAC1Seats,
        ac2: savedTrain.totalAC2Seats,
        ac3: savedTrain.totalAC3Seats,
          },
       
    });
}

            return res.json({ message: 'Train added successfully' });
        }

    } catch (error) {
        console.error("🚨 Error in POST /trains:", error); 
        res.status(500).json({
            message: 'Error adding/updating train',
            error: error
        });
    }
});

router.delete('/trains/:id', async (req, res) => {
    console.log("🗑️ DELETE request received");
    console.log("📌 Train ID:", req.params.id);

    try {
        const deletedTrain = await Train.findByIdAndDelete(req.params.id);

        if (!deletedTrain) {
            console.log("⚠️ Train not found in DB");
            return res.status(404).json({ error: "Train not found" });
        }

        console.log("✅ Train deleted:", deletedTrain.trainName);
        res.status(200).json({ message: "Train deleted successfully" });

    } catch (error) {
        console.error("❌ Backend delete error:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// GET all users
router.get("/users", async (req,res)=>{
    const users = await User.find({}, "-password");
    res.json(users);
});

// BLOCK / UNBLOCK user
router.put("/users/:id/block", async (req,res)=>{
    const { blocked } = req.body;
    await User.findByIdAndUpdate(req.params.id, { blocked });
    res.json({ message:"User updated" });
});
router.get("/reports", async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();

        const revenueResult = await Booking.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$totalFare" } } }
        ]);
        const totalRevenue = revenueResult[0]?.totalRevenue || 0;
        const cancelledResult = await Booking.aggregate([
    { $match: { status: "CANCELLED" } },
    { $group: { _id: null, cancelAmount: { $sum: "$totalFare" } } }
]);

const cancelAmount = cancelledResult[0]?.cancelAmount || 0;
// 🟢 Bookings per Day (Date-wise)
const datewise = await Booking.aggregate([
    {
        $group: {
            _id: "$date",   // same date wali bookings group hongi
            count: { $sum: 1 }
        }
    },
    { $sort: { _id: 1 } } // date order me
]);


        // Today bookings
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // yyyy-mm-dd
        const todaysBookings = await Booking.countDocuments({ date: dateString });

        res.json({
            totalBookings,
            totalRevenue,
            cancelAmount,
            datewise: datewise.map(d => ({
        date: d._id,
        count: d.count
    }))
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to load reports" });
    }
});



module.exports = router;
