// package imports
import express from "express";
import { configDotenv } from "dotenv";
import cookieParser from "cookie-parser";

// file imports
import connect_db from "./config/db/db_connect.js";
import { app, http_server } from "./socket/socket.js";
import logger from "./utils/logger.js";
import logger_middleware from "./middlewares/logger.js";
import auth_router from "./routes/auth.js";
import notes_router from "./routes/notes.js";
import userAuth from "./middlewares/auth.js";

// load .env file content to process.env
configDotenv();

const PORT = process.env.PORT || 5000;

// root level middleware
// app.set("trust proxy", true);

// parse the json from the body
app.use(express.json());
// parse cookies
app.use(cookieParser());
// parse form data
app.use(express.urlencoded({extended: true}));

// ✅ apply logger_middleware to all routes except /auth
app.use(logger_middleware);

// ✅ apply userAuth middleware to all routes except /auth
app.use((req, res, next) => {
  if (req.path.startsWith("/auth")) {
    return next(); // skip auth check for /auth routes
  }
  userAuth(req, res, next); // apply for all other routes
});

// routers
app.use("/auth", auth_router);
app.use("/notes", notes_router);

connect_db().then(() => {
    http_server.listen(PORT, () => {
        logger.info(`Server is listening at PORT ${PORT}`);
    })
})
.catch((_) => {
    logger.error("Some error occured while setting up the server or database!!");
})