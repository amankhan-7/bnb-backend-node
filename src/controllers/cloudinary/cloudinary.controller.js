import cloudinary from "../../config/cloudinary.js";

export const testCloudinary = async (req, res) => {
  try {
    const usage = await cloudinary.api.usage();

    res.json({
      success: true,
      credits: usage.credits,
      storage: usage.storage,
      resources: usage.resources,
      bandwidth: usage.bandwidth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const testDeleteCloudinaryImage = async (req, res) => {
  try {
    const { public_id } = req.query;

    const result = await cloudinary.uploader.destroy(public_id,   { invalidate: true });

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};