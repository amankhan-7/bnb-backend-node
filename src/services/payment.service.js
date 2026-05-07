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
  session.startTransaction();
  //console.log("userId", userId);

  try {
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking) throw new Error("Booking not found");
    if (booking.user.toString() !== userId) throw new Error("Unauthorized");
    if (booking.status === "CONFIRMED") throw new Error("Already paid");

    if (booking.expiresAt < new Date()) {
      throw new Error("Booking expired. Please book again.");
    }

    // 1. Create payment record
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

    if (success) {
      //  confirm booking
      booking.status = "CONFIRMED";
      booking.paymentId = payment[0]._id;
      await booking.save({ session });
    } else {
      // release inventory
      const dates = getDateRange(booking.fromDate, booking.toDate);

      await Inventory.updateMany(
        {
          roomId: booking.room,
          date: { $in: dates },
          bookedCount: { $gt: 0 },
        },
        {
          $inc: { bookedCount: -1 },
        },
        { session },
      );

      booking.status = "CANCELLED";
      booking.paymentId = payment[0]._id;
      await booking.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return {
      booking,
      payment: payment[0],
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
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
