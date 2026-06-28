const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

/**
 * Create Razorpay order
 * POST /api/payment/create-order
 * Body: { amount }
 */
router.post("/create-order", paymentController.createOrder);

/**
 * Verify Razorpay payment
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post("/verify", paymentController.verifyPayment);

/**
 * Get payment details
 * GET /api/payment/:paymentId
 */
router.get("/:paymentId", paymentController.getPaymentDetails);
router.post("/cancel", async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== "PENDING") {
      return res.json({ success: false });
    }

    booking.status = "CANCELLED";
    await booking.save();

    const availability = await TrainAvailability.findOne({
      trainId: booking.trainId,
      journeyDate: booking.date
    });

    if (availability) {
      const coachKey = booking.coach.toLowerCase();
      availability.availableSeats[coachKey] += booking.passengers.length;
      await availability.save();
    }

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
