import express from "express";
import { testCloudinary, testDeleteCloudinaryImage } from "../../controllers/cloudinary/cloudinary.controller.js";

const router = express.Router();

router.get("/test", testCloudinary);
router.delete("/delete", testDeleteCloudinaryImage);

export default router;