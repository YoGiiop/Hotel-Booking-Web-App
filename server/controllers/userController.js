
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

// Get User data using Token (JWT)
// GET /api/user/
export const getUserData = async (req, res) => {
  try {
    const ownedHotelsCount = req.user?._id ? await Hotel.countDocuments({ owner: req.user._id }) : 0;
    const isOwner = ownedHotelsCount > 0;
    const role = isOwner ? "hotelOwner" : "user";
    const recentSearchedCities = req.user?.recentSearchedCities || [];

    if (isOwner && req.user?.role !== "hotelOwner" && req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { role: "hotelOwner" });
    } else if (!isOwner && req.user?.role === "hotelOwner" && req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { role: "user" });
    }

    res.set("Cache-Control", "no-store");
    res.json({ success: true, role, isOwner, ownedHotelsCount, recentSearchedCities });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Store User Recent Searched Cities
// POST /api/user/recent-searched-cities
export const storeRecentSearchedCities = async (req, res) => {
  try {
    const { recentSearchedCity } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
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
