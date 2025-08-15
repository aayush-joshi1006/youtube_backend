import express from "express";
import { protect } from "../middlewares/user.middlewares.js";
import {
  addComment,
  deleteComment,
  editComment,
  getAllComments,
} from "../controllers/comment.controllers.js";

const commentRoutes = express.Router();

commentRoutes.post("/", protect, addComment);
commentRoutes.get("/", getAllComments); // for getting all comments of a video
commentRoutes.delete("/:id", protect, deleteComment);
commentRoutes.put("/:id", protect, editComment);

export default commentRoutes;
