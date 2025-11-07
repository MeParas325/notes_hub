// package imports
import mongoose, { Schema } from "mongoose";

// file imports
import capitalizeFirstLetter from "../utils/capitilize.js";

const pdf_note_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      set: capitalizeFirstLetter,
    },

    uploaded_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tags: {
      type: [String],
      required: true,
      set: (tags) => tags.map(capitalizeFirstLetter),
      validate: {
        validator: (v) => Array.isArray(v) && v.length <= 5,
        message: "You can specify a maximum of 5 tags.",
      },
      default: []
    },

    // Small/Medium PDFs
    pdf_data: Buffer,
    pdf_content_type: { type: String, default: "application/pdf" },
    pdf_size: { type: Number, default: 0 }, // <--- Added field

    // Large PDFs (GridFS reference)
    pdf_file_id: { type: Schema.Types.ObjectId },
    pdf_filename: { type: String },

    likes_count: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    dislikes_count: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    comments: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Comment",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
pdf_note_schema.index({ uploaded_by: 1 });
pdf_note_schema.index({ tags: 1 });

const PDFNote = mongoose.model("PDFNote", pdf_note_schema);
export default PDFNote;
