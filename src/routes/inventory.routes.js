// src/routes/inventory.routes.js

import express from "express";
import {
  getRoomAvailabilityController,
  getInventoryCalendarController,
  updateSurgeFactorController,
  updateRoomAvailabilityController,
} from "../controllers/inventory.controller.js";

import authMiddleware, { requireRole } from "../utils/auth.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Inventory route working");
});

// Get room availability for booking UI
// Example:
// /inventory/availability?roomId=123&fromDate=2026-05-10&toDate=2026-05-14
router.get("/availability", getRoomAvailabilityController);

// Get room inventory calendar (owner/admin)
router.get(
  "/calendar/:roomId",
  authMiddleware,
  requireRole("owner"),
  getInventoryCalendarController,
);

// Update surge factor
router.patch(
  "/surge",
  authMiddleware,
  requireRole("owner"),
  updateSurgeFactorController,
);

// Open / close room inventory dates
router.patch(
  "/availability",
  authMiddleware,
  requireRole("owner"),
  updateRoomAvailabilityController,
);

export default router;
