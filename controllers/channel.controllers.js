import channelModel from "../models/channel.models.js";
import userModel from "../models/user.models.js";
import cloudinary from "../config/cloudinary.js";

export const getCurrentChannel = async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "User not authorized" });
  }

  if (!user.isChannelCreated) {
    return res.status(404).json({ message: "No channel found" });
  }
  try {
    const channel = await channelModel.findById(user.channel);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    return res.status(200).json({ channel });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch the channel" });
  }
};

export const createChannel = async (req, res) => {
  const channelName = req.body.channelName.trim();
  const description = req.body.description.trim();
  const user = req.user;

  if (!user) {
    return res.status(400).json({ message: "Not authorized!! Login first" });
  }

  if (!channelName || !description) {
    return res
      .status(400)
      .json({ message: "Channel name and description required!!" });
  }

  try {
    const uniqueChannel = await channelModel.findOne({ channelName });
    if (uniqueChannel) {
      return res.status(400).json({ message: "Channel name already exists" });
    }

    let avatarUrl = "";
    let bannerUrl = "";

    if (req.files?.channelAvatar?.[0]) {
      const avatarResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "channel_avatar" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.files.channelAvatar[0].buffer);
      });

      avatarUrl = avatarResult.secure_url;
    }

    if (req.files?.channelBanner?.[0]) {
      const bannerResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "channel_banner" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.files.channelBanner[0].buffer);
      });
      bannerUrl = bannerResult.secure_url;
    }

    const channel = await channelModel.create({
      channelName,
      owner: user._id,
      description,
      channelBanner: bannerUrl,
      channelAvatar: avatarUrl,
    });

    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        isChannelCreated: true,
        channel: channel._id,
      },
      { new: true }
    );

    return res.status(201).json({ channel });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to create channel", error: error.message });
  }
};
