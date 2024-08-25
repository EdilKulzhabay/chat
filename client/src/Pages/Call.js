import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import useWebRTC, { LOCAL_VIDEO } from "../hooks/useWebRTC";
import PhoneOutIcon from "../Icons/PhoneOutIcon";
import socket from "../socket";

export default function Call() {
    const [isAnswer, setIsAnswer] = useState(false);
    const [userData, setUserData] = useState({});
    const location = useLocation();
    const isReceiver = location.state.isAnswer;
    const companion = location.state.companion;

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
            socket.emit("joinRoom", userData._id, userData.userName);
        }
    }, [userData]);

    useEffect(() => {
        getInfo();
    }, []);

    useEffect(() => {
        socket.on("tookTheCallAnswer", () => {
            setIsAnswer(true);
        });

        return () => {
            socket.off("tookTheCallAnswer");
        };
    }, []);

    useEffect(() => {
        socket.on("endingCall", () => {
            navigate(-1);
        });
        return () => {
            socket.off("endingCall");
        };
    }, []);

    const endCall = () => {
        socket.emit("endCall", { companion });
        navigate(-1);
    };

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
                {isAnswer || isReceiver ? "Звонок начался" : "Ожидание ответа"}
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
