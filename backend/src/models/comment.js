import mongoose, { Schema } from "mongoose";

const comment_schema = new mongoose.Schema({
    comment_by: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    comment_on: {
        type: Schema.Types.ObjectId,
        ref: "Note",
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const Comment = mongoose.model("Comment", comment_schema);