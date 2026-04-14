import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import { v2 as cloudinary } from "cloudinary";

// API to create a new room for a hotel
// POST /api/rooms
export const createRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities } = req.body;

    const hotel = await Hotel.findOne({ owner: req.user._id });

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
    res.json({ success: true, rooms });
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
    res.json({ success: true, room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all rooms for a specific hotel
// GET /api/rooms/owner
export const getOwnerRooms = async (req, res) => {
  try {
    const hotelData = await Hotel.findOne({ owner: req.user._id });
    if (!hotelData) {
      return res.json({ success: false, message: "No Hotel found" });
    }
    const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");
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
    const hotelData = await Hotel.findOne({ owner: req.user._id });
    if (!hotelData) {
      return res.json({ success: false, message: "No Hotel found" });
    }
    const roomData = await Room.findById(roomId);
    if (!roomData) {
      return res.json({ success: false, message: "Room not found" });
    }
    if (roomData.hotel !== hotelData._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    roomData.isAvailable = !roomData.isAvailable;
    await roomData.save();
    res.json({ success: true, message: "Room availability Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};