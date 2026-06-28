const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Signup route
router.post('/signup', async (req, res) => {
    const { username,email, password } = req.body;
    // 🔒 BACKEND VALIDATIONS

// Empty check
if (!username || !password) {
    return res.status(400).json({
        error: "Username and password are required"
    });
}

// Username validation
const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
if (!usernameRegex.test(username)) {
    return res.status(400).json({
        error: "Username must be 4–20 characters and contain only letters, numbers, underscore"
    });
}
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            error: "Invalid email format"
        });
    }

// Password validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
if (!passwordRegex.test(password)) {
    return res.status(400).json({
        error: "Password must be at least 6 characters and include capital, small letter and number"
    });
}


    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ username, email,password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Username already exists or server error' });
    }
});

// Login route
// router.post('/login', async (req, res) => {
    // const { username, password } = req.body;
// 
    // try {
        // const user = await User.findOne({ username });
        // if (!user) return res.status(400).json({ error: 'User not found' });
// 
        // const isMatch = await bcrypt.compare(password, user.password);
        // if (!isMatch) return res.status(400).json({ error: 'Invalid password' });
// 
        // res.status(200).json({ message: 'Login successful', user });
    // } catch (err) {
        // console.error(err);
        // res.status(500).json({ error: 'Server error' });
    // }
// });
// 

// 
// Login route with admin/user handling
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // 🔒 BLOCK CHECK (THIS WAS MISSING)
        if (user.blocked) {
            return res.status(403).json({
                error: 'Your account has been blocked by admin'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const { password: pwd, ...userData } = user.toObject();

        if (user.role === 'admin') {
            res.status(200).json({
                message: 'Admin login successful',
                user: userData,
                redirect: '/admin/dashboard'
            });
        } else {
            res.status(200).json({
                message: 'User login successful',
                user: userData,
                redirect: '/user/dashboard'
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


