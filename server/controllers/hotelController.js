// import Hotel from "../models/Hotel.js";
// import User from "../models/User.js";

// // API to create a new hotel
// // POST /api/hotels
// export const registerHotel = async (req, res) => {
//   try {

//     const { name, address, contact, city } = req.body;
//     // const owner = req.user._id;
//     await Hotel.create({ name, address, contact, city });

//     // Check if User Already Registered
//     const hotel = await Hotel.findOne({ owner });
//     if (hotel) {
//       console.log("Incoming data:", req.body);
//       return res.json({ success: false, message: "Hotel Already Registered" });
//     }

//     await Hotel.create({ name, address, contact, city, owner });

//     // Update User Role
//     await User.findByIdAndUpdate(owner, { role: "hotelOwner" });

//     res.json({ success: true, message: "Hotel Registered Successfully" });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };


import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
  try {
    const { name, address, contact, owner, city } = req.body;

    // 1️⃣ Validate required fields
    if (!owner) {
      return res.json({ success: false, message: "Owner field is required" });
    }

    // 2️⃣ Check if user already registered a hotel
    const existingHotel = await Hotel.findOne({ owner });
    if (existingHotel) {
      console.log("Existing hotel found for owner:", owner);
      return res.json({ success: false, message: "Hotel Already Registered" });
    }

    // 3️⃣ Create the new hotel
    const newHotel = await Hotel.create({ name, address, contact, owner, city });

    // 4️⃣ Optionally update user role
    await User.findByIdAndUpdate(owner, { role: "hotelOwner" }).catch(() => {});

    // 5️⃣ Respond success
    res.json({ success: true, message: "Hotel Registered Successfully", hotel: newHotel });
  } catch (error) {
    console.error("Register Hotel Error:", error);
    res.json({ success: false, message: error.message });
  }
};
