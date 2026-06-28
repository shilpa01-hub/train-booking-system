const express = require("express");
const router = express.Router();
const TrainAvailability = require("../models/trainavailability");
const Train = require("../models/train");

// GET availability for a train on a specific date
// router.get("/:trainId/:date", async (req, res) => {
    // try {
        // const { trainId, date } = req.params;
// 
        // Convert date string to Date object (ignore time)
        // const journeyDate = new Date(date);
        // journeyDate.setHours(0, 0, 0, 0);
// 
        // const availability = await TrainAvailability.findOne({
            // trainId,
            // journeyDate
        // }).populate("trainId"); // optional if you want train info
// 
        // if (!availability) {
            // return res.status(404).json({ message: "No availability found for this date" });
        // }
// 
        // res.json(availability);
        // router.get("/:trainId/:date", async (req, res) => {
//   try {
    // const { trainId, date } = req.params;
// 
    // start of the day
    // const start = new Date(date);
    // start.setHours(0, 0, 0, 0);
// 
    // end of the day
    // const end = new Date(date);
    // end.setHours(23, 59, 59, 999);
// 
    // const availability = await TrainAvailability.findOne({
    //   trainId,
    //   journeyDate: { $gte: start, $lte: end }
    // }).populate("trainId");
// 
    // if (!availability) {
    //   return res.status(404).json({ message: "No availability found for this date" });
    // }
// 
    // res.json(availability);
    // } catch (err) {
        // console.error(err);
        // res.status(500).json({ message: "Server error" });
    // }
// });
// 
// module.exports = router;
// 
router.get("/:trainId/:date", async (req, res) => {
  try {
    const { trainId, date } = req.params;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // 1️⃣ Try to find availability (booking happened?)
    let availability = await TrainAvailability.findOne({
      trainId,
      journeyDate: { $gte: start, $lte: end }
    });

    // 2️⃣ IF NOT FOUND → take seats from Train (admin added)
    if (!availability) {
      const train = await Train.findById(trainId);

      if (!train) {
        return res.status(404).json({ message: "Train not found" });
      }

      return res.json({
        trainId: train._id,
        journeyDate: start,
        availableSeats: {
        //   sleeper: train.totalSeats.sleeper,
        //   ac1: train.totalSeats.ac1,
        //   ac2: train.totalSeats.ac2,
        //   ac3: train.totalSeats.ac3
         sleeper: train.totalSleeperSeats,
          ac1: train.totalAC1Seats,
          ac2: train.totalAC2Seats,
          ac3: train.totalAC3Seats
        },
        waitingList: {
          sleeper: 0,
          ac1: 0,
          ac2: 0,
          ac3: 0
        },
        source: "TRAIN"
      });
    }

    // 3️⃣ Availability exists → return it
    return res.json({
      ...availability.toObject(),
      source: "AVAILABILITY"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
