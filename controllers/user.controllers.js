import userModel from "../models/user.models.js";
import { generateToken } from "../utils/generateToken.js";
import bcrypt from "bcrypt";

export const getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(200).json({ user: null });
  }

  return res.status(200).json({ user: req.user });
};

export const loginUser = async (req, res) => {
  const email = req.body?.email.trim().toLowerCase();
  const password = req.body?.password.trim();

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "email and password both required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found!!" });
    }
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      channel: user.channel,
      isChannelCreated: user.isChannelCreated,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Login failed!!", error: error.message });
  }
};

export const registerUser = async (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.",
    });
  }

  try {
    const existing = await userModel.findOne({ email });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingUsername = await userModel.findOne({ username });

    if (existingUsername) {
      return res
        .status(400)
        .json({ message: "Username already exists!! try something else" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });
    const token = generateToken(newUser._id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      channel: newUser.channel,
      isChannelCreated: newUser.isChannelCreated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed!! ", error: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({ message: "Logout successful" });
};
