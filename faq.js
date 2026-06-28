// routes/faq.js
const express = require("express");
const router = express.Router();
const Faq = require("../models/faq");

// Get all FAQs (user + admin)
router.get("/", async (req, res) => {
  const faqs = await Faq.find().sort({ createdAt: -1 });
  res.json(faqs);
});

// Admin – add FAQ
router.post("/add", async (req, res) => {
  const { question, answer } = req.body;
  const faq = new Faq({ question, answer });
  await faq.save();
  res.status(201).json({ message: "FAQ added" });
});

// Admin – update FAQ
router.put("/:id", async (req, res) => {
  await Faq.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "FAQ updated" });
});

// Admin – delete FAQ
router.delete("/:id", async (req, res) => {
  await Faq.findByIdAndDelete(req.params.id);
  res.json({ message: "FAQ deleted" });
});

module.exports = router;
