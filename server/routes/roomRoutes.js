import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { createRoom, getRooms, getRoomById, toggleRoomAvailability, getOwnerRooms, } from "../controllers/roomController.js";

const roomRouter = express.Router();

roomRouter.post("/", protect, upload.array("images", 5), createRoom);
roomRouter.get("/", getRooms);
roomRouter.get("/owner", protect, getOwnerRooms);
roomRouter.get("/:id", getRoomById);
roomRouter.post("/toggle-availability", protect, toggleRoomAvailability);

export default roomRouter;
