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

  // Save existing photos before update
  const oldPhotos = [...room.photos];

  Object.assign(room, data);

  await room.save();

  // Delete removed Cloudinary images
 try {
  await deleteUnusedCloudinaryImages(
    oldPhotos,
    room.photos
  );
} catch (err) {
  console.error(
    "Cloudinary cleanup failed:",
    err
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