import commentModel from "../models/comment.models.js";

export const addComment = async (req, res) => {
  const { videoId } = req.query;
  const user = req.user;
  const text = req.body?.text?.trim();
  if (!videoId) {
    return res.status(400).json({ message: "Invalid video ID" });
  }
  if (!user) {
    return res.status(400).json({ message: "Unauthorized!! login required" });
  }
  if (!text) {
    return res.status(400).json({ message: "Text field is required" });
  }

  try {
    const newComment = await commentModel.create({
      videoId,
      user: user._id,
      text,
    });
    // const populatedComment = await newComment.populate("user", "username");
    const populatedComment = await newComment.populate({
      path: "user",
      select: "username channel",
      populate: {
        path: "channel",
        select: "channelAvatar channelName",
      },
    });
    return res.status(201).json({ newComment: populatedComment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to add the comment", error: error.message });
  }
};

export const getAllComments = async (req, res) => {
  const { videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ message: "Video ID not found" });
  }

  try {
    const comments = await commentModel
      .find({ videoId })
      .populate({
        path: "user",
        select: "username channel",
        populate: {
          path: "channel",
          select: "channelAvatar channelName",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ comments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to fetch the comments", error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Invalid Comment ID" });
  }
  try {
    const deleted = await commentModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Unable to find the comment" });
    }

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to delete the comment", error: error.message });
  }
};

export const editComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  // Validate params and body
  if (!id) {
    return res.status(400).json({ message: "Comment ID is required" });
  }
  if (!text || text.trim() === "") {
    return res.status(400).json({ message: "Text field is required" });
  }

  try {
    const comment = await commentModel.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check ownership
    if (comment.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this comment" });
    }

    // Update entire comment text (PUT replaces the resource)
    comment.text = text.trim();

    await comment.save();
    // await comment.populate("user", "username");
    await comment.populate({
      path: "user",
      select: "username channel",
      populate: {
        path: "channel",
        select: "channelAvatar channelName",
      },
    });

    return res.status(200).json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update the comment",
      error: error.message,
    });
  }
};
