import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import { v4 as uuidV4 } from "uuid";
import "dotenv/config";

import { MessageController, UserController } from "./Controllers/index.js";
import checkAuth from "./utils/checkAuth.js";
import Message from "./Models/Message.js";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        // origin: "http://192.168.0.13:3000", // Замените на реальный домен клиента
        origin: "http://localhost:3000",
        credentials: true,
    })
);

app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

mongoose
    .connect(process.env.MONGOURL)
    .then(() => {
        console.log("Mongodb OK");
    })
    .catch((err) => {
        console.log("Mongodb Error", err);
    });

const server = http.createServer(app);
global.io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    socket.on("sendMessage", async (message) => {
        const newMessage = new Message(message);
        await newMessage.save();
        const str = message.receiver + message.sender;
        const room = str.split("").sort().join("");
        console.log(
            "user ",
            message.sender,
            " form room ",
            room,
            " send message"
        );

        if (message.type === "group") {
            io.emit("message", newMessage);
        } else {
            socket.to(room).emit("message", newMessage);
        }
    });

    socket.on("joinRoom", (room, userName) => {
        socket.join(room);
        console.log("user ", userName, " joined room ", room);
    });

    socket.on("offer", (offer) => {
        socket.broadcast.emit("offer", offer);
    });

    socket.on("answer", (answer) => {
        socket.broadcast.emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate) => {
        console.log("candidate", candidate);
        if (candidate) {
            socket.broadcast.emit("ice-candidate", candidate);
        }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

///////USER
app.get("/getMe", checkAuth, UserController.getMe);
app.get("/getUsers", checkAuth, UserController.getUsers);
app.post("/register", UserController.register);
app.post("/login", UserController.login);
app.post("/upload", upload.single("image"), checkAuth, UserController.upload);
app.post("/refresh", UserController.refresh);
app.post("/logOut", UserController.logOut);

///////MESSAGE
app.get("/getChats", checkAuth, MessageController.getChats);
app.post("/getMessages", checkAuth, MessageController.getMessages);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
