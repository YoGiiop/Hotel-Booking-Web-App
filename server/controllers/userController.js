
import Hotel from "../models/Hotel.js";

// Get User data using Token (JWT)
// GET /api/user/
export const getUserData = async (req, res) => {
  try {
    const ownedHotel = req.user?._id ? await Hotel.findOne({ owner: req.user._id }).select("_id") : null;
    const role = ownedHotel ? "hotelOwner" : req.user?.role || "user";
    const recentSearchedCities = req.user?.recentSearchedCities || [];

    console.log("[getUserData] owner resolution", {
      userId: req.user?._id,
      dbUserRole: req.user?.role,
      hasOwnedHotel: Boolean(ownedHotel),
      resolvedRole: role,
      recentSearchedCitiesCount: recentSearchedCities.length,
    });

    if (ownedHotel && req.user?.role !== "hotelOwner" && req.user?._id) {
      req.user.role = "hotelOwner";
      await req.user.save();

      console.log("[getUserData] repaired user role", {
        userId: req.user?._id,
        savedRole: req.user?.role,
      });
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

// Debug owner state for current authenticated user
// GET /api/user/debug-owner
export const getOwnerDebugData = async (req, res) => {
  try {
    const userId = req.user?._id;
    const ownedHotels = userId
      ? await Hotel.find({ owner: userId }).select("_id name city owner createdAt")
      : [];
    const totalHotels = await Hotel.countDocuments();
    const sampleHotels = await Hotel.find().select("_id name city owner createdAt").limit(10).sort({ createdAt: -1 });

    const payload = {
      success: true,
      authUserId: userId,
      dbUser: req.user
        ? {
            _id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
          }
        : null,
      totalHotels,
      ownedHotelsCount: ownedHotels.length,
      ownedHotels,
      sampleHotels,
    };

    console.log("[getOwnerDebugData]", payload);
    res.json(payload);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};