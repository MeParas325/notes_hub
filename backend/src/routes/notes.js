// package imports
import express from "express";
import multer from "multer";

// file imports
import NotesController from "../controllers/notes.controller.js";

const notes_router = express.Router();

// memory storage (for buffer)
const upload = multer({ storage: multer.memoryStorage() });

// upload routes
notes_router.post("/upload/video",  NotesController.uploadVideo);
notes_router.post("/upload/pdf", upload.single("pdf"),  NotesController.uploadPDF);

// download notes
notes_router.get("/download/pdf/:id", NotesController.downloadPDF);

// get video notes
notes_router.get("/video", NotesController.getVideoNotes);
// get pdf notes
notes_router.get("/pdf", NotesController.getPDFNotes);

export default notes_router;