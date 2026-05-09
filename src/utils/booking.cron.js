import cron from "node-cron";
import { handleExpiredBookings } from "../jobs/expireBooking.job.js";

let isRunning = false;

cron.schedule("* * * * *", async () => {
  if (isRunning) return;

  isRunning = true;

  try {
    await handleExpiredBookings();
    console.log("Expired bookings cleaned");
  } catch (err) {
    console.error(err);
  } finally {
    isRunning = false;
  }
});