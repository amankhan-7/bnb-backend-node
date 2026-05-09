// src/routes/booking.routes.js

import express from "express";
import {
  createBookingController,
  getUserBookingsController,
  getBookingByIdController,
  cancelBookingController,
} from "../controllers/booking.controller.js";

import authMiddleware from "../utils/auth.js";

const router = express.Router();

// Create booking (PENDING + inventory block)
router.post("/create", authMiddleware, createBookingController);

// Get all bookings of logged-in user
router.get("/my-bookings",authMiddleware , getUserBookingsController);

// Get single booking
router.get("/:id", authMiddleware, getBookingByIdController);

// Cancel booking (optional)
router.patch("/cancel/:id", authMiddleware,cancelBookingController);

export default router;