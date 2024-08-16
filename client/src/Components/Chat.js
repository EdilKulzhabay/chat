import React, { useState, useEffect } from "react";
import io from "socket.io-client";

//const socket = io("http://localhost:5002");
// const socket = io("http://192.168.0.13:5002");

const Chat = (props) => {
    // const [messages, setMessages] = useState([]);
    // const [message, setMessage] = useState("");
    // const [room, setRoom] = useState("global"); // По умолчанию общий чат
    // const userId = props.userName; // Замените на реальное имя пользователя

    // useEffect(() => {
    //     socket.on("message", (newMessage) => {
    //         setMessages((prevMessages) => [...prevMessages, newMessage]);
    //     });

    //     socket.on("messageRead", ({ messageId, userId }) => {
    //         setMessages((prevMessages) =>
    //             prevMessages.map((msg) =>
    //                 msg._id === messageId
    //                     ? { ...msg, readBy: [...msg.readBy, userId] }
    //                     : msg
    //             )
    //         );
    //     });

    //     return () => {
    //         socket.off("message");
    //         socket.off("messageRead");
    //     };
    // }, []);

    // useEffect(() => {
    //     if (room !== "global") {
    //         socket.emit("readMessage", { messageId: "message-id", userId }); // Замените 'message-id' на реальный ID сообщения
    //     }
    // }, [room]);

    // const handleSend = async () => {
    //     const messageData = {
    //         content: message,
    //         sender: userId,
    //         type: room === "global" ? "group" : "private",
    //         receiver: room !== "global" ? room : null,
    //     };

    //     socket.emit("sendMessage", messageData);
    //     setMessage("");
    // };

    return (
        <></>
        // <div>
        //     <h2>Chat</h2>
        //     <div>
        //         <select onChange={(e) => setRoom(e.target.value)} value={room}>
        //             <option value="global">Global Chat</option>
        //             <option value="user1">Chat with User1</option>
        //             <option value="user2">Chat with User2</option>
        //         </select>
        //     </div>
        //     <div>
        //         {messages.map((msg, index) => (
        //             <div key={index}>
        //                 <strong>{msg.sender}: </strong>
        //                 {msg.content}
        //                 {msg.readBy.includes(userId) ? " (Read)" : " (Unread)"}
        //             </div>
        //         ))}
        //     </div>
        //     <input
        //         type="text"
        //         value={message}
        //         onChange={(e) => setMessage(e.target.value)}
        //     />
        //     <button onClick={handleSend}>Send</button>
        // </div>
    );
};

export default Chat;
