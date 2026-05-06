import ownerService from "../services/owner.service.js";
import connectDB from "../db/connectDB.js";

const createHotel = async (req, res) => {
  try {
    await connectDB();

    const hotel = await ownerService.createOwnerHotel(req.user.id, req.body);
    res.status(201).json(hotel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getMyHotels = async (req, res) => {
  try {
    await connectDB();

    const hotels = await ownerService.getOwnerHotels(req.user.id);
    res.status(200).json(hotels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyHotelById = async (req, res) => {
  try {
    await connectDB();

    const hotel = await ownerService.getOwnerHotelById(
      req.user.id,
      req.params.hotelId
    );
    res.status(200).json(hotel);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const updateMyHotel = async (req, res) => {
  try {
    await connectDB();

    const hotel = await ownerService.updateOwnerHotel(
      req.user.id,
      req.params.hotelId,
      req.body
    );
    res.status(200).json(hotel);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

const deleteMyHotel = async (req, res) => {
  try {
    await connectDB();

    await ownerService.deleteOwnerHotel(req.user.id, req.params.hotelId);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

const activateMyHotel = async (req, res) => {
  try {
    await connectDB();

    const hotel = await ownerService.activateOwnerHotel(
      req.user.id,
      req.params.hotelId
    );
    res.status(200).json(hotel);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

const createRoom = async (req, res) => {
  try {
    await connectDB();

    const room = await ownerService.createRoomForOwnerHotel(
      req.user.id,
      req.params.hotelId,
      req.body
    );
    res.status(201).json(room);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

const getRoomsByHotel = async (req, res) => {
  try {
    await connectDB();

    const rooms = await ownerService.getOwnerRoomsByHotel(
      req.user.id,
      req.params.hotelId
    );
    res.status(200).json(rooms);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    await connectDB();

    const room = await ownerService.updateOwnerRoom(
      req.user.id,
      req.params.roomId,
      req.body
    );
    res.status(200).json(room);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    await connectDB();

    await ownerService.deleteOwnerRoom(req.user.id, req.params.roomId);
    res.status(204).send();
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

export default {
  createHotel,
  getMyHotels,
  getMyHotelById,
  updateMyHotel,
  deleteMyHotel,
  activateMyHotel,
  createRoom,
  getRoomsByHotel,
  updateRoom,
  deleteRoom,
};