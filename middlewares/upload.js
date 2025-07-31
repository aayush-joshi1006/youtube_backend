import multer from "multer";

const storage = multer.memoryStorage(); // Required for Cloudinary stream upload

// Video Upload

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["video/mp4", "video/mov", "video/quicktime"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only MP4/MOV allowed."), false);
  }
};

const videoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
}).single("video");

// Image Upload

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid image file type. Only JPEG/JPG/PNG/WEBP allowed."));
  }
};

const imageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: "channelAvatar", maxCount: 1 },
  { name: "channelBanner", maxCount: 1 },
]);

export { videoUpload, imageUpload };
