// routes/room.routes.js

import express from "express";
import roomController from "../controllers/rooms.controller.js";
import authMiddleware, { requireRole } from "../utils/auth.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole("owner"), roomController.createRoom);
router.get("/hotel/:hotelId", roomController.getRoomsByHotel);
router.get("/:roomId", authMiddleware, requireRole("owner"), roomController.getRoomById);
router.put("/:roomId", authMiddleware, requireRole("owner"), roomController.updateRoom);
router.delete("/:roomId", authMiddleware, requireRole("owner"), roomController.deleteRoom);

export default router;
