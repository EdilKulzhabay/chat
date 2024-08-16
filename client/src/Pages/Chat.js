import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BackIcon from "../Icons/BackIcon";
import PhoneIcon from "../Icons/PhoneIcon";
import MicroPhoneIcon from "../Icons/MicroPhoneIcon";
import SendIcon from "../Icons/SendIcon";
import api from "../api";
import { io } from "socket.io-client";

const socket = io("http://localhost:5002");
// const socket = io("http://192.168.0.13:5002");

export default function Chat() {
    const { id } = useParams();
    const navigation = useNavigate();
    const [sendFileButton, setSendFileButton] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({});
    const [receiverData, setReceiverData] = useState({});
    const [page, setPage] = useState(1);
    const messagesEndRef = useRef(null);

    const getInfo = () => {
        api.get("/getMe", {
            headers: { "Content-Type": "application/json" },
        })
            .then(({ data }) => {
                setUserData(data);
            })
            .catch((e) => {
                console.log(e);
            });
    };

    const getReceiverData = () => {
        api.post(
            "/getReceiverData",
            { id },
            {
                headers: { "Content-Type": "application/json" },
            }
        )
            .then(({ data }) => {
                setReceiverData(data);
            })
            .catch((e) => {
                console.log(e);
            });
    };

    const getMessages = () => {
        api.post(
            "/getMessages",
            { type: id, page, receiver: id },
            {
                headers: { "Content-Type": "application/json" },
            }
        )
            .then(({ data }) => {
                if (data.messages.length > 0) {
                    const newMessages =
                        data.messages.length > 0 && data.messages.reverse();
                    setMessages([...messages, ...newMessages]);
                }
            })
            .catch((e) => {
                console.log(e);
            });
    };

    useEffect(() => {
        getInfo();
        if (id !== "group") {
            getReceiverData();
        }
        getMessages();
    }, []);

    useEffect(() => {
        if (userData?.userName) {
            socket.emit("joinRoom", userData._id, userData.userName);
        }
    }, [userData]);

    useEffect(() => {
        const handleMessage = (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        };

        socket.on("message", handleMessage);
        return () => {
            socket.off("message", handleMessage);
        };
    }, []);

    const handleSend = async () => {
        const messageData = {
            content: message,
            sender: userData._id,
            type: id === "group" ? "group" : "private",
            receiver: id === "group" ? null : receiverData._id,
        };

        socket.emit("sendMessage", messageData);
        setMessage("");
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && message.length > 0) {
            event.preventDefault(); // Prevent default space behavior (scrolling)
            handleSend();
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    return (
        <>
            <div className="flex flex-col min-h-screen max-h-screen">
                <div className="flex items-center min-w-full px-3 py-4 border-b border-gray-600">
                    <button
                        className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
                        onClick={() => {
                            navigation(-1);
                        }}
                    >
                        <BackIcon className="w-5 h-5" />
                    </button>
                    <Link
                        to={`/chatData/${receiverData._id}`}
                        className="ml-3 flex items-center gap-x-3"
                    >
                        {id === "group" ? (
                            <div className="w-10 h-10 rounded-full bg-blue-800"></div>
                        ) : (
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <img
                                    className="h-full"
                                    src={`http://localhost:5002/uploads/${receiverData.avatar}`}
                                />
                            </div>
                        )}
                        <div className="">
                            <div>
                                {id === "group"
                                    ? "Общий чат"
                                    : receiverData.userName}
                            </div>
                            <div className="text-xs">Сейчас в сети</div>
                        </div>
                    </Link>
                    <button
                        className="ml-auto flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
                        onClick={() => {}}
                    >
                        <PhoneIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 flex flex-col gap-y-3 pb-2 justify-end overflow-scroll">
                    {messages &&
                        messages.length > 0 &&
                        messages.map((item) => {
                            if (item.type === "group") {
                                return (
                                    <div key={item._id}>
                                        {item.sender._id === userData._id ? (
                                            <div className="flex justify-end items-center gap-x-2">
                                                <div className="py-px px-1 rounded-full text-sm border">
                                                    {item.content}
                                                </div>
                                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                                    <img
                                                        className="h-full"
                                                        src={`http://localhost:5002/uploads/${item.sender.avatar}`}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-x-2">
                                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                                    <img
                                                        className="h-full"
                                                        src={`http://localhost:5002/uploads/${item.sender.avatar}`}
                                                    />
                                                </div>
                                                <div className="py-px px-1 rounded-full text-sm border">
                                                    {item.content}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                <div key={item._id}>
                                    {item.sender === userData._id ? (
                                        <div className="flex justify-end items-center gap-x-2">
                                            <div className="py-px px-1 rounded-full text-sm border">
                                                {item.content}
                                            </div>
                                            <div className="w-7 h-7 rounded-full overflow-hidden">
                                                <img
                                                    className="h-full"
                                                    src={`http://localhost:5002/uploads/${userData.avatar}`}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-x-2">
                                            <div className="w-7 h-7 rounded-full overflow-hidden">
                                                <img
                                                    className="h-full"
                                                    src={`http://localhost:5002/uploads/${receiverData.avatar}`}
                                                />
                                            </div>
                                            <div className="py-px px-1 rounded-full text-sm border">
                                                {item.content}
                                            </div>
                                        </div>
                                    )}
                                </div>;
                            }
                        })}
                    <div ref={messagesEndRef} /> {/* Scroll anchor */}
                </div>
                <div className="flex items-center px-5 py-3 rounded-t-md border-t bg-gray-900 bg-opacity-30">
                    <div className="flex-1">
                        <input
                            className="min-w-full outline-none px-2 py-px rounded-full text-sm"
                            value={message}
                            onChange={(event) => {
                                setMessage(event.target.value);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="ml-3">
                        <button
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-900 bg-opacity-50"
                            onClick={handleSend}
                            disabled={message === ""}
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
