// services/room.service.js

import Room from "../db/models/rooms.js";
import Hotel from "../db/models/hotels.js";
import deleteUnusedCloudinaryImages from "../utils/deleteCloudinaryImages.js";

//  Create Room
const createRoom = async (data, userId) => {
  const hotel = await Hotel.findById(data.hotelId);

  if (!hotel) throw new Error("Hotel not found");

  if (hotel.owner.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  return await Room.create(data);
};

// Get all rooms of a hotel
const getRoomsByHotel = async (hotelId) => {
  return await Room.find({ hotelId });
};

// Get single room
const getRoomById = async (roomId) => {
  const room = await Room.findById(roomId);

  if (!room) throw new Error("Room not found");

  return room;
};

// Update Room
const updateRoom = async (roomId, data, userId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  const hotel = await Hotel.findById(room.hotelId);

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  if (hotel.owner.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  // Keep old photos safely
  const oldPhotos = [...room.photos];

  // ❗ Only allow safe fields (VERY IMPORTANT)
  const allowedFields = {
    type: data.type,
    basePrice: data.basePrice,
    amenities: data.amenities,
    totalCount: data.totalCount,
    capacity: data.capacity,
    photos: data.photos, // controlled explicitly
  };

  Object.keys(allowedFields).forEach(
    (key) => {
      if (allowedFields[key] !== undefined) {
        room[key] = allowedFields[key];
      }
    }
  );

  await room.save();

  // Cloudinary cleanup
  try {
    await deleteUnusedCloudinaryImages(
      oldPhotos,
      room.photos
    );
  } catch (err) {
    console.error(
      "Cloudinary cleanup failed:",
      err.message
    );
  }

  return room;
};

// Delete Room
const deleteRoom = async (roomId, userId) => {
  const room = await Room.findById(roomId);

  if (!room) throw new Error("Room not found");

  const hotel = await Hotel.findById(room.hotelId);

  if (hotel.owner.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  await Room.findByIdAndDelete(roomId);
};

export default {
  createRoom,
  getRoomsByHotel,
  getRoomById,
  updateRoom,
  deleteRoom,
};