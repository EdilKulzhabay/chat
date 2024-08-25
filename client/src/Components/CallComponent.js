import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneIcon from "../Icons/PhoneIcon";
import socket from "../socket";
import api from "../api";

export default function CallComponent() {
    const navigation = useNavigate();
    const [call, setCall] = useState(false);
    const [canPlayAudio, setCanPlayAudio] = useState(false);
    const [caller, setCaller] = useState("");
    const [receiver, setReceiver] = useState({});
    const [cLink, setCLink] = useState("");
    const [userData, setUserData] = useState({});
    const [audio, setAudio] = useState(null); // Создаем состояние для аудио

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
        const enableAudio = () => setCanPlayAudio(true);

        document.addEventListener("click", enableAudio);
        const audioInstance = new Audio("/call.mp3");
        setAudio(audioInstance); // Устанавливаем аудио в состояние

        socket.on("privateCalling", (data) => {
            setCall(true);
            setCLink(data.link);
            setCaller(data.caller);
            setReceiver(data.receiver);
            audioInstance.play().catch((error) => {
                console.error("Failed to play audio:", error);
            });
        });

        socket.on("endingCall", () => {
            audioInstance.pause();
            audioInstance.currentTime = 0;
            setCall(false);
        });

        return () => {
            audioInstance.pause(); // Останавливаем аудио при размонтировании компонента
            audioInstance.currentTime = 0;
            setCall(false);
            socket.off("privateCalling");
            socket.off("endingCall");
            document.removeEventListener("click", enableAudio);
        };
    }, []);

    const startCall = () => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        const cId = caller._id;
        socket.emit("tookTheCall", {
            callerId: cId,
            answer: receiver,
        });
        navigation(cLink, { state: { isAnswer: true, companion: cId } });
    };

    return (
        <>
            {call && (
                <div className="absolute inset-0 min-h-screen flex flex-col items-center pb-10 bg-white z-50">
                    <div className="mt-20 text-center text-2xl font-medium">
                        {caller.userName}
                    </div>
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
