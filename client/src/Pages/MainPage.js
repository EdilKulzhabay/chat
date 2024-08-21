import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import ChatIcon from "../Icons/ChatIcon";
import PlusIcon from "../Icons/PlusIcon";
import SettingsIcon from "../Icons/SettingsIcon";
import socket from "../socket";
import CallComponent from "../Components/CallComponent";

export default function MainPage() {
    const [userData, setUserData] = useState({});
    const navigation = useNavigate();
    const [canPlayAudio, setCanPlayAudio] = useState(false);
    const [users, setUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const [call, setCall] = useState(false);
    const [cLink, setCLink] = useState("");
    const audio = new Audio("/asd.mp3");

    const getInfo = () => {
        api.get("/getMe", {
            headers: { "Content-Type": "application/json" },
        })
            .then(({ data }) => {
                setUserData(data);
            })
            .catch((e) => {
                navigation("/login");
            });
    };

    const getUsers = () => {
        api.get("/getUsers", {
            headers: { "Content-Type": "application/json" },
        })
            .then(({ data }) => {
                setUsers(data.users);
            })
            .catch((e) => {
                console.log(e);
            });
    };

    const getChats = () => {
        api.get("/getChats", {
            headers: { "Content-Type": "application/json" },
        })
            .then(({ data }) => {
                setChats(data.chats);
                console.log(data);
            })
            .catch((e) => {
                console.log(e);
            });
    };

    useEffect(() => {
        const enableAudio = () => setCanPlayAudio(true);

        document.addEventListener("click", enableAudio);
        socket.on("updateMessages", () => {
            getChats();
            audio.play().catch((error) => {
                console.error("Failed to play audio:", error);
            });
        });
        return () => {
            socket.off("updateMessages", getChats);
            document.removeEventListener("click", enableAudio);
        };
    }, []);

    useEffect(() => {
        if (userData?.userName) {
            socket.emit("joinRoom", userData._id, userData.userName);
        }
    }, [userData]);

    useEffect(() => {
        getInfo();
        getUsers();
        getChats();
    }, []);

    return (
        <>
            <CallComponent />
            <div className="relative flex flex-col min-h-screen">
                <div className="fixed bottom-16 right-3 w-12 h-12 flex items-center justify-center rounded-full bg-purple-800">
                    <Link to="/chatData/group">
                        <PlusIcon className="w-8 h-8 text-white" />
                    </Link>
                </div>
                <div className="py-4 border-b border-b-purple-800">
                    <div className="text-4xl text-purple-900 font-semibold ml-3 italic">
                        VOCA
                    </div>
                </div>
                <div className="flex-1 overflow-scroll">
                    <Link
                        to="/chat/group"
                        className="flex items-center h-[80px] py-2 px-4 border-b border-b-gray-600"
                    >
                        <div className="h-10 w-10 rounded-full bg-blue-950"></div>
                        <div className="ml-3">
                            <div>Общий чат</div>
                            <div>message</div>
                        </div>
                    </Link>
                    {chats &&
                        chats.length > 0 &&
                        chats.map((item) => {
                            if (item.receiverUserName !== "group") {
                                return (
                                    <div
                                        key={item.receiverUserName}
                                        className=""
                                    >
                                        <Link
                                            to={`/chat/${item.receiverId}`}
                                            className="flex items-center h-[80px] py-2 px-4 border-b border-b-gray-600"
                                        >
                                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                                {item.receiverAvatar ? (
                                                    <img
                                                        className="h-full"
                                                        src={`${process.env.REACT_APP_PORT}/uploads/${item.receiverAvatar}`}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full flex border items-center justify-center">
                                                        {item.receiverUserName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}
                                                <img
                                                    className="h-full"
                                                    src={`${process.env.REACT_APP_PORT}/uploads/${item.receiverAvatar}`}
                                                />
                                            </div>
                                            <div className="ml-3">
                                                <div>
                                                    {item.receiverUserName}
                                                </div>
                                                <div>{item.lastMessage}</div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            }
                        })}
                </div>
                <div className="flex items-center justify-around grow-0 py-4 border-t border-t-purple-800">
                    <Link
                        to="/"
                        className="flex items-center justify-center active:bg-gray-200"
                    >
                        <ChatIcon className="w-7 h-7 text-purple-800" />
                    </Link>
                    <Link
                        to="/settings"
                        className="flex items-center justify-center active:bg-gray-200"
                    >
                        <SettingsIcon className="w-7 h-7 text-purple-800" />
                    </Link>
                </div>
            </div>
        </>
    );
}
