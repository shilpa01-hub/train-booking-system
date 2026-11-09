// seedAvailability.js
const mongoose = require("mongoose");
require("dotenv").config();
const Train = require("./models/train"); // your Train model
const TrainAvailability = require("./models/trainavailability"); // your TrainAvailability model

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected for availability seeding"))
    .catch(err => console.log("❌ MongoDB connection error:", err));

// Helper function to get next N days
function getNextNDates(n) {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d);
    }
    return dates;
}

async function seedAvailability() {
    try {
        const trains = await Train.find();
        if (trains.length === 0) {
            console.log("⚠️ No trains found. Please seed trains first.");
            process.exit();
        }

        const dates = getNextNDates(120); // next 4 months approx 120 days

        for (const train of trains) {
            for (const date of dates) {
                // Check if availability already exists for this train + date
                const existing = await TrainAvailability.findOne({
                    trainId: train._id,
                    journeyDate: date
                });

                if (!existing) {
                    const newAvailability = new TrainAvailability({
                        trainId: train._id,
                        journeyDate: date,
                        availableSeats: {
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
                        }
                    });
                    await newAvailability.save();
                }
            }
        }

        console.log("✅ Train availability for next 4 months seeded successfully!");
        process.exit();
    } catch (err) {
        console.error("❌ Error seeding availability:", err);
        process.exit(1);
    }
}

seedAvailability();
