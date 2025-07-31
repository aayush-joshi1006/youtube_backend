import dotenv from "dotenv";
import connectDB from "./config/db.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";

dotenv.config();
connectDB();

const app = express();

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/channel", channelRoutes);
app.use("/api/video", videoRouter);
app.use("/api/comment", commentRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
