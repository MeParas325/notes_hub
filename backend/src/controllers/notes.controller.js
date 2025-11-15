import VideoNote from "../models/video_note.js";
import { validatePDFData, validateVideoData } from "../utils/validation.js";
import PDFNote from "../models/pdf_note.js";
import { gfsBucket } from "../config/db/db_connect.js";

import stream from "stream";
import capitalizeFirstLetter from "../utils/capitilize.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

class NotesController {
  // upload video
  static uploadVideo = async (req, res) => {
    // start the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // validate video data
      validateVideoData(req.body);

      const { title, tags, uploaded_by, video_link } = req.body;

      // create new mongoose video object
      const video_note = new VideoNote({
        title,
        tags,
        uploaded_by,
        video_link,
      });

      // check if uploaded by and login user matched or not
      if (uploaded_by != req.user.id) {
        throw new Error("Unauthorized User");
      }

      // save the video in the mongo db
      const video = await video_note.save();

      // if video is not saved
      if (!video) {
        throw new Error("Unable to save notes");
      }

      // get the user
      const user = await User.findById(uploaded_by);

      if (user) {
        user.video_notes.push(video.id);
        await user.save();
      } else {
        throw new Error(`⚠️ User with ID ${uploaded_by} not found.`);
      }

      // commit the transaction
      await session.commitTransaction();

      // send back the response
      res.status(200).json({
        message: "Notes added successfully",
        success: true,
        data: video,
      });
    } catch (err) {
      // abort the transaction
      session.abortTransaction();

      logger.error("Error while uploading video: ", err.message);
      res.status(400).json({
        message: "Unable to upload video for this moment",
        success: false,
      });
    } finally {
      // end the session wheather the transaction compled or failed
      session.endSession();
    }
  };

  // 📤 Upload PDF
  static uploadPDF = async (req, res) => {
    // start the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // validate PDF data
      validatePDFData(req.body);

      // get the file
      const file = req.file;

      // extract other properties
      const { title, uploaded_by, tags } = req.body;

      // check if uploaded by and login user matched or not
      if (uploaded_by != req.user.id) {
        throw new Error("Unauthorized User");
      }

      const MAX_SIZE = 16 * 1024 * 1024; // 16 MB
      const pdfData = new PDFNote({
        title: capitalizeFirstLetter(title),
        uploaded_by,
        tags: JSON.parse(tags).map(capitalizeFirstLetter),
        pdf_size: file.size,
      });

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
      const pdf = await pdfNote.save();

      // get the user
      const user = await User.findById(uploaded_by);

      if (user) {
        user.pdf_notes.push(pdf.id);
        await user.save();
      } else {
        throw new Error(`⚠️ User with ID ${uploaded_by} not found.`);
      }

      // commit the transaction
      await session.commitTransaction();

      // send the response
      res.status(201).json({
        message: "✅ PDF uploaded successfully!",
        success: true,
        data: pdf,
      });
    } catch (err) {
      await session.abortTransaction();
      logger.error("Error while uploading PDF: ", err.message);
      res.status(400).json({
        message: "Unable to upload PDF for this moment",
        success: false,
      });
    } finally {
      // end the session
      session.endSession();
    }
  };

  // download PDF
  static downloadPDF = async (req, res) => {
    try {
      // get the PDF id
      const { id } = req.params;

      // check if pdf exist or not
      const pdf_note = await PDFNote.findById(id);

      // throw error if PDF does not exist
      if (!pdf_note) {
        throw new Error("Requested PDF does not exist");
      }

      // for small size pdf
      if (pdf_note.pdf_data && pdf_note.pdf_data.length > 0) {
        // set the pdf details in the response
        res.set({
          "Content-type": pdf_note.pdf_content_type || "application/pdf",
          "Content-Disposition": `inline: filename="${pdf_note.title}.pdf"`,
        });

        return res.send(pdf_note.pdf_data);
      }

      // for large size pdf
      if (pdf_note.pdf_file_id) {
        // check if gfs bucket is initialized or not
        if (!gfsBucket) {
          return res.status(500).json({
            message: "Internal server error",
            success: false,
          });
        }

        // open the download stream
        const download_stream = gfsBucket.openDownloadStream(
          pdf_note.pdf_file_id
        );

        // set headers before streaming
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${
            pdf_note.pdf_filename || pdf_note.title
          }.pdf"`,
        });

        download_stream.on("error", (err) => {
          console.error("GridFS download error:", err);
          res.status(404).json({ message: "PDF file not found in storage." });
        });

        // Stream file data directly to response
        return download_stream.pipe(res);
      }

      // 4️⃣ Neither buffer nor GridFS → invalid data
      return res.status(404).json({
        message: "❌ PDF data not found in database.",
      });
    } catch (err) {
      logger.error("Error while downloading: ", err.message);
      res.status(400).json({
        message: "Unable to download PDF for this moment",
        success: false,
      });
    }
  };

  // get video notes
  static getVideoNotes = async (req, res) => {
    try {
      // get the filters from the query
      const { username, tags, search, page = 1, limit = 10 } = req.query;

      console.log("Username is: ", username);
      console.log("Username length is: ", username.length);

      // set the filter object
      let filter = {};

      // check if username exist or not
      if (username) {
        // check if user exist with this username
        const user = await User.findOne({ username }, "_id");
        if (user) {
          filter.uploaded_by = user._id;
        } else {
          // send back the response
          return res.status(200).json({
            message: "No results found",
            success: true,
            data: [],
          });
        }
      }

      // check the validity of tags
      const is_tag_array = Array.isArray(tags);
      if (is_tag_array && tags.length > 0) {
        filter.tags = { $in: tags };
      } else if (!is_tag_array && tags) {
        filter.tags = tags;
      }

      // check the validity of search
      if (search) {
        filter.title = {
          $regex: search.trim(),
          $options: "i",
        };
      }

      // pagination maths
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;

      console.log("Above video notes");

      // get video notes
      const video_notes = await VideoNote.find(
        filter,
        "title video_link uploaded_by tags createdAt"
      )
        .populate("uploaded_by", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      console.log("Videos notes are: ", video_notes);

      // send back the response
      return res.status(200).json({
        message: "Videos notes fetched successfully",
        success: true,
        current_page: pageNumber,
        limit: limitNumber,
        total_items: video_notes.length,
        total_pages: Math.ceil(total_count / limitNumber),
        data: video_notes,
      });
    } catch (err) {
      logger.error("Error while fetching video notes: ", err.message);
      res.status(400).json({
        message: "Error while fetching videos",
        success: false,
      });
    }
  };

  // get pdf notes
  static getPDFNotes = async (req, res) => {
    try {
      // get the filters from the query
      const { username, tags, search, page = 1, limit = 10 } = req.query;

      // set filters
      let filter = {};

      // filter by username
      if (username) {
        const user = await User.findOne({ username }, "_id");
        if (user) {
          filter.uploaded_by = user._id;
        } else {
          return res.status(200).json({
            message: "No results found",
            success: true,
            data: [],
          });
        }
      }

      // filter by tags
      const is_tag_array = Array.isArray(tags);
      if (is_tag_array && tags.length > 0) {
        filter.tags = { $in: tags };
      } else if (!is_tag_array && tags) {
        filter.tags = tags;
      }

      // filter by search
      if (search) {
        filter.title = {
          $regex: search.trim(),
          $options: "i",
        };
      }

      // pagination
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;

      // get pdf notes
      const pdf_notes = await PDFNote.find(
        filter,
        "title uploaded_by tags createdAt"
      )
        .populate("uploaded_by", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

      // send response
      res.status(200).json({
        message: "PDF notes fetched successfully",
        success: true,
        current_page: pageNumber,
        limit: limitNumber,
        total_items: pdf_notes.length,
        total_pages: Math.ceil(total_count / limitNumber),
        data: pdf_notes,
      });
    } catch (err) {
      logger.error("Error while fetching PDF notes: ", err.message);
      res.status(400).json({
        message: "Error while fetching PDF notes",
        success: false,
      });
    }
  };
}

export default NotesController;
