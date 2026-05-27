import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function uploadProfilePhoto(
  file: string,
  userId: string
): Promise<string> {
  const result = await cloudinary.uploader.upload(file, {
    folder: "rida/profiles",
    public_id: userId,
    overwrite: true,
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });
  return result.secure_url;
}
