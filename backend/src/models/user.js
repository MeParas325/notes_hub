import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const user_schema = new mongoose.Schema(
  {
    profile_url: {
      type: String,
      default:
        "https://imgs.search.brave.com/tYAFNNn3NfY1DSm9CFk0mizKFz8iK1bicGd8JW5Q6KA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvNTAwcC8y/NC81OC9kZWZhdWx0/LWF2YXRhci1wcm9m/aWxlLWljb24tdHJh/bnNwYXJlbnQtcG5n/LXZlY3Rvci01Nzgx/MjQ1OC5qcGc",
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    // email: {
    //   type: String,
    //   unique: true,
    //   required: true,
    //   trim: true,
    // },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },

    video_notes: {
      type: [{ type: Schema.Types.ObjectId, ref: "VideoNote" }],
      default: [],
    },
    
    pdf_notes: {
      type: [{ type: Schema.Types.ObjectId, ref: "PDFNote" }],
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

// get JWT
user_schema.methods.getJWT = function () {
  // create a jwt
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return token;
};

// validate password
user_schema.methods.validatePassword = async function (passwordInputByUser) {
  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    this.password
  );
  return isPasswordValid;
};

const User = mongoose.model("User", user_schema);
export default User;
