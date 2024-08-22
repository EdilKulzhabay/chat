import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import useWebRTC, { LOCAL_VIDEO } from "../hooks/useWebRTC";
import PhoneOutIcon from "../Icons/PhoneOutIcon";
import socket from "../socket";

export default function GroupCall() {
    const [userData, setUserData] = useState({});
    const [users, setUsers] = useState(1);
    const [actions, setActions] = useState([]);
    const [isJoin, setIsJoin] = useState(false);

    const { id: roomID } = useParams();
    const navigate = useNavigate();

    const { clients, provideMediaRef } = useWebRTC(roomID);

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

    useEffect(() => {
        if (userData?.userName) {
            socket.emit("joinRoom", "group", userData.userName);
            setIsJoin(true);
        }
    }, [userData]);

    useEffect(() => {
        if (isJoin) {
            socket.emit("getDataGroup", (roomSize) => {
                console.log("getDataGroup", roomSize);
                setUsers(roomSize);
            });
        }
    }, [isJoin]);

    useEffect(() => {
        getInfo();
    }, []);

    const endCall = () => {
        socket.emit("leaveGroupCall", { userName: userData.userName });
        navigate(-1);
    };

    useEffect(() => {
        const handleGroupAction = (data) => {
            setActions((prevActions) => [data.message, ...prevActions]);
            setUsers(data.users);
            console.log(data);
        };
        socket.on("groupAction", handleGroupAction);
        return () => {
            socket.off("groupAction", handleGroupAction);
        };
    }, []);

    return (
        <div className="bg-black flex flex-col items-center min-h-screen">
            {clients &&
                clients.map((clientID) => {
                    return (
                        <div key={clientID}>
                            <audio
                                ref={(instance) => {
                                    provideMediaRef(clientID, instance);
                                }}
                                autoPlay
                                playsInline
                                muted={clientID === LOCAL_VIDEO}
                            />
                        </div>
                    );
                })}
            <div className="mt-32 text-center text-lg font-medium text-white">
                В данный момент на звонке {users} пользователей
            </div>
            <div className="mt-4 max-h-20 text-center text-lg font-medium text-white overflow-y-scroll">
                {actions &&
                    actions.length > 0 &&
                    actions.map((item, index) => {
                        // if (index !== actions.length - 1) {
                        return <div key={index}>{item}</div>;
                        // }
                    })}
            </div>

            <div className="mt-auto mx-auto pb-10">
                <button
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 "
                    onClick={endCall}
                >
                    <PhoneOutIcon className="text-white w-8 h-8" />
                </button>
            </div>
        </div>
    );
}
