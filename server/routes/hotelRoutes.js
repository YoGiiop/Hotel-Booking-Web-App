import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { deleteOwnerHotel, getHotels, getOwnerHotels, registerHotel } from "../controllers/hotelController.js";
import upload from "../middleware/uploadMiddleware.js";

const hotelRouter = express.Router();

hotelRouter.post("/", protect, upload.array("images", 5), registerHotel); // up to 5 images
hotelRouter.get("/", protect, getHotels);
hotelRouter.get("/owner", protect, getOwnerHotels);
hotelRouter.delete("/:id", protect, deleteOwnerHotel);

export default hotelRouter;
