import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },

    guests: {
      adults: { type: Number, required: true, min: 1, default: 1 },
      children: { type: Number, required: true, min: 0, default: 0 },
      infants: { type: Number, required: true, min: 0, default: 0 },
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"],
      default: "PENDING",
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
