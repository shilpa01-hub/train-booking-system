// const mongoose = require('mongoose');
// require('dotenv').config();
// const Train = require('./models/train'); // path to your train model
// const trains = require('./data/train'); // path to your train data

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log('MongoDB connected for seeding'))
//     .catch(err => console.log('MongoDB connection error:', err));

// async function seedDB() {
//     try {
//         // Optional: delete existing trains first
//         await Train.deleteMany({});
//         console.log('Existing trains deleted');

//         // Insert seed data
//         await Train.insertMany(trains);
//         console.log('Train data seeded successfully');

//         process.exit();
//     } catch (err) {
//         console.error(err);
//         process.exit(1);
//     }
// }

// seedDB();
const mongoose = require('mongoose');
require('dotenv').config();
const Train = require('./models/train'); // path to your Train model
const trains = require('./data/train');  // path to your train data

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected for seeding'))
    .catch(err => console.log('MongoDB connection error:', err));

async function seedDB() {
    try {
        // Loop through all trains in your array
        for (const t of trains) {
            const trainData = {
                ...t,
                totalSleeperSeats: t.totalSleeperSeats || 50,     // default if not present
                // availableSleeperSeats: t.availableSleeperSeats || 50,
                totalAC1Seats: t.totalAC1Seats || 20,
                totalAC2Seats: t.totalAC2Seats || 20,
                totalAC3Seats: t.totalAC3Seats || 20,
                // availableACSeats: t.availableACSeats || 20
            };

            // Insert new train or update existing one based on trainName
            await Train.updateOne(
                { trainName: trainData.trainName }, // find by trainName
                { $set: trainData },                // update all fields
                { upsert: true }                    // insert if not found
            );
        }

        console.log('Trains inserted/updated successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedDB();
