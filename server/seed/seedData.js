import mongoose from "mongoose";
import dotenv from "dotenv";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`);
    console.log("MongoDB connected");

    // Clear existing data
    await Hotel.deleteMany();
    await Room.deleteMany();

    // Create Hotel
    const hotel = await Hotel.create({
      name: "Urbanza Suites",
      address: "Main Road 123 Street, 23 Colony",
      contact: "+0123456789",
      city: "New York",
      owner: "seed_owner_id"
    });

    // Create Rooms
    const rooms = [
      {
        hotel: hotel._id,
        roomType: "Single Bed",
        pricePerNight: 199,
        amenities: ["Free WiFi", "Room Service"],
        images: [],
        isAvailable: true,
      },
      {
        hotel: hotel._id,
        roomType: "Double Bed",
        pricePerNight: 299,
        amenities: ["Free Breakfast", "Pool Access"],
        images: [],
        isAvailable: true,
      },
      {
        hotel: hotel._id,
        roomType: "Luxury Room",
        pricePerNight: 499,
        amenities: ["Free WiFi", "Mountain View", "Room Service"],
        images: [],
        isAvailable: true,
      },
    ];

    await Room.insertMany(rooms);

    console.log("Seed data inserted successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();

