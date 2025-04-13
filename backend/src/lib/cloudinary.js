import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Ensure all required config is present
const requiredConfig = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingConfig = requiredConfig.filter(key => !process.env[key]);
if (missingConfig.length > 0) {
    throw new Error(`Missing required Cloudinary configuration: ${missingConfig.join(', ')}`);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Test the configuration
cloudinary.config().cloud_name || console.error('Cloudinary configuration is not properly loaded');

export default cloudinary;
