// src/services/payment.service.js

import mongoose from "mongoose";
import Booking from "../db/models/booking.js";
import Payment from "../db/models/payment.js";
import Inventory from "../db/models/inventory.js";

const getDateRange = (start, end) => {
  const dates = [];
  const current = new Date(start);
  const last = new Date(end);

  while (current < last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const processPaymentService = async ({
  userId,
  bookingId,
  success,
  method,
}) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);

      if (!booking) throw new Error("Booking not found");

      if (booking.user.toString() !== userId) {
        throw new Error("Unauthorized");
      }

      if (booking.status === "CONFIRMED") {
        return; // idempotent exit
      }

      if (booking.expiresAt < new Date()) {
        booking.status = "EXPIRED";
        await booking.save({ session });

        throw new Error("Booking expired");
      }
      // prevent double processing (VERY IMPORTANT)
      if (booking.status !== "PENDING") {
        throw new Error("Invalid booking state");
      }

      const payment = await Payment.create(
        [
          {
            bookingId: booking._id,
            user: userId,
            hotel: booking.hotel,
            room: booking.room,
            amount: booking.totalPrice,
            method,
            paymentStatus: success ? "SUCCESS" : "FAILED",
            transactionId: `mock_${Date.now()}`,
          },
        ],
        { session },
      );

      booking.paymentId = payment[0]._id;

      const dates = getDateRange(booking.fromDate, booking.toDate);
      const roomId = booking.room._id;
      

      if (success) {
        booking.status = "CONFIRMED";

        // INCREMENT INVENTORY
        for (const date of dates) {
          const updated = await Inventory.findOneAndUpdate(
            {
              roomId: booking.room,
              date,
              $expr: {
                $lt: ["$bookedCount", "$totalCount"],
              },
            },
            {
              $inc: {
                bookedCount: 1,
              },
            },
            {
              session,
              new: true,
            },
          );

          if (!updated) {
            throw new Error(`Inventory unavailable for ${date}`);
          }
          await redis.del(`lock:${roomId}:${date}`);
        }
      } else {
        booking.status = "CANCELLED";

        for (const date of dates) {
          await redis.del(`lock:${roomId}:${date}`);
        }
      }

      await booking.save({ session });

      return {
        booking,
        payment: payment[0],
      };
    });
  } catch (err) {
    throw err;
  } finally {
    await session.endSession();
  }
};

export const updateSurgeFactorService = async ({
  roomId,
  fromDate,
  toDate,
  surgeFactor,
}) => {
  const dates = getDateRange(fromDate, toDate);

  const result = await Inventory.updateMany(
    {
      roomId,
      date: { $in: dates },
    },
    {
      $set: { surgeFactor },
    },
  );

  return result;
};
