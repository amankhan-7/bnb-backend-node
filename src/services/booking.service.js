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
  // 1. Generate booking dates
  const dates = getDateRange(fromDate, toDate);
  const lockedKeys = [];
  // 3. Start Mongo session
  const session = await mongoose.startSession();

  let booking;

  try {
    await session.withTransaction(async () => {
      const unavailableDates = [];

      // 7. Calculate pricing
      const room = await Room.findById(roomId).session(session);

      if (!room) {
        throw new Error("Room not found");
      }

      // 4. Check inventory

      let totalPrice = 0;

      for (const date of dates) {
        let inventory = await Inventory.findOne({
          roomId,
          date,
        }).session(session);

        // create inventory if missing
        if (!inventory) {
          if (!room) {
            throw new Error("Room not found");
          }
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
                bookedCount: 0,
                totalCount: room.totalCount,
                closed: false,
              },
            },
            {
              upsert: true, //if there is no inventory found then i will create it
              returnDocument: "after",
              session,
            },
          );
        }

        // room closed for this date
        if (inventory.closed) {
          throw new Error(`Room closed on ${date}`);
        }

        const available = inventory.totalCount - inventory.bookedCount;

        // no rooms available
        if (available <= 0) {
          unavailableDates.push(date);
          continue;
        }

        // 5. Lock last available room
        if (available === 1) {
          const key = `lock:${roomId}:${date}`;

          const owner = await redis.get(key);

          // locked by someone else
          if (owner && owner !== userId.toString()) {
            throw new Error(`Room temporarily locked on ${date}`);
          }

          // create lock only if not already mine
          if (!owner) {
            const ok = await redis.set(key, userId.toString(), {
              nx: true,
              ex: 900,
            });

            if (!ok) {
              throw new Error(`Room temporarily locked on ${date}`);
            }

            lockedKeys.push(key);
          }
        }
        const base = room.basePrice;

        const adults = guests?.adults ?? 0;
        const children = guests?.children ?? 0;

        const extraAdults = Math.max(0, adults - 2);

        const adultCost = extraAdults * (0.25 * base);

        const childCost = children * (0.13 * base);

        const dayPrice = (base + adultCost + childCost) * inventory.surgeFactor;

        totalPrice += Math.round(dayPrice);
      }

      const existingBooking = await Booking.findOne({
        user: userId,
        room: roomId,
        fromDate,
        toDate,
        status: "PENDING",
        expiresAt: {
          $gt: new Date(),
        },
      }).session(session);

      if (existingBooking) {
        existingBooking.guests = guests;
        existingBooking.totalPrice = totalPrice;

        await existingBooking.save({ session });

        booking = existingBooking;
        return;
      }

      // -------------------------
      // 6. Stop if unavailable dates found
      // -------------------------
      if (unavailableDates.length > 0) {
        const formattedDates = unavailableDates.map((date) =>
          new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }),
        );

        throw new Error(`Room unavailable on ${formattedDates.join(", ")}`);
      }

      // -------------------------
      // 8. Creating booking
      // -------------------------
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

    return booking;
  } catch (err) {
    for (const key of lockedKeys) {
      const owner = await redis.get(key);

      if (owner === userId.toString()) {
        await redis.del(key);
      }
    }
    throw err;
  } finally {
    // 9. closing session
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
