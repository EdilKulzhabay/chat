import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import Chat from "../Components/Chat";
import ChatIcon from "../Icons/ChatIcon";
import SettingsIcon from "../Icons/SettingsIcon";

export default function MainPage() {
    const [userData, setUserData] = useState({});
    const navigation = useNavigate();
    const [users, setUsers] = useState([]);
    const [chats, setChats] = useState([]);

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
            })
            .catch((e) => {
                console.log(e);
            });
    };

    useEffect(() => {
        getInfo();
        getUsers();
        getChats();
    }, []);

    return (
        <>
            <div className="flex flex-col min-h-screen">
                <div className="py-4 border-b border-b-purple-800">
                    <div className="text-4xl text-purple-900 font-semibold">
                        CHAT
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
                            if (item.chatPartner) {
                                return (
                                    <div key={item.chatPartner} className="">
                                        <Link
                                            to={`/chat/${item.chatPartner}`}
                                            className="flex items-center h-[80px] py-2 px-4 border-b border-b-gray-600"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-blue-950"></div>
                                            <div className="ml-3">
                                                <div>{item.chatPartner}</div>
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
