
import Hotel from "../models/Hotel.js";

// Get User data using Token (JWT)
// GET /api/user/
export const getUserData = async (req, res) => {
  try {
    const ownedHotel = req.user?._id ? await Hotel.findOne({ owner: req.user._id }).select("_id") : null;
    const role = ownedHotel ? "hotelOwner" : req.user?.role || "user";
    const recentSearchedCities = req.user?.recentSearchedCities || [];

    if (ownedHotel && req.user?.role !== "hotelOwner" && req.user?._id) {
      req.user.role = "hotelOwner";
      await req.user.save();
    }

    res.json({ success: true, role, recentSearchedCities });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Store User Recent Searched Cities
// POST /api/user/recent-searched-cities
export const storeRecentSearchedCities = async (req, res) => {
  try {
    const { recentSearchedCity } = req.body;
    const user = await req.user;
    // Store max 3 recent searched cities
    if (user.recentSearchedCities.length < 3) {
      user.recentSearchedCities.push(recentSearchedCity);
    } else {
      user.recentSearchedCities.shift();
      user.recentSearchedCities.push(recentSearchedCity);
    }
    await user.save();
    res.json({ success: true, message: "City added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};