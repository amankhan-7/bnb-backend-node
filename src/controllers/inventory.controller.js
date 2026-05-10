// src/controllers/inventory.controller.js

import {
  getRoomAvailabilityService,
  getInventoryCalendarService,
  updateSurgeFactorService,
  updateRoomAvailabilityService,
} from "../services/inventory.service.js";

// -----------------------------------
// Get room availability for booking UI
// -----------------------------------
export const getRoomAvailabilityController = async (req, res, next) => {
  try {
    const { roomId, fromDate, toDate } = req.query;

    const data = await getRoomAvailabilityService({
      roomId,
      fromDate,
      toDate,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------------
// Get inventory calendar (owner)
// -----------------------------------
export const getInventoryCalendarController = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const data = await getInventoryCalendarService({
      roomId,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------------
// Update surge factor
// -----------------------------------
export const updateSurgeFactorController = async (req, res, next) => {
  try {
    const { roomId, fromDate, toDate, surgeFactor } = req.body;

    const data = await updateSurgeFactorService({
      roomId,
      fromDate,
      toDate,
      surgeFactor,
    });

    return res.status(200).json({
      success: true,
      message: "Surge factor updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

// -----------------------------------
// Open / Close room inventory
// -----------------------------------
export const updateRoomAvailabilityController = async (req, res, next) => {
  try {
    const { roomId, fromDate, toDate, closed } = req.body;

    const data = await updateRoomAvailabilityService({
      roomId,
      fromDate,
      toDate,
      closed,
    });

    return res.status(200).json({
      success: true,
      message: "Room availability updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
