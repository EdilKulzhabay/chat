import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useWebRTC, { LOCAL_VIDEO } from "../hooks/useWebRTC";
import PhoneOutIcon from "../Icons/PhoneOutIcon";

export default function Call() {
    const { id: roomID } = useParams();
    const navigate = useNavigate();

    const { clients, provideMediaRef } = useWebRTC(roomID);

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
            <div className="mt-auto mx-auto pb-10">
                <button
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 "
                    onClick={() => {
                        navigate(-1);
                    }}
                >
                    <PhoneOutIcon className="text-white w-8 h-8" />
                </button>
            </div>
        </div>
    );
}
