// package imports
import bcrypt from "bcrypt";

// file imports
import { validateRegisterData } from "../utils/validation.js";
import User from "../models/user.js";

class AuthController {
  // register user
  static registerUser = async (req, res) => {
    try {
      // validate register data
      validateRegisterData(req.body);

      // extract fields
      const { username, password } = req.body;

      // hash the password
      const hashed_password = await bcrypt.hash(password, 10);

      // create new mongoose user object
      const user = new User({
        username,
        password: hashed_password,
      });

      // save the user in the mongo db
      const saved_user = await user.save();

      // send back the response
      res.status(200).json({
        message: "User added successfully",
        success: true,
        data: saved_user,
      });
    } catch (error) {
      res.status(400).send(error.message);
    }
  };

  // login user
  static loginUser = async (req, res) => {
    try {
      const { username, password } = req.body;
      // find the user
      const user = await User.findOne({ username });
      if (!user) throw new Error("Invalid Credentials");

      // validate password
      const is_password_valid = await user.validatePassword(password);
      if (!is_password_valid) throw new Error("Invalid Credentials");

      // get the jwt token
      const token = user.getJWT();

      // set token in res cookies
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 36000000),
      });

      // create a new user object
      const user_obj = user.toObject();

      // delete the password field
      delete user_obj.password;

      // send back the response
      res.status(200).json({
        message: "Login Successfully",
        success: true,
        data: user_obj,
      });
    } catch (error) {
      res.status(400).send(error.message);
    }
  };
}

export default AuthController;
