import express from "express";
import {createServer} from "http";
import { Server } from "socket.io";

// create an express app
const app = express();

// wrap express app inside a httpserver
const http_server = createServer(app);

// add socket in your http server
const io = new Server(http_server, {
    cors: {
        origin: "*"
    }
})

// listen for incoming connection
io.on("connection", (socket) => {
    socket.on("disconnect", () => {
        console.log("User is disconnected");
    })
})

export {app, http_server, io};