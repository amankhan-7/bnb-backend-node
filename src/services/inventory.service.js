// src/services/inventory.service.js

import mongoose from "mongoose";
import Booking from "../db/models/booking.js";
import Payment from "../db/models/payment.js";
import Inventory from "../db/models/inventory.js";
import Room from "../db/models/rooms.js";
import { getDateRange } from "../utils/getDateRange.js";

// -----------------------------------
// Get room availability for booking UI
// -----------------------------------
export const getRoomAvailabilityService = async ({
  roomId,
  fromDate,
  toDate,
}) => {
  if (!roomId || !fromDate || !toDate) {
    throw new Error("roomId, fromDate and toDate are required");
  }

  const dates = getDateRange(fromDate, toDate);

  const room = await Room.findById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  const inventoryList = await Inventory.find({
    roomId,
    date: {
      $in: dates,
    },
  });

  const inventoryMap = new Map();

  for (const inventory of inventoryList) {
    const dateKey = new Date(inventory.date).toISOString().split("T")[0];

    inventoryMap.set(dateKey, inventory);
  }

  const availabilityPerDate = [];

  let minimumAvailable = Infinity;

  for (const date of dates) {
    const dateKey = new Date(date).toISOString().split("T")[0];

    const inventory = inventoryMap.get(dateKey);

    const totalCount = inventory?.totalCount ?? room.totalCount;

    const bookedCount = inventory?.bookedCount ?? 0;

    const surgeFactor = inventory?.surgeFactor ?? 1;

    const closed = inventory?.closed ?? false;

    const available = closed ? 0 : totalCount - bookedCount;

    minimumAvailable = Math.min(minimumAvailable, available);

    availabilityPerDate.push({
      date,
      totalRooms: totalCount,
      bookedRooms: bookedCount,
      availableRooms: available,
      surgeFactor,
      closed,
    });
  }

  return {
    roomId,
    availableRooms: minimumAvailable,
    dates: availabilityPerDate,
  };
};

// -----------------------------------
// Get inventory calendar (owner)
// -----------------------------------
export const getInventoryCalendarService = async ({ roomId }) => {
  if (!roomId) {
    throw new Error("roomId is required");
  }

  const inventory = await Inventory.find({
    roomId,
  }).sort({
    date: 1,
  });

  const formatted = inventory.map((item) => ({
    date: item.date,
    totalRooms: item.totalCount,
    bookedRooms: item.bookedCount,
    availableRooms: item.totalCount - item.bookedCount,
    surgeFactor: item.surgeFactor,
    closed: item.closed,
  }));

  return formatted;
};

// -----------------------------------
// Update surge factor
// -----------------------------------
export const updateSurgeFactorService = async ({
  roomId,
  fromDate,
  toDate,
  surgeFactor,
}) => {
  if (!roomId || !fromDate || !toDate) {
    throw new Error("roomId, fromDate and toDate are required");
  }

  if (surgeFactor < 1) {
    throw new Error("surgeFactor cannot be less than 1");
  }

  const dates = getDateRange(fromDate, toDate);

  const result = await Inventory.updateMany(
    {
      roomId,
      date: {
        $in: dates,
      },
    },
    {
      $set: {
        surgeFactor,
      },
    },
  );

  return {
    modifiedCount: result.modifiedCount,
  };
};

// -----------------------------------
// Open / Close room inventory
// -----------------------------------
export const updateRoomAvailabilityService = async ({
  roomId,
  fromDate,
  toDate,
  closed,
}) => {
  if (!roomId || !fromDate || !toDate) {
    throw new Error("roomId, fromDate and toDate are required");
  }

  const dates = getDateRange(fromDate, toDate);

  const result = await Inventory.updateMany(
    {
      roomId,
      date: {
        $in: dates,
      },
    },
    {
      $set: {
        closed,
      },
    },
  );

  return {
    modifiedCount: result.modifiedCount,
  };
};
