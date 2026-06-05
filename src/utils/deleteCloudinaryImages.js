import cloudinary from "../config/cloudinary.js";

export const deleteUnusedCloudinaryImages = async (
  oldPhotos = [],
  newPhotos = []
) => {
  try {
    const newIds = new Set(
      newPhotos
        .filter((p) => p?.public_id)
        .map((p) => p.public_id)
    );

    const removedPhotos = oldPhotos.filter(
      (p) => !newIds.has(p.public_id)
    );

    if (!removedPhotos.length) return;

    await Promise.all(
      removedPhotos.map((p) =>
        cloudinary.uploader.destroy(p.public_id, {
          invalidate: true,
        })
      )
    );
  } catch (err) {
    // IMPORTANT: don't break update flow
    console.error("Cloudinary cleanup failed:", err.message);
  }
};

export default deleteUnusedCloudinaryImages;

