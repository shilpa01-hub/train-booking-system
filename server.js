const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = 5000;

// Import user routes
const userRoutes = require('./routes/user');
const trainRoutes = require('./routes/train');
const adminRoutes = require('./routes/admin');
const availabilityRoutes = require("./routes/availability");
const complaintRoutes = require("./routes/complaintRoutes");
const testBookingRoutes = require("./routes/testBooking");
const bookingRoutes = require("./routes/testBooking");
const notificationsRoute = require("./routes/notifications");
const faqRoutes = require("./routes/faq");
const paymentRoutes = require("./routes/payment");
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB Error:", err));

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/train', trainRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/faq", faqRoutes);


app.use("/api/availability", availabilityRoutes);
app.use("/api/complaints", complaintRoutes);

app.use('/uploads', express.static('uploads'));
app.use("/api/test-booking", testBookingRoutes);
app.use("/api/bookings", bookingRoutes); 
app.use("/api/notifications", notificationsRoute);
app.use("/api/payment", paymentRoutes);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Serve admin dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/admindash.html'); // adjust path if needed
});


// Serve user dashboard
app.get('/user/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/userdash.html'); // if you have one
});

