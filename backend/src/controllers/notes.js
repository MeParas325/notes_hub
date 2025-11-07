import VideoNote from "../models/video_note.js";
import { validatePDFData, validateVideoData } from "../utils/validation.js";
import PDFNote from "../models/pdf_note.js";
import { gfsBucket } from "../config/db/db_connect.js";

import stream from "stream";
import capitalizeFirstLetter from "../utils/capitilize.js";

class NotesController {
  // upload video
  static uploadVideo = async (req, res) => {
    try {
      // validate video data
      validateVideoData(req.body);

      const { title, tags, uploaded_by, video_link } = req.body;

      // create new mongoose video object
      const note = new VideoNote({
        title,
        tags,
        uploaded_by,
        video_link,
      });

      // save the video in the mongo db
      const video = await note.save();

      // send back the response
      res.status(200).json({
        message: "Notes added successfully",
        success: true,
        data: video,
      });
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

  // 📤 Upload PDF
  static uploadPDF = async (req, res) => {
    try {

      // validate PDF data
      validatePDFData(req.body);

      // get the file
      const file = req.file;

      // extract other properties
      const { title, uploaded_by, tags } = req.body;

      const MAX_SIZE = 16 * 1024 * 1024; // 16 MB
      const pdfData = {
        title: capitalizeFirstLetter(title),
        uploaded_by,
        tags: JSON.parse(tags).map(capitalizeFirstLetter),
        pdf_size: file.size,
      };

      // 🧩 CASE 1: Small PDF (<= 16MB) → store as Buffer
      if (file.size <= MAX_SIZE) {
        pdfData.pdf_data = file.buffer;
        pdfData.pdf_content_type = file.mimetype;
      }

      // 🧩 CASE 2: Large PDF (> 16MB) → store in GridFS
      else {
        if (!gfsBucket) {
          throw new Error("GridFS bucket not initialized.");
        }

        const uploadStream = gfsBucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });

        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);

        await new Promise((resolve, reject) => {
          bufferStream
            .pipe(uploadStream)
            .on("error", (err) => reject(err))
            .on("finish", () => {
              pdfData.pdf_file_id = uploadStream.id;
              pdfData.pdf_filename = file.originalname;
              resolve();
            });
        });
      }

      // ✅ Save PDF Note document
      const pdfNote = new PDFNote(pdfData);
      await pdfNote.save();

      res.status(201).json({
        message: "✅ PDF uploaded successfully!",
        pdfNote,
      });
    } catch (err) {
      console.error("Upload Error:", err);
      res.status(500).json({
        message: "❌ Error uploading PDF",
        error: err.message,
      });
    }
  };
}

export default NotesController;
