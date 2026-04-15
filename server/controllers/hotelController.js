import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import connectCloudinary from "../configs/cloudinary.js";

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

export const registerHotel = async (req, res) => {
  try {
    await connectCloudinary();
    const { name, address, contact, city } = req.body;
    // Always use req.user._id to guarantee user exists
    const owner = req.user._id;

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        cloudinary.uploader.upload(file.path, { folder: "hotels" })
      );
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map(result => result.secure_url);
    }

    // Create hotel (ONLY ONCE)
    const newHotel = await Hotel.create({
      name,
      address,
      contact,
      city,
      owner,
      images: imageUrls
    });

    // Update user role (optional)
    try {
      await User.findByIdAndUpdate(owner,
        { role: "hotelOwner" },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      if (req.user) req.user.role = "hotelOwner";
    } catch (err) {
      console.error('[registerHotel] Error updating user role:', err);
    }

    res.json({
      success: true,
      message: "Hotel Registered Successfully",
      hotel: newHotel
    });

  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message
    });
  }
};


export const getOwnerHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      hotels,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};


export const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find();

    res.json({
      success: true,
      hotels
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

export const deleteOwnerHotel = async (req, res) => {
  try {
    await connectCloudinary();

    const hotel = await Hotel.findOne({ _id: req.params.id, owner: req.user._id });

    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }

    const rooms = await Room.find({ hotel: hotel._id.toString() });
    const roomIds = rooms.map((room) => room._id.toString());
    const hotelImages = hotel.images || [];
    const roomImages = rooms.flatMap((room) => room.images || []);

    await Booking.deleteMany({
      $or: [
        { hotel: hotel._id.toString() },
        { room: { $in: roomIds } }
      ]
    });
    await Room.deleteMany({ hotel: hotel._id.toString() });
    await Hotel.findByIdAndDelete(hotel._id);

    const remainingHotels = await Hotel.countDocuments({ owner: req.user._id });
    if (remainingHotels === 0) {
      await User.findByIdAndUpdate(req.user._id, { role: "user" });

      if (req.user) {
        req.user.role = "user";
      }
    }

    await deleteCloudinaryImages([...hotelImages, ...roomImages]);

    res.json({ success: true, message: "Hotel deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
