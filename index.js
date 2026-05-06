import express from "express";
import cors from "cors";

import hotelRoutes from "./src/routes/hotel.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import roomRotes from "./src/routes/room.routes.js";
import bookingRoutes from "./src/routes/booking.route.js";
import paymentRoutes from "./src/routes/payment.routes.js"
import ownerRoutes from "./src/routes/owner.routes.js";

const app = express();

// CORS
app.use(
  cors({
    origin: "https://bnb-frontend-ssr.vercel.app/",
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Health check
app.get("/airbnb", (req, res) => {
  console.log("Airbnb Server is running");
  res.send("The Server is running");
});

// Routes
app.use("/auth", userRoutes);
app.use("/hotels", hotelRoutes);
app.use("/rooms", roomRotes);
app.use("/booking", bookingRoutes);
app.use("/payment", paymentRoutes);
app.use("/owner", ownerRoutes);

export default app;