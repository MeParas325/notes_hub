// package imports
import express from "express";
import multer from "multer";

// file imports
import NotesController from "../controllers/notes.js";
import userAuth from "../middlewares/auth.js"

const notes_router = express.Router();

// memory storage (for buffer)
const upload = multer({ storage: multer.memoryStorage() });


// upload routes
notes_router.post("/upload/video", userAuth,  NotesController.uploadVideo);
notes_router.post("/upload/pdf", userAuth, upload.single("pdf"),  NotesController.uploadPDF);

export default notes_router;