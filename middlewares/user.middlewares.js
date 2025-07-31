import jwt from "jsonwebtoken";
import userModel from "../models/user.models.js";

export const protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Not Authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await userModel.findById(decoded.userId).select("-password");
    next();
  } catch (error) {
    return res.status(500).json({ message: "Not authorized, token failed" });
  }
};
