import express from "express";
import { protect } from "../middlewares/user.middlewares.js";
import {
  createChannel,
  getCurrentChannel,
} from "../controllers/channel.controllers.js";
import { imageUpload } from "../middlewares/upload.js";

const channelRoutes = express.Router();

channelRoutes.get("/", protect, getCurrentChannel);
channelRoutes.post("/create", protect, imageUpload, createChannel);

export default channelRoutes;
