// src/services/booking.service.js
import mongoose from "mongoose";
import Booking from "../db/models/booking.js";
import Inventory from "../db/models/inventory.js";
import Room from "../db/models/rooms.js";
import { getDateRange } from "../utils/getDateRange.js";
import crypto from "crypto";
import { redis } from "../config/redis.js";

export const createBookingService = async ({
  userId,
  hotelId,
  roomId,
  fromDate,
  toDate,
  guests,
}) => {
  const dates = getDateRange(fromDate, toDate);

  const normalize = (d) => new Date(d).toISOString().split("T")[0];

  const lockedKeys = [];
  const locksToDelete = [];

  const session = await mongoose.startSession();

  let booking;

  try {
    await session.withTransaction(async () => {
      const unavailableDates = [];

      const room = await Room.findById(roomId).session(session);

      if (!room) {
        throw new Error("Room not found");
      }

      let totalPrice = 0;

      // ---------------------------------
      // 1. Check existing booking
      // ---------------------------------
      const existingBooking = await Booking.findOne({
        user: userId,
        room: roomId,
        status: "PENDING",
        expiresAt: {
          $gt: new Date(),
        },
      }).session(session);

      const oldDates = existingBooking
        ? getDateRange(existingBooking.fromDate, existingBooking.toDate)
        : [];

      const newDates = dates;

      const oldSet = new Set(oldDates.map(normalize));

      const newSet = new Set(newDates.map(normalize));

      const addedDates = newDates.filter((d) => !oldSet.has(normalize(d)));

      const removedDates = oldDates.filter((d) => !newSet.has(normalize(d)));

      // Validate only added dates
      const datesToValidate = existingBooking ? addedDates : newDates;

      // ---------------------------------
      // 2. Validate inventory + locks
      // ---------------------------------
      for (const date of datesToValidate) {
        let inventory = await Inventory.findOne({
          roomId,
          date,
        }).session(session);

        // create inventory if missing
        if (!inventory) {
          inventory = await Inventory.findOneAndUpdate(
            {
              roomId,
              date,
            },
            {
              $setOnInsert: {
                hotelId,
                roomId,
                date,
                totalCount: room.totalCount,
                closed: false,
              },
            },
            {
              upsert: true,
              returnDocument: "after",
              session,
            },
          );
        }

        if (inventory.closed) {
          throw new Error(`Room closed on ${normalize(date)}`);
        }

        const available = inventory.totalCount - inventory.bookedCount;

        if (available <= 0) {
          unavailableDates.push(normalize(date));
          continue;
        }

        // last room lock
        if (available === 1) {
          const key = `lock:${roomId}:${normalize(date)}`;

          const owner = await redis.get(key);

          // someone else owns lock
          if (owner && owner !== userId.toString()) {
            throw new Error(`Room temporarily locked on ${normalize(date)}`);
          }

          // create lock if not mine
          if (!owner) {
            const ok = await redis.set(key, userId.toString(), {
              nx: true,
              ex: 900,
            });

            if (!ok) {
              throw new Error(`Room temporarily locked on ${normalize(date)}`);
            }

            lockedKeys.push(key);
          }
        }
      }

      // ---------------------------------
      // 3. Stop unavailable dates
      // ---------------------------------
      if (unavailableDates.length > 0) {
        const formattedDates = unavailableDates.map((date) =>
          new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
        );

        throw new Error(`Room unavailable on ${formattedDates.join(", ")}`);
      }

      // ---------------------------------
      // 4. Calculate FULL price
      // (always final dates)
      // ---------------------------------
      for (const date of newDates) {
        const inventory = await Inventory.findOne({
          roomId,
          date,
        }).session(session);

        const base = room.basePrice;

        const adults = guests?.adults ?? 0;

        const children = guests?.children ?? 0;

        const extraAdults = Math.max(0, adults - 2);

        const adultCost = extraAdults * (0.25 * base);

        const childCost = children * (0.13 * base);

        const dayPrice = (base + adultCost + childCost) * inventory.surgeFactor;

        totalPrice += Math.round(dayPrice);
      }

      // ---------------------------------
      // 5. Existing booking update
      // ---------------------------------
      if (existingBooking) {
        // queue lock cleanup
        for (const date of removedDates) {
          const key = `lock:${roomId}:${normalize(date)}`;

          const owner = await redis.get(key);

          if (owner === userId.toString()) {
            locksToDelete.push(key);
          }
        }

        existingBooking.fromDate = fromDate;

        existingBooking.toDate = toDate;

        existingBooking.guests = guests;

        existingBooking.totalPrice = totalPrice;

        await existingBooking.save({
          session,
        });

        booking = existingBooking;

        return;
      }

      // ---------------------------------
      // 6. Create booking
      // ---------------------------------
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const createdBooking = await Booking.create(
        [
          {
            user: userId,
            hotel: hotelId,
            room: roomId,
            fromDate,
            toDate,
            guests,
            totalPrice,
            status: "PENDING",
            expiresAt,
          },
        ],
        { session },
      );

      booking = createdBooking[0];
    });

    // ---------------------------------
    // 7. Delete removed locks
    // AFTER successful transaction
    // ---------------------------------
    for (const key of locksToDelete) {
      const owner = await redis.get(key);

      if (owner === userId.toString()) {
        await redis.del(key);
      }
    }

    return booking;
  } catch (err) {
    // rollback created locks
    for (const key of lockedKeys) {
      const owner = await redis.get(key);

      if (owner === userId.toString()) {
        await redis.del(key);
      }
    }

    throw err;
  } finally {
    await session.endSession();
  }
};
//list of alll bookings done either failed or success
export const getUserBookingsService = async (userId) => {
  return Booking.find({ user: userId })
    .populate("hotel room")
    .sort({ createdAt: -1 });
};

export const getBookingByIdService = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate("hotel room");
  if (!booking) throw new Error("Booking not found");
  return booking;
};

export const cancelBookingService = async (bookingId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) throw new Error("Booking not found");
  if (booking.status === "CANCELLED") throw new Error("Already cancelled");

  const dates = getDateRange(booking.fromDate, booking.toDate);

  for (const date of dates) {
    await Inventory.findOneAndUpdate(
      { roomId: booking.room, date },
      { $inc: { bookedCount: -1 } },
    );
  }

  booking.status = "CANCELLED";
  booking.paymentStatus = "FAILED";

  await booking.save();

  return booking;
};
