import Hotel from "../db/models/hotels.js";
import Room from "../db/models/rooms.js";
import Inventory from "../db/models/inventory.js";
import hotelService from "./hotel.service.js";
import deleteUnusedCloudinaryImages from "../utils/deleteCloudinaryImages.js";

const createOwnerHotel = async (ownerId, data) => {
  return Hotel.create({
    ...data,
    owner: ownerId,
    active: false,
  });
};

const getOwnerHotels = async (ownerId) => {
  return Hotel.find({ owner: ownerId }).sort({ createdAt: -1 });
};

const getOwnerHotelById = async (ownerId, hotelId) => {
  const hotel = await Hotel.findOne({ _id: hotelId, owner: ownerId });
  if (!hotel) throw new Error("Hotel not found for this owner");
  return hotel;
};

export const updateOwnerHotel = async (ownerId, hotelId, data) => {
  const hotel = await Hotel.findById(hotelId);

  if (!hotel) {
    throw new Error("Hotel not found");
  }

  if (hotel.owner.toString() !== ownerId.toString()) {
    throw new Error("Unauthorized for this hotel");
  }

  // keep snapshot before update
  const oldPhotos = [...hotel.photos];

  Object.assign(hotel, data);
  await hotel.save();

  // cleanup cloudinary AFTER successful save
  // Delete removed Cloudinary images
  try {
    await deleteUnusedCloudinaryImages(oldPhotos, hotel.photos);
  } catch (err) {
    console.error("Cloudinary cleanup failed:", err);
  }

  return hotel;
};

const deleteOwnerHotel = async (ownerId, hotelId) => {
  await hotelService.deleteHotel(hotelId, ownerId);
};

const activateOwnerHotel = async (ownerId, hotelId) => {
  return hotelService.activateHotel(hotelId, ownerId);
};

const createRoomForOwnerHotel = async (ownerId, hotelId, data) => {
  const hotel = await Hotel.findOne({ _id: hotelId, owner: ownerId });
  if (!hotel) throw new Error("Hotel not found for this owner");

  return Room.create({
    ...data,
    hotelId,
  });
};

const getOwnerRoomsByHotel = async (ownerId, hotelId) => {
  const hotel = await Hotel.findOne({ _id: hotelId, owner: ownerId });
  if (!hotel) throw new Error("Hotel not found for this owner");

  return Room.find({ hotelId }).sort({ createdAt: -1 });
};

const updateOwnerRoom = async (ownerId, roomId, data) => {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Room not found");

  const hotel = await Hotel.findById(room.hotelId);
  if (!hotel || hotel.owner.toString() !== ownerId.toString()) {
    throw new Error("Unauthorized for this room");
  }

  Object.assign(room, data);
  await room.save();
  return room;
};

const deleteOwnerRoom = async (ownerId, roomId) => {
  const room = await Room.findById(roomId);
  if (!room) throw new Error("Room not found");

  const hotel = await Hotel.findById(room.hotelId);
  if (!hotel || hotel.owner.toString() !== ownerId.toString()) {
    throw new Error("Unauthorized for this room");
  }

  await Inventory.deleteMany({ roomId: room._id });
  await Room.findByIdAndDelete(roomId);
};

export default {
  createOwnerHotel,
  getOwnerHotels,
  getOwnerHotelById,
  updateOwnerHotel,
  deleteOwnerHotel,
  activateOwnerHotel,
  createRoomForOwnerHotel,
  getOwnerRoomsByHotel,
  updateOwnerRoom,
  deleteOwnerRoom,
};
