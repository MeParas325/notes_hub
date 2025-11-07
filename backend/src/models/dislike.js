import mongoose, { mongo } from "mongoose";

const dislike_schema = new mongoose.Schema(
  {
    dislike_by: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    dislike_on: {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
  },
  {
    timestamps: true,
  }
);

const Dislike = mongoose.model("Dislike", dislike_schema);
export default Dislike;
