import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js";

// helper function for cloudinary uploads
const uploadToCloudinary = async (file) => {
    try {
        if (!file || !file.tempFilePath) {
            throw new Error("Invalid file provided");
        }

        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto",
            timeout: 120000, // 2 minute timeout
        });

        if (!result || !result.secure_url) {
            throw new Error("Failed to get upload URL from Cloudinary");
        }

        return result.secure_url;
    } catch (error) {
        console.log("Error in uploadToCloudinary", {
            message: error.message,
            name: error.name,
            http_code: error.http_code,
            stack: error.stack
        });
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

export const createSong = async (req, res, next) => {
    try {
        // Log the incoming request
        console.log("Received song creation request:", {
            body: req.body,
            files: req.files ? Object.keys(req.files) : null,
            headers: req.headers['content-type']
        });

        if (!req.files) {
            return res.status(400).json({ message: "No files were uploaded" });
        }

        if (!req.files.audioFile) {
            return res.status(400).json({ message: "Audio file is required" });
        }

        if (!req.files.imageFile) {
            return res.status(400).json({ message: "Image file is required" });
        }

        const { title, artist, albumId, duration } = req.body;
        
        // Log the extracted data
        console.log("Extracted form data:", { title, artist, albumId, duration });

        if (!title || !artist || !duration) {
            return res.status(400).json({ 
                message: "Missing required fields",
                missing: {
                    title: !title,
                    artist: !artist,
                    duration: !duration
                }
            });
        }

        const audioFile = req.files.audioFile;
        const imageFile = req.files.imageFile;

        // Log file details
        console.log("File details:", {
            audio: {
                name: audioFile.name,
                type: audioFile.mimetype,
                size: audioFile.size,
                tempPath: audioFile.tempFilePath
            },
            image: {
                name: imageFile.name,
                type: imageFile.mimetype,
                size: imageFile.size,
                tempPath: imageFile.tempFilePath
            }
        });

        // Validate file types
        if (!audioFile.mimetype.startsWith('audio/')) {
            return res.status(400).json({ message: "Invalid audio file type" });
        }
        if (!imageFile.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: "Invalid image file type" });
        }

        const audioUrl = await uploadToCloudinary(audioFile);
        const imageUrl = await uploadToCloudinary(imageFile);

        const song = new Song({
            title,
            artist,
            audioUrl,
            imageUrl,
            duration: parseInt(duration),
            albumId: albumId || null,
        });

        await song.save();

        // if song belongs to an album, update the album's songs array
        if (albumId) {
            await Album.findByIdAndUpdate(albumId, {
                $push: { songs: song._id },
            });
        }
        res.status(201).json(song);
    } catch (error) {
        console.log("Error in createSong", error);
        res.status(500).json({ 
            message: "Failed to create song", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const deleteSong = async (req, res, next) => {
    try {
        const { id } = req.params;

        const song = await Song.findById(id);

        // if song belongs to an album, update the album's songs array
        if (song.albumId) {
            await Album.findByIdAndUpdate(song.albumId, {
                $pull: { songs: song._id },
            });
        }

        await Song.findByIdAndDelete(id);

        res.status(200).json({ message: "Song deleted successfully" });
    } catch (error) {
        console.log("Error in deleteSong", error);
        next(error);
    }
};

export const createAlbum = async (req, res, next) => {
    try {
        const { title, artist, releaseYear } = req.body;
        const { imageFile } = req.files;

        const imageUrl = await uploadToCloudinary(imageFile);

        const album = new Album({
            title,
            artist,
            imageUrl,
            releaseYear,
        });

        await album.save();

        res.status(201).json(album);
    } catch (error) {
        console.log("Error in createAlbum", error);
        next(error);
    }
};

export const deleteAlbum = async (req, res, next) => {
    try {
        const { id } = req.params;
        await Song.deleteMany({ albumId: id });
        await Album.findByIdAndDelete(id);
        res.status(200).json({ message: "Album deleted successfully" });
    } catch (error) {
        console.log("Error in deleteAlbum", error);
        next(error);
    }
};

export const checkAdmin = async (req, res, next) => {
    res.status(200).json({ admin: true });
};
