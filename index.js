import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import ACTIONS from "./client/src/socket/actions.js";
import { validate, version } from "uuid";
import "dotenv/config";

import { MessageController, UserController } from "./Controllers/index.js";
import checkAuth from "./utils/checkAuth.js";
import Message from "./Models/Message.js";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        origin: "*",
        // origin: "https://voca.kz",
        // origin: "http://localhost:3000",
        // origin: "http://192.168.0.10:3000",
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

function getClientRooms() {
    const { rooms } = io.sockets.adapter;

    return Array.from(rooms.keys()).filter(
        (roomID) => validate(roomID) && version(roomID) === 4
    );
}

function shareRoomsInfo() {
    io.emit(ACTIONS.SHARE_ROOMS, {
        rooms: getClientRooms(),
    });
}

io.on("connection", (socket) => {
    socket.on("joinRoom", (room, userName) => {
        socket.join(room);
        console.log("user ", userName, " joined room ", room);
    });

    socket.on("sendMessage", async (message) => {
        const newMessage = new Message(message);
        await newMessage.save();

        if (message.type === "group") {
            const populatedMessage = await Message.findById(
                newMessage._id
            ).populate("sender");
            io.emit("message", populatedMessage);
            socket.broadcast.emit("updateMessages");
        } else {
            socket.nsp
                .to(message.sender)
                .to(message.receiver)
                .emit("message", newMessage);
            socket.to(message.receiver).emit("updateMessages");
        }
    });

    socket.on("startPrivateCall", (data) => {
        const recId = data.recId;
        const link = data.link;
        const caller = data.caller;
        socket.to(recId).emit("privateCalling", {
            link: link,
            caller: caller,
            receiver: recId,
        });
    });

    socket.on("tookTheCall", (data) => {
        socket.to(data.callerId).emit("tookTheCallAnswer");
    });

    socket.on("endCall", (data) => {
        console.log("companion", data.companion);
        socket.to(data.companion).emit("endingCall");
    });

    socket.on("getDataGroup", (callback) => {
        const roomSize = io.sockets.adapter.rooms.get("group")?.size || 0;
        callback(roomSize);
    });

    socket.on("startGroupCall", (data) => {
        const recName = data.recName;
        const roomSize = io.sockets.adapter.rooms.get("group")?.size || 0;
        io.to("group").emit("groupAction", {
            message: `${recName} присоеденился к звонку`,
            users: roomSize + 1,
        });
    });

    socket.on("leaveGroupCall", (data) => {
        const recName = data.userName;
        const roomSize = io.sockets.adapter.rooms.get("group")?.size || 0;
        io.to("group").emit("groupAction", {
            message: `${recName} вышел со звонка`,
            users: roomSize - 1,
        });
    });

    shareRoomsInfo();

    socket.on(ACTIONS.JOIN, (config) => {
        const { room: roomID } = config;
        const { rooms: joinedRooms } = socket;

        if (Array.from(joinedRooms).includes(roomID)) {
            return console.warn(`Already joined to ${roomID}`);
        }

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        clients.forEach((clientID) => {
            io.to(clientID).emit(ACTIONS.ADD_PEER, {
                peerID: socket.id,
                createOffer: false,
            });

            socket.emit(ACTIONS.ADD_PEER, {
                peerID: clientID,
                createOffer: true,
            });
        });

        socket.join(roomID);
        shareRoomsInfo();
    });

    function leaveRoom() {
        const { rooms } = socket;

        Array.from(rooms)
            // LEAVE ONLY CLIENT CREATED ROOM
            .filter((roomID) => validate(roomID) && version(roomID) === 4)
            .forEach((roomID) => {
                const clients = Array.from(
                    io.sockets.adapter.rooms.get(roomID) || []
                );

                clients.forEach((clientID) => {
                    io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
                        peerID: socket.id,
                    });

                    socket.emit(ACTIONS.REMOVE_PEER, {
                        peerID: clientID,
                    });
                });

                socket.leave(roomID);
            });

        shareRoomsInfo();
    }

    socket.on(ACTIONS.LEAVE, leaveRoom);
    socket.on("disconnecting", leaveRoom);

    socket.on(ACTIONS.RELAY_SDP, ({ peerID, sessionDescription }) => {
        io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
            peerID: socket.id,
            sessionDescription,
        });
    });

    socket.on(ACTIONS.RELAY_ICE, ({ peerID, iceCandidate }) => {
        io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
            peerID: socket.id,
            iceCandidate,
        });
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

///////USER
app.get("/getMe", checkAuth, UserController.getMe);
app.get("/getUsers", checkAuth, UserController.getUsers);
app.post("/getReceiverData", UserController.getReceiverData);
app.post("/register", UserController.register);
app.post("/login", UserController.login);
app.post("/upload", upload.single("image"), checkAuth, UserController.upload);
app.post("/refresh", UserController.refresh);
app.post("/logOut", UserController.logOut);

///////MESSAGE
app.get("/getChats", checkAuth, MessageController.getChats);
app.post("/getMessages", checkAuth, MessageController.getMessages);

app.get("/edil", async (req, res) => {
    res.json({ Name: "edil" });
});

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
