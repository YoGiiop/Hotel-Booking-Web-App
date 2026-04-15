import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import connectCloudinary from "../configs/cloudinary.js";

export const registerHotel = async (req, res) => {
  try {
    await connectCloudinary();
    const { name, address, contact, city } = req.body;
    // Always use req.user._id to guarantee user exists
    const owner = req.user._id;

    // Check if already registered
    const existingHotel = await Hotel.findOne({ owner });
    if (existingHotel) {
      return res.json({
        success: false,
        message: "Hotel Already Registered"
      });
    }

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
