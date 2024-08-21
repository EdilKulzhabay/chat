import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneIcon from "../Icons/PhoneIcon";
import socket from "../socket";

export default function CallComponent() {
    const navigation = useNavigate();
    const [call, setCall] = useState(false);
    const [canPlayAudio, setCanPlayAudio] = useState(false);
    const [cLink, setCLink] = useState("");
    const audio = new Audio("/call.mp3");

    useEffect(() => {
        const enableAudio = () => setCanPlayAudio(true);

        document.addEventListener("click", enableAudio);
        socket.on("privateCalling", (link) => {
            setCall(true);
            setCLink(link);
            audio.play().catch((error) => {
                console.error("Failed to play audio:", error);
            });
        });
        return () => {
            socket.off("privateCalling");
            document.removeEventListener("click", enableAudio);
        };
    }, []);

    const startCall = () => {
        navigation(cLink);
    };

    return (
        <>
            {call && (
                <div className="absolute inset-0 min-h-screen flex flex-col items-center pb-10 bg-white z-50">
                    <button
                        className="mt-auto mx-auto w-14 h-14 rounded-full bg-green-600 flex items-center justify-center"
                        onClick={startCall}
                    >
                        <PhoneIcon className="w-8 h-8 text-white" />
                    </button>
                </div>
            )}
        </>
    );
}
