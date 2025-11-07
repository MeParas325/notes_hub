// package imports
import jwt from "jsonwebtoken";

// file imports
import User from "../models/user.js";


const userAuth = async (req, res, next) => {

  try {
    const { token } = req.cookies;

    // if token is not valid
    if(!token) {
      return res.status(401).json({
        msg: "Unauthorized user! Please login",
      })
    }
    
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedObj;

    // find user from the database
    const user = await User.findById(_id);
    if (!user) throw new Error("User not found");

    req.user = user
    next();
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export default userAuth;
