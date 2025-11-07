import multer from "multer";
import gfsBucket from "../config/gridfs.js";
import PDFNote from "../models/pdfNote.model.js";
import stream from "stream";

// multer memory storage (to get file buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// middleware
export const handlePDFUpload = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const MAX_SIZE = 16 * 1024 * 1024; // 16MB

    if (file.size <= MAX_SIZE) {
      // SMALL FILE: store in buffer
      req.pdfData = {
        pdf_data: file.buffer,
        pdf_content_type: file.mimetype,
      };
      return next();
    }

    // LARGE FILE: store in GridFS
    const uploadStream = gfsBucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    bufferStream.pipe(uploadStream)
      .on("error", (err) => {
        console.error("GridFS upload error:", err);
        res.status(500).json({ message: "Failed to upload large PDF." });
      })
      .on("finish", () => {
        req.pdfData = {
          pdf_file_id: uploadStream.id,
          pdf_filename: file.originalname,
        };
        next();
      });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing file." });
  }
};

export default upload.single("pdf");
