// package imports
import express from "express";

// file imports
import AuthController from "../controllers/auth.js";

// setup auth router
const auth_router = express.Router();

// routing paths
auth_router.post("/register", AuthController.registerUser);
auth_router.post("/login", AuthController.loginUser);

export default auth_router;