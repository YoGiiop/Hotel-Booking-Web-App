import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import { v2 as cloudinary } from "cloudinary";

const parseArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return JSON.parse(value);
};

const getCloudinaryPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    const pathname = new URL(url).pathname;
    const uploadIndex = pathname.indexOf("/upload/");

    if (uploadIndex === -1) return null;

    const assetPath = pathname.slice(uploadIndex + "/upload/".length);
    const normalizedPath = assetPath.replace(/^v\d+\//, "");
    const extensionIndex = normalizedPath.lastIndexOf(".");

    return extensionIndex === -1
      ? normalizedPath
      : normalizedPath.slice(0, extensionIndex);
  } catch {
    return null;
  }
};

const deleteCloudinaryImages = async (imageUrls = []) => {
  const publicIds = imageUrls
    .map(getCloudinaryPublicIdFromUrl)
    .filter(Boolean);

  if (publicIds.length === 0) return;

  await Promise.allSettled(
    publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
  );
};

const getOwnerHotels = async (userId) => Hotel.find({ owner: userId });

const getOwnerHotelAndRoom = async (userId, roomId) => {
  const roomData = await Room.findById(roomId);

  if (!roomData) {
    return { error: { success: false, message: "Room not found" } };
  }

  const hotelData = await Hotel.findOne({ _id: roomData.hotel, owner: userId });

  if (!hotelData) {
    return { error: { success: false, message: "Forbidden" }, status: 403 };
  }

  return { hotelData, roomData };
};

// API to create a new room for a hotel
// POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities, hotelId } = req.body;

    const ownerHotels = await getOwnerHotels(req.user._id);
    let hotel = null;

    if (hotelId) {
      hotel = ownerHotels.find((item) => item._id.toString() === hotelId);
    } else if (ownerHotels.length === 1) {
      [hotel] = ownerHotels;
    }

    if (!hotel) return res.json({ success: false, message: "No Hotel found" });
    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: "At least one room image is required" });
    }

    // upload images to cloudinary
    const uploadImages = req.files.map(async (file) => {
      const response = await cloudinary.uploader.upload(file.path);
      return response.secure_url;
    });

    // Wait for all uploads to complete
    const images = await Promise.all(uploadImages);

    await Room.create({
      hotel: hotel._id,
      roomType,
      pricePerNight: +pricePerNight,
      amenities: Array.isArray(amenities) ? amenities : JSON.parse(amenities),
      images,
    });

    res.json({ success: true, message: "Room created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all rooms
// GET /api/rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true })
      .populate({
        path: 'hotel',
        populate: {
          path: 'owner', 
          select: 'image',
        },
      }).sort({ createdAt: -1 });

    const validRooms = rooms.filter((room) => room.hotel);
    const orphanRoomIds = rooms.filter((room) => !room.hotel).map((room) => room._id);

    if (orphanRoomIds.length > 0) {
      await Room.deleteMany({ _id: { $in: orphanRoomIds } });
    }

    res.json({ success: true, rooms: validRooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get a single room by ID
// GET /api/rooms/:id
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate({
      path: 'hotel',
      populate: { path: 'owner', select: 'image' },
    });

    if (!room) return res.json({ success: false, message: "Room not found" });

    if (!room.hotel) {
      await Room.findByIdAndDelete(req.params.id);
      return res.json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all rooms for a specific hotel
// GET /api/rooms/owner
export const getOwnerRooms = async (req, res) => {
  try {
    const ownerHotels = await getOwnerHotels(req.user._id);
    const hotelIds = ownerHotels.map((hotel) => hotel._id.toString());

    if (hotelIds.length === 0) {
      return res.json({ success: false, message: "No Hotel found" });
    }

    const rooms = await Room.find({ hotel: { $in: hotelIds } }).populate("hotel").sort({ createdAt: -1 });
    res.json({ success: true, rooms });
  } catch (error) {
    console.log(error);
    
    res.json({ success: false, message: error.message });
  }
};

// API to toggle availability of a room
// POST /api/rooms/toggle-availability
export const toggleRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.body;
    const { error, status, roomData } = await getOwnerHotelAndRoom(req.user._id, roomId);

    if (error) {
      return status
        ? res.status(status).json(error)
        : res.json(error);
    }

    roomData.isAvailable = !roomData.isAvailable;
    await roomData.save();
    res.json({ success: true, message: "Room availability Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to update a room
// PUT /api/rooms/:id
export const updateRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities, existingImages } = req.body;
    const { error, status, roomData } = await getOwnerHotelAndRoom(req.user._id, req.params.id);

    if (error) {
      return status
        ? res.status(status).json(error)
        : res.json(error);
    }

    if (!roomType || !pricePerNight) {
      return res.json({ success: false, message: "Room type and price are required" });
    }

    const parsedAmenities = parseArrayField(amenities);
    const retainedImages = parseArrayField(existingImages);

    const uploadedImages = req.files && req.files.length > 0
      ? await Promise.all(req.files.map(async (file) => {
          const response = await cloudinary.uploader.upload(file.path);
          return response.secure_url;
        }))
      : [];

    const nextImages = [...retainedImages, ...uploadedImages];
    const removedImages = (roomData.images || []).filter((imageUrl) => !retainedImages.includes(imageUrl));

    if (nextImages.length === 0) {
      return res.json({ success: false, message: "At least one room image is required" });
    }

    roomData.roomType = roomType;
    roomData.pricePerNight = +pricePerNight;
    roomData.amenities = parsedAmenities;
    roomData.images = nextImages;

    await roomData.save();
    await deleteCloudinaryImages(removedImages);

    res.json({ success: true, message: "Room updated successfully", room: roomData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to delete a room
// DELETE /api/rooms/:id
export const deleteRoom = async (req, res) => {
  try {
    const { error, status, roomData } = await getOwnerHotelAndRoom(req.user._id, req.params.id);

    if (error) {
      return status
        ? res.status(status).json(error)
        : res.json(error);
    }

    await Booking.deleteMany({ room: roomData._id.toString() });
    await deleteCloudinaryImages(roomData.images || []);
    await Room.findByIdAndDelete(roomData._id);

    res.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};