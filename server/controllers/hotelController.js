import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
  try {
    const { name, address, contact, city } = req.body;

    const owner = req.auth.userId;

    // Check if already registered
    const existingHotel = await Hotel.findOne({ owner });
    if (existingHotel) {
      return res.json({
        success: false,
        message: "Hotel Already Registered"
      });
    }

    // Create hotel (ONLY ONCE)
    const newHotel = await Hotel.create({
      name,
      address,
      contact,
      city,
      owner
    });

    // Update user role (optional)
    await User.findByIdAndUpdate(owner,
      {role: "hotelOwner"},
      { new: true }
    ).catch(() => {});

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
