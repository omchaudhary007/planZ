import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import multer from "multer";
import sharp from "sharp";
import { v2 as cloudinary } from 'cloudinary';

import cookieParser from "cookie-parser";

import credentials from "./middleware/credentials.js";
import corsOptions from "./config/corsOptions.js";

import committeeRoutes from "./routes/committeeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import { createEvent, uploadPhotos } from "./controllers/eventController.js";
import { uploadReport } from "./controllers/eventController.js";
import { checkRole } from "./middleware/authMiddleware.js";
import { eventValidationRules } from "./middleware/validationMiddleware.js";
import verifyType from "./utils/verifyType.js";
import multerError from "./middleware/multerError.js";



//middleware
dotenv.config();
const app = express();
app.use(cookieParser());
app.use(credentials);
app.use(cors(corsOptions));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));


// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB size limit
});

// ROUTES WITH FILE UPLOADS
app.post(
  "/event/createEvent",
  checkRole(["convenor", "member"]),
  (req, res, next) => {
    upload.fields([
      { name: "banner", maxCount: 1 },
      { name: "order", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return multerError(err, req, res, next);
      }
      next();
    });
  },
  verifyType([
    {
      name: "banner",
      allowedType: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
    },
    { name: "order", allowedType: ["application/pdf"] },
  ]),
  eventValidationRules,
  createEvent
);
app.post(
  "/event/uploadReport",
  checkRole(["convenor", "member"]),
  (req,res,next)=>{
    upload.single("report")
    (req,res,(err)=>{
      if(err){
        return multerError(err,req,res,next);
      }
      if(!req.file?.report || req.file.report.mimetype!=="application/pdf"){
        return res.status(400).send({
          success:false,
          message:'Report should be in PDF form.'
        });
      }
      next();
    })
  },
  verifyType([{name:'report',allowedType:['application/pdf']}]),
  uploadReport
);
app.post(
  "/event/uploadPhotos",
  checkRole(["convenor", "member"]),
  (req,res,next)=>{
    upload.array("photos")
    (req,res,(err)=>{
      if(err){
        return multerError(err,req,res,next);
      }
      next();
    })
  },
  verifyType([{name:'photos',allowedType: ["image/jpeg", "image/png", "image/jpg", "image/webp"]}]), 
  uploadPhotos
);

// ROUTES
app.use("/committee", committeeRoutes);
app.use("/admin", adminRoutes);
app.use("/events", eventRoutes);
app.use("/user", userRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("*", (req, res) => {
  res.status(404).send({
    success: false,
    message: "Page Not Exists!",
  });
});
// MONGOOSE Setup

const PORT = process.env.PORT || 9000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch((error) => console.log(`${error} did not connect`));
