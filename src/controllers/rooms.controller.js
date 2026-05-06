// controllers/room.controller.js

import roomService from "../services/room.service.js";
import connectDB from "../db/connectDB.js";

// Create Room
const createRoom = async (req, res) => {
  try {
    await connectDB();

    const room = await roomService.createRoom(req.body, req.user.id);

    res.status(201).json(room);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// Get Rooms by Hotel
const getRoomsByHotel = async (req, res) => {
  try {
    await connectDB();

    const rooms = await roomService.getRoomsByHotel(req.params.hotelId);

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Room by ID
const getRoomById = async (req, res) => {
  try {
    await connectDB();

    const room = await roomService.getRoomById(req.params.roomId);

    res.json(room);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// Update Room
const updateRoom = async (req, res) => {
  try {
    await connectDB();

    const room = await roomService.updateRoom(
      req.params.roomId,
      req.body,
      req.user.id
    );

    res.json(room);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// Delete Room
const deleteRoom = async (req, res) => {
  try {
    await connectDB();

    await roomService.deleteRoom(req.params.roomId, req.user.id);

    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

export default {
  createRoom,
  getRoomsByHotel,
  getRoomById,
  updateRoom,
  deleteRoom,
};