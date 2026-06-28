const express = require("express");
const router = express.Router();
const TrainAvailability = require("../models/trainavailability");
const Booking = require("../models/booking");

// 🔹 Predefined berth generator
function generateBerths(totalSeats, berthTypes = ["L", "M", "U"]) {
    const seats = [];
    for (let i = 1; i <= totalSeats; i++) {
        const berth = berthTypes[(i - 1) % berthTypes.length];
        seats.push(`${berth}${i}`);
    }
    return seats;
}

// Define seat arrays per coach
const SEAT_MAP = {
    sleeper: generateBerths(50),
    ac1: generateBerths(20, ["L","U"]),
    ac2: generateBerths(20, ["L","U"]),
    ac3: generateBerths(20, ["L","U"])
};

// 🔹 Allocate seats dynamically
async function allocateSeats(trainId, date, coach, passengerCount) {
    const bookings = await Booking.find({ trainId, date, coach });

    // Seats already booked (not cancelled)
    const bookedSeats = [];
    bookings.forEach(b => {
        b.passengers.forEach(p => {
            if (!p.cancelled && p.seatNo) bookedSeats.push(p.seatNo);
        });
    });

    // Allocate first available seats from predefined array
    const possibleSeats = SEAT_MAP[coach.toLowerCase()];
    const allocated = [];
    for (let seat of possibleSeats) {
        if (!bookedSeats.includes(seat)) {
            allocated.push(seat);
            if (allocated.length === passengerCount) break;
        }
    }

    if (allocated.length < passengerCount) {
        throw new Error("Not enough seats available");
    }

    return allocated;
}

// 🔹 BOOKING ROUTE
router.post("/book", async (req, res) => {
    try {
        const { trainId, trainName, date, coach, passengerCount, passengers, fromStation, toStation, departureTime, arrivalTime, totalFare, username, email } = req.body;
        const count = parseInt(passengerCount);

        if (!trainId || !date || !coach || !count || !passengers || !email) {
            return res.status(400).json({ message: "Missing fields" });
        }

        // 🔹 Find availability
        const start = new Date(date); start.setHours(0,0,0,0);
        const end = new Date(date); end.setHours(23,59,59,999);

        let availability = await TrainAvailability.findOne({
            trainId,
            journeyDate: { $gte: start, $lte: end }
        });

        if (!availability) return res.status(400).json({ message: "No availability found" });
        const coachKey = coach.toLowerCase();
        if (!availability.availableSeats[coachKey] || availability.availableSeats[coachKey] < count) {
            return res.status(400).json({ message: "Seats not available" });
        }

        // Allocate seats
        const allocatedSeats = await allocateSeats(trainId, date, coach, count);

        // Assign seat numbers to passengers
        const newPassengers = passengers.map((p, i) => ({
            name: p.name,
            age: p.age,
            gender: p.gender,
            cancelled: false,
            seatNo: allocatedSeats[i]
        }));

        // 🔹 Reduce available seats and save booked seat numbers
        availability.availableSeats[coachKey] -= count;
        availability.bookedSeats = availability.bookedSeats || [];
        availability.bookedSeats.push(...allocatedSeats);
        await availability.save();

        // Save booking
        const pnr = "PNR" + Date.now();
        const newBooking = new Booking({
            trainId, trainName, date, coach,
            passengers: newPassengers,
            fromStation, toStation,
            departureTime, arrivalTime,
            totalFare, username, email,
            ticketType: "RESERVED",
            status: "PENDING",
            pnr
        });
        await newBooking.save();

        res.json({
            message: "Seat booked successfully",
            bookingId: newBooking._id, 
            pnr: newBooking.pnr,
            seats: allocatedSeats,
            remainingSeats: availability.availableSeats[coachKey]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Booking failed" });
    }
});

// 🔹 CANCEL ROUTE
router.post("/cancel", async (req, res) => {
    try {
        const { bookingId, passengerIndexes } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        const isFullCancel = !passengerIndexes || passengerIndexes.length === 0;
        const freedSeats = [];

        booking.passengers.forEach((p, i) => {
            if (isFullCancel || passengerIndexes.includes(i)) {
                if (!p.cancelled) {
                    p.cancelled = true;
                    freedSeats.push(p.seatNo);
                }
            }
        });

        const active = booking.passengers.filter(p => !p.cancelled);
        booking.status = active.length === 0 ? "CANCELLED" : "PARTIALLY_CANCELLED";
        await booking.save();

        // 🔹 Update availability
        const start = new Date(booking.date); start.setHours(0,0,0,0);
        const end = new Date(booking.date); end.setHours(23,59,59,999);

        const availability = await TrainAvailability.findOne({
            trainId: booking.trainId,
            journeyDate: { $gte: start, $lte: end }
        });

        if (availability) {
            const coachKey = booking.coach.toLowerCase();
            availability.availableSeats[coachKey] += freedSeats.length;

            // Remove freed seats from bookedSeats array
            availability.bookedSeats = availability.bookedSeats || [];
            availability.bookedSeats = availability.bookedSeats.filter(s => !freedSeats.includes(s));

            await availability.save();
        }

        res.json({
            message: "Cancellation successful",
            status: booking.status,
            freedSeats
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Cancellation failed" });
    }
});

// 🔹 Get user bookings
router.get("/user/:username", async (req, res) => {
    try {
        const bookings = await Booking.find({ username: req.params.username }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});

// 🔹 Get all bookings (admin)
router.get("/all", async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});
// GET /api/bookings/upcoming/:username
router.get("/upcoming/:username", async (req, res) => {
  const username = req.params.username;
  const today = new Date();
  today.setHours(0,0,0,0); // remove time for accurate comparison

  try {
    const upcoming = await Booking.find({
      username: username,
      date: { $gte: today.toISOString().split("T")[0] }, // future or today
      status: { $ne: "CANCELLED" } // ignore cancelled
    }).sort({ date: 1 }); // soonest first

    res.json(upcoming);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch upcoming journeys" });
  }
});
router.post("/book-general", async (req, res) => {
  try {
    const { trainId, trainName, date, fromStation, toStation, passengerCount, totalFare, username, email } = req.body;

    if(!trainId || !date || !passengerCount || !email){
      return res.status(400).json({ message: "Missing fields" });
    }

    const pnr = "GN" + Date.now();

    const booking = new Booking({
      trainId,
      trainName,
      date,
      fromStation,
      toStation,
      passengerCount,
      totalFare,
      username,
      email,
      ticketType: "GENERAL",
      status: "PENDING",
      pnr
    });

    await booking.save();

    res.json({
      message: "General ticket booked",
      pnr
    });

  } catch(err){
    res.status(500).json({ message: "General booking failed" });
  }
});





module.exports = router;
