
import cloudinary from "../config/cloudinary.js";

const deleteUnusedCloudinaryImages = async (
  oldPhotos = [],
  newPhotos = []
) => {
  const newIds = new Set(
    newPhotos
      .filter((photo) => photo?.public_id)
      .map((photo) => photo.public_id)
  );

  const removedPhotos = oldPhotos.filter(
    (photo) => !newIds.has(photo.public_id)
  );

  if (!removedPhotos.length) return;

  await Promise.all(
    removedPhotos.map((photo) =>
      cloudinary.uploader.destroy(photo.public_id)
    )
  );
};

export default deleteUnusedCloudinaryImages;