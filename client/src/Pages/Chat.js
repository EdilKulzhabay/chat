import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackIcon from "../Icons/BackIcon";
import PhoneIcon from "../Icons/PhoneIcon";
import SendIcon from "../Icons/SendIcon";
import api from "../api";
import socket from "../socket";
import { v4 } from "uuid";
import CallComponent from "../Components/CallComponent";

export default function Chat() {
    const { id } = useParams();
    const navigation = useNavigate();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({});
    const [receiverData, setReceiverData] = useState({});
    const [page, setPage] = useState(1);
    const [needScroll, setNeedScroll] = useState(true);
    const textareaRef = useRef(null);
    const chatRef = useRef(null);

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
                    setMessages([...newMessages.reverse(), ...messages]);
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
            if (id === "group" && newMessage.type === "group") {
                setMessages((prevMessages) => [newMessage, ...prevMessages]);
            } else if (
                newMessage.type === "private" &&
                (id === newMessage.receiver || id === newMessage.sender)
            ) {
                setMessages((prevMessages) => [newMessage, ...prevMessages]);
            }
        };

        socket.on("message", handleMessage);
        return () => {
            socket.off("message", handleMessage);
        };
    }, []);

    const headerRef = useRef(null);

    useEffect(() => {
        if (needScroll && messages.length > 0) {
            setNeedScroll(false);
        }
    }, [messages]);

    const startCall = () => {
        const recId = receiverData._id;
        const link = `/call/${v4()}`;
        socket.emit("startPrivateCall", {
            recId: recId,
            link: link,
            caller: userData,
        });

        navigation(link, { state: { isAnswer: false, companion: recId } });
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        textarea.style.height = "auto"; // Reset the height to auto
        const maxHeight = 4 * 24;
        const newHeight =
            textarea.scrollHeight > maxHeight
                ? maxHeight
                : textarea.scrollHeight;
        textarea.style.height = `${newHeight}px`;
    }, [message]);

    const handleSend = async (e) => {
        e.preventDefault();
        textareaRef.current.focus();
        const messageData = {
            content: message,
            sender: userData._id,
            type: id === "group" ? "group" : "private",
            receiver: id === "group" ? null : receiverData._id,
        };
        setMessage("");

        socket.emit("sendMessage", messageData);
    };

    return (
        <>
            <CallComponent />
            <div className="h-[100dvh]">
                <div
                    ref={headerRef}
                    className="header fixed top-0 w-full bg-white z-10 flex items-center min-w-full px-3 py-4 border-b border-gray-600"
                >
                    <button
                        className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
                        onClick={() => {
                            navigation(-1);
                        }}
                    >
                        <BackIcon className="w-5 h-5" />
                    </button>
                    <div className="ml-3 flex items-center gap-x-3">
                        {id === "group" ? (
                            <div className="w-10 h-10 rounded-full bg-blue-800"></div>
                        ) : (
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                {receiverData.avatar ? (
                                    <img
                                        alt="avatar"
                                        className="h-full"
                                        src={`${process.env.REACT_APP_PORT}/uploads/${receiverData.avatar}`}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full border flex items-center justify-center">
                                        {receiverData?.userName
                                            ?.charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="">
                            <div>
                                {id === "group"
                                    ? "Общий чат"
                                    : receiverData.userName}
                            </div>
                            {/* <div className="text-xs">Сейчас в сети</div> */}
                        </div>
                    </div>
                    {id !== "group" && (
                        <button
                            className="ml-auto flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
                            onClick={startCall}
                        >
                            <PhoneIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div
                    ref={chatRef}
                    className="gap-y-2 pt-[80px] pb-3 px-2 chat-overflow"
                >
                    {messages &&
                        messages.length > 0 &&
                        messages.map((item) => {
                            if (item.type === "group") {
                                return (
                                    <div key={item._id} className="chat-box">
                                        {item.sender._id === userData._id ? (
                                            <div className="flex justify-end items-center gap-x-2">
                                                <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                                                    {item.content}
                                                </div>
                                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                                    {item.sender.avatar ? (
                                                        <img
                                                            alt="avatar"
                                                            className="h-full"
                                                            src={`${process.env.REACT_APP_PORT}/uploads/${item.sender.avatar}`}
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                                                            {item?.sender?.userName
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-x-2">
                                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                                    {item.sender.avatar ? (
                                                        <img
                                                            alt="avatar"
                                                            className="h-full"
                                                            src={`${process.env.REACT_APP_PORT}/uploads/${item.sender.avatar}`}
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                                                            {item?.sender?.userName
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                                                    {item.content}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={item._id}>
                                        {item.sender === userData._id ? (
                                            <div className="flex justify-end items-center gap-x-2">
                                                <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                                                    {item.content}
                                                </div>
                                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                                    {userData.avatar ? (
                                                        <img
                                                            alt="avatar"
                                                            className="h-full"
                                                            src={`${process.env.REACT_APP_PORT}/uploads/${userData.avatar}`}
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                                                            {userData?.userName
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                    <img
                                                        alt="avatar"
                                                        className="h-full"
                                                        src={`${process.env.REACT_APP_PORT}/uploads/${userData.avatar}`}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-x-2">
                                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                                    {receiverData.avatar ? (
                                                        <img
                                                            alt="avatar"
                                                            className="h-full"
                                                            src={`${process.env.REACT_APP_PORT}/uploads/${receiverData.avatar}`}
                                                        />
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                                                            {receiverData?.userName
                                                                ?.charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                                                    {item.content}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        })}
                </div>
                <form
                    onSubmit={handleSend}
                    action="#"
                    className="fixed z-20 flex bottom-0 w-full items-center px-5 py-3 rounded-t-md border-t bg-gray-900 bg-opacity-30"
                >
                    <div className="flex-1">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            className="min-w-full outline-none px-2 py-1 rounded-lg text-sm resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ overflowY: "scroll" }}
                        />
                    </div>
                    <div className="ml-3 -mt-1">
                        <button
                            type="submit"
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-900 bg-opacity-50"
                            disabled={message === ""}
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
