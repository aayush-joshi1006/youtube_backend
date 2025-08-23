import express from "express";
import { protect } from "../middlewares/user.middlewares.js";
import {
  getAllVideos,
  uploadVideo,
  getCurrentVideo,
  deleteVideo,
  getTopTags,
  getVideosByTag,
  editVideo,
} from "../controllers/video.controllers.js";
import { videoUpload } from "../middlewares/upload.js";

const videoRouter = express.Router();

videoRouter.get("/", getAllVideos);
videoRouter.get("/:id", getCurrentVideo);
videoRouter.post("/upload", protect, videoUpload, uploadVideo);
videoRouter.delete("/delete/:id", protect, deleteVideo);
videoRouter.get("/tags/top", getTopTags);
videoRouter.get("/tags/:tag", getVideosByTag);
videoRouter.put("/:id",protect,editVideo)

export default videoRouter;
