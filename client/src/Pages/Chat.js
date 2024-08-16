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
    const [page, setPage] = useState(1);
    const messagesEndRef = useRef(null);
    const [isCallStarted, setIsCallStarted] = useState(false);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);

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

    const getMessages = () => {
        api.post(
            "/getMessages",
            { type: id, page, receiver: id },
            {
                headers: { "Content-Type": "application/json" },
            }
        )
            .then(({ data }) => {
                const newMessages =
                    data.messages.length > 0 && data.messages.reverse();
                setMessages([...messages, ...newMessages]);
            })
            .catch((e) => {
                console.log(e);
            });
    };

    useEffect(() => {
        getInfo();
        getMessages();
    }, []);

    useEffect(() => {
        if (userData?.userName) {
            const str = userData.userName + id;
            const room = str.split("").sort().join("");
            socket.emit("joinRoom", room, userData.userName);
        }
    }, [userData]);

    useEffect(() => {
        const handleMessage = (newMessage) => {
            console.log("Received message", newMessage);
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        };

        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleNewICECandidate);

        socket.on("message", handleMessage);
        return () => {
            socket.off("message", handleMessage);
            socket.off("offer", handleOffer);
            socket.off("answer", handleAnswer);
            socket.off("ice-candidate", handleNewICECandidate);
        };
    }, []);

    const handleSend = async () => {
        const messageData = {
            content: message,
            sender: userData.userName,
            type: id === "group" ? "group" : "private",
            receiver: id === "group" ? "group" : id,
        };

        socket.emit("sendMessage", messageData);
        // messageData._id = `${Math.random()}`;
        // setMessages([...messages, messageData]);
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

    const startCall = async () => {
        peerConnectionRef.current = new RTCPeerConnection();

        // Настройка потоков
        const localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        localStreamRef.current = localStream;
        const remoteStream = new MediaStream();
        remoteStreamRef.current = remoteStream;

        localStream.getTracks().forEach((track) => {
            peerConnectionRef.current.addTrack(track, localStream);
        });

        peerConnectionRef.current.ontrack = (event) => {
            remoteStream.addTrack(event.track);
        };

        peerConnectionRef.current.onicecandidate = (event) => {
            console.log("call", event);
            // console.log("candidate", event.candidate);
            if (event.candidate) {
                socket.emit("ice-candidate", id);
            }
        };

        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket.emit("offer", offer);

        setIsCallStarted(true);
    };

    const handleOffer = async (offer) => {
        console.log("offer", offer);
        if (!peerConnectionRef.current) {
            peerConnectionRef.current = new RTCPeerConnection();
        }

        await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
        );

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", answer);
    };

    const handleAnswer = async (answer) => {
        console.log("answer", answer);
        await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
        );
    };

    const handleNewICECandidate = (candidate) => {
        console.log("Received ICE candidate:", candidate);
        if (candidate) {
            try {
                peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );
            } catch (e) {
                console.error("Failed to add ICE candidate:", e);
            }
        } else {
            console.log(
                "Received null ICE candidate, indicating end of candidate gathering."
            );
        }
    };

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
                        to={`/chatData/${id}`}
                        className="ml-3 flex items-center gap-x-3"
                    >
                        <div className="h-10 w-10 rounded-full bg-blue-950"></div>
                        <div className="">
                            <div>{id === "group" ? "Общий чат" : id}</div>
                            <div className="text-xs">Сейчас в сети</div>
                        </div>
                    </Link>
                    <button
                        className="ml-auto flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
                        onClick={startCall}
                    >
                        <PhoneIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 flex flex-col gap-y-3 pb-2 justify-end overflow-scroll">
                    {messages &&
                        messages.length > 0 &&
                        messages.map((item) => {
                            return (
                                <div key={item._id}>
                                    {item.sender === userData.userName ? (
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
                                                    src={`http://localhost:5002/uploads/${userData.avatar}`}
                                                />
                                            </div>
                                            <div className="py-px px-1 rounded-full text-sm border">
                                                {item.content}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    <div ref={messagesEndRef} /> {/* Scroll anchor */}
                </div>
                <div>
                    <audio
                        ref={(audio) =>
                            audio && (audio.srcObject = localStreamRef.current)
                        }
                        autoPlay
                        muted
                    />
                    <audio
                        ref={(audio) =>
                            audio && (audio.srcObject = remoteStreamRef.current)
                        }
                        autoPlay
                    />
                </div>
                <div className="flex items-center px-5 py-3 rounded-t-md border-t bg-gray-900 bg-opacity-30">
                    <button
                        className="text-lg"
                        onClick={() => {
                            setSendFileButton(!sendFileButton);
                        }}
                    >
                        {sendFileButton ? "x" : "+"}
                    </button>
                    <div className="flex-1 ml-5">
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
                        {message === "" ? (
                            <button className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-900 bg-opacity-50">
                                <MicroPhoneIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-900 bg-opacity-50"
                                onClick={handleSend}
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
