import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getOwnerDebugData, getUserData, storeRecentSearchedCities } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", protect, getUserData);
userRouter.get("/debug-owner", protect, getOwnerDebugData);
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);

export default userRouter;
