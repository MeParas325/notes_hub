// package imports
import mongoose, { Schema } from "mongoose";

// file imports
import capitalizeFirstLetter from "../utils/capitilize.js";

const video_note_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      set: capitalizeFirstLetter
    },

    uploaded_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

   tags: {
     type: [String],
     required: true,
     set: (tags) => tags.map(capitalizeFirstLetter),
     validate: {
       validator: (v) => Array.isArray(v) && v.length <= 5,
       message: 'You can specify a maximum of 5 tags.'
     },
     default: []
    },

    video_link: {
        type: String,
        required: true,
        trim: true
    },

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

const VideoNote = mongoose.model("VideoNote", video_note_schema);
export default VideoNote;
