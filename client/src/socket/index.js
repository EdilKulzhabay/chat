import { io } from "socket.io-client";

const options = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"],
};

const socket = io(process.env.REACT_APP_PORT, options);
//const socket = io("http://localhost:3001", options);

export default socket;
