import cloudinary from "../config/cloudinary.js";
import videoModel from "../models/video.models.js";
import channelModel from "../models/channel.models.js";
import mongoose from "mongoose";

const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const fileWithExtention = parts[parts.length - 1];
  const [publicId] = fileWithExtention.split(".");
  return publicId;
};

export const uploadVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No Video Uploaded" });
  }

  const allowedMimeTypes = [
    "video/mp4",
    "video/quicktime",
    "video/x-m4v",
    "video/webm",
  ];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res
      .status(400)
      .json({ message: "Invalid file type. Only mp4, mov, webm are allowed." });
  }

  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const uploader = req.user._id;
  const channelId = req.user.channel;

  let tags = [];
  if (req.body.tags) {
    if (Array.isArray(req.body.tags)) {
      // if frontend sends ["dogs", "green"]
      tags = req.body.tags.slice(0, 2).map((t) => t.trim());
    } else if (typeof req.body.tags === "string") {
      // if frontend sends "dogs,green"
      tags = req.body.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 2);
    }
  }

  if (!uploader) {
    return res.status(400).json({ message: "No authorized user" });
  }

  if (!channelId) {
    return res.status(400).json({ message: "No channel found" });
  }

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Title and description are required" });
  }

  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "videos",
        eager: [
          {
            width: 300,
            height: 200,
            crop: "thumb",
            start_offset: "3",
            format: "jpg",
          },
        ],
        eager_async: false,
      },
      async (error, result) => {
        if (error) {
          return res
            .status(500)
            .json({ message: error.message || "Cloudinary Upload Failed" });
        }

        const videoUrl = result.secure_url;
        const thumbnailUrl = result.eager?.[0]?.secure_url || "";

        const video = await videoModel.create({
          title,
          description,
          uploader,
          channelId,
          videoUrl,
          thumbnailUrl,
          duration: result.duration?.toString() || "",
          tags,
        });

        await channelModel.findByIdAndUpdate(
          channelId,
          { $push: { videos: video._id } },
          { new: true }
        );

        return res.status(201).json({ video });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Uplaod Failed!!", error: error.message });
  }
};

export const getAllVideos = async (req, res) => {
  try {
    const videos = await videoModel
      .find()
      .sort({ createdAt: -1 })
      .populate("channelId", "channelName channelAvatar");

    return res.status(200).json(videos);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "unable to fetch videos", error: error.message });
  }
};

export const getCurrentVideo = async (req, res) => {
  const videoId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID format" });
  }

  try {
    const currentVideo = await videoModel.findById(videoId);
    if (!currentVideo) {
      return res.status(404).json({ message: "Unable to find the video" });
    }

    return res.status(200).json(currentVideo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to fetch video", error: error.message });
  }
};

export const deleteVideo = async (req, res) => {
  const videoId = req.params.id;
  try {
    const video = await videoModel.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const videoPublicId = getPublicIdFromUrl(video.videoUrl);
    const thumbnailPublicId = getPublicIdFromUrl(video.thumbnailUrl);

    await cloudinary.uploader.destroy(videoPublicId, {
      resource_type: "video",
    });
    await cloudinary.uploader.destroy(thumbnailPublicId, {
      resource_type: "image",
    });

    if (video.channelId) {
      await channelModel.findByIdAndUpdate(video.channelId, {
        $pull: { videos: video._id },
      });
    }

    await videoModel.findByIdAndDelete(videoId);

    return res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to delete the video", error: error.message });
  }
};

export const getTopTags = async (req, res) => {
  try {
    const tags = await videoModel.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, tag: "$_id" } }, // keep only tag name
    ]);

    // flatten into array of strings
    const formattedTags = tags.map((t) => t.tag);

    res.status(200).json({ tags: formattedTags });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch top tags", error: error.message });
  }
};

export const getVideosByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const videos = await videoModel
      .find({ tags: tag })
      .populate("channelId", "name avatar") // fetch channel name + avatar
      .select("title thumbnailUrl createdAt channelId views duration");

    const formattedVideos = videos.map((video) => ({
      _id: video._id,
      title: video.title,
      thumbnail: video.thumbnailUrl,
      timestamp: video.createdAt,
      duration: video.duration,
      channel: {
        name: video.channelId?.name,
        avatar: video.channelId?.avatar,
      },
      views: video.views.length,
    }));

    res.status(200).json(formattedVideos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch videos by tag", error: error.message });
  }
};
