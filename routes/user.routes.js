import express from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controllers.js";
import { protect } from "../middlewares/user.middlewares.js";

const userRoutes = express.Router();

userRoutes.get("/", protect, getCurrentUser);
userRoutes.post("/login", loginUser);
userRoutes.post("/register", registerUser);
userRoutes.post("/logout", logoutUser);

export default userRoutes;
