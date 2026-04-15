import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { createRoom, deleteRoom, getOwnerRooms, getRoomById, getRooms, toggleRoomAvailability, updateRoom } from "../controllers/roomController.js";

const roomRouter = express.Router();

roomRouter.post("/", protect, upload.array("images", 5), createRoom);
roomRouter.get("/", getRooms);
roomRouter.get("/owner", protect, getOwnerRooms);
roomRouter.put("/:id", protect, upload.array("images", 5), updateRoom);
roomRouter.delete("/:id", protect, deleteRoom);
roomRouter.get("/:id", getRoomById);
roomRouter.post("/toggle-availability", protect, toggleRoomAvailability);

export default roomRouter;
