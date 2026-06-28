    const express = require('express');
    const router = express.Router();
    const Train = require('../models/train');


    router.get('/search', async (req, res) => {
    const { from, to } = req.query;

    if (!from || !to) {
        return res.status(400).json({ error: 'Please provide from and to stations' });
    }

    try {
        // Step 1: Find trains having both stations
        const trains = await Train.find({
            routeStations: { $all: [from, to] }
        });

        // Step 2: ONLY keep trains where from comes BEFORE to
        const validTrains = trains.filter(train => {
            const route = train.routeStations;
            return route.indexOf(from) < route.indexOf(to);
        });

        // Step 3: Fare calculation
        const result = validTrains.map(train => {
            const route = train.routeStations;
            const startIndex = route.indexOf(from);
            const endIndex = route.indexOf(to);
            const numStations = endIndex - startIndex;

            return {
                ...train.toObject(),
                fare: {
                    sleeper: train.fareSleeper * numStations,
                    ac1: train.fareAC1 * numStations,
                    ac2: train.fareAC2 * numStations,
                    ac3: train.fareAC3 * numStations
                }
            };
        });

        res.status(200).json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
    // GET all unique stations
    router.get('/stations', async (req, res) => {
    try {
        const trains = await Train.find({}, { routeStations: 1 });
        const allStations = trains.flatMap(train => train.routeStations);
        const uniqueStations = [...new Set(allStations)]; // remove duplicates
        res.json(uniqueStations);
    } catch (err) {
        console.error("Error fetching stations:", err);
        res.status(500).json({ error: "Server error" });
    }
    });
    // GET single train route stations by trainId
router.get('/:id/routes', async (req, res) => {
  try {
    const train = await Train.findById(req.params.id, {
      routeStations: 1,
      trainName: 1,
      departure: 1,
      arrival: 1
    });

    if (!train) {
      return res.status(404).json({ error: 'Train not found' });
    }

    res.json({
      trainName: train.trainName,
      routeStations: train.routeStations,
      departure: train.departure,
      arrival: train.arrival
    });

  } catch (err) {
    console.error("Error fetching train routes:", err);
    res.status(500).json({ error: 'Server error' });
  }
});



    module.exports = router;
