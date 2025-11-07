import mongoose, { Schema } from "mongoose";

const like_schema = new mongoose.Schema({
    like_by: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    like_on: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    }
}, {
    timestamps: true
})

const Like = mongoose.model("Like", like_schema);
export default Like;