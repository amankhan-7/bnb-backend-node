// src/routes/payment.routes.js

import express from "express";
import {
  processPaymentController,
  getPaymentByBookingController,
  updateSurgeFactorController,
} from "../controllers/payment.controller.js";


import authMiddleware, { requireRole } from "../utils/auth.js";

const router = express.Router();

// Process payment (your mock PIN flow)
router.post("/process", authMiddleware, processPaymentController);

// Get payment by booking
router.get("/booking/:bookingId", authMiddleware, getPaymentByBookingController);

// Update surge pricing
router.patch(
  "/surge",
  authMiddleware, requireRole("owner"),
  updateSurgeFactorController
);

export default router;