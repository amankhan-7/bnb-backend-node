import mongoose from "mongoose";
import Booking from "../db/models/booking.js";
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

export const handleExpiredBookings = async () => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const expiredBookings = await Booking.find({
        status: "PENDING",
        expiresAt: { $lt: new Date() }, //+payment window expired
      })
        .limit(100)
        .session(session);

      for (const b of expiredBookings) {
        // atomic ownership check
        const updated = await Booking.findOneAndUpdate(
          {
            _id: b._id,
            status: "PENDING",
          },
          {
            $set: {
              status: "EXPIRED",
            },
          },
          {
            returnDocument: "after",
            session,
          },
        );

        if (!updated) continue;

        const dates = getDateRange(b.fromDate, b.toDate);

        for (const date of dates) {
          await Inventory.findOneAndUpdate(
            {
              roomId: b.room,
              date,
              bookedCount: { $gt: 0 },
            },
            {
              $inc: { bookedCount: -1 },
            },
            { session },
          );
        }
      }
    });
  } finally {
    await session.endSession();
  }
};
