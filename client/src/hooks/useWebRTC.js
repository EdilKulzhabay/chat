import { useEffect, useRef, useCallback, useState } from "react";
import freeice from "freeice";
import useStateWithCallback from "./useStateWithCallback";
import socket from "../socket";
import ACTIONS from "../socket/actions";
import api from "../api";

export const LOCAL_VIDEO = "LOCAL_VIDEO";

export default function useWebRTC(roomID) {
    const [clients, updateClients] = useStateWithCallback([]);
    const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(false);

    const sendDevices = (devices) => {
        api.post(
            "/testDevices",
            { devices },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
    };

    const addNewClient = useCallback(
        (newClient, cb) => {
            updateClients((list) => {
                if (!list.includes(newClient)) {
                    return [...list, newClient];
                }

                return list;
            }, cb);
        },
        [clients, updateClients]
    );

    const peerConnections = useRef({});
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_VIDEO]: null,
    });

    useEffect(() => {
        async function handleNewPeer({ peerID, createOffer }) {
            if (peerID in peerConnections.current) {
                return console.warn(`Already connected to peer ${peerID}`);
            }

            peerConnections.current[peerID] = new RTCPeerConnection({
                iceServers: freeice(),
            });

            peerConnections.current[peerID].onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit(ACTIONS.RELAY_ICE, {
                        peerID,
                        iceCandidate: event.candidate,
                    });
                }
            };

            let tracksNumber = 0;
            peerConnections.current[peerID].ontrack = ({
                streams: [remoteStream],
            }) => {
                tracksNumber++;

                if (tracksNumber === 1) {
                    tracksNumber = 0;
                    addNewClient(peerID, () => {
                        if (peerMediaElements.current[peerID]) {
                            peerMediaElements.current[peerID].srcObject =
                                remoteStream;
                        } else {
                            let settled = false;
                            const interval = setInterval(() => {
                                if (peerMediaElements.current[peerID]) {
                                    peerMediaElements.current[
                                        peerID
                                    ].srcObject = remoteStream;
                                    settled = true;
                                }

                                if (settled) {
                                    clearInterval(interval);
                                }
                            }, 1000);
                        }
                    });
                }
            };

            localMediaStream.current.getTracks().forEach((track) => {
                peerConnections.current[peerID].addTrack(
                    track,
                    localMediaStream.current
                );
            });

            if (createOffer) {
                const offer = await peerConnections.current[
                    peerID
                ].createOffer();

                await peerConnections.current[peerID].setLocalDescription(
                    offer
                );

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: offer,
                });
            }
        }

        socket.on(ACTIONS.ADD_PEER, handleNewPeer);

        return () => {
            socket.off(ACTIONS.ADD_PEER);
        };
    }, []);

    useEffect(() => {
        async function setRemoteMedia({
            peerID,
            sessionDescription: remoteDescription,
        }) {
            await peerConnections.current[peerID]?.setRemoteDescription(
                new RTCSessionDescription(remoteDescription)
            );

            if (remoteDescription.type === "offer") {
                const answer = await peerConnections.current[
                    peerID
                ].createAnswer();

                await peerConnections.current[peerID].setLocalDescription(
                    answer
                );

                socket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: answer,
                });
            }
        }

        socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);

        return () => {
            socket.off(ACTIONS.SESSION_DESCRIPTION);
        };
    }, []);

    useEffect(() => {
        socket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
            peerConnections.current[peerID]?.addIceCandidate(
                new RTCIceCandidate(iceCandidate)
            );
        });

        return () => {
            socket.off(ACTIONS.ICE_CANDIDATE);
        };
    }, []);

    useEffect(() => {
        const handleRemovePeer = ({ peerID }) => {
            if (peerConnections.current[peerID]) {
                peerConnections.current[peerID].close();
            }

            delete peerConnections.current[peerID];
            delete peerMediaElements.current[peerID];

            updateClients((list) => list.filter((c) => c !== peerID));
        };

        socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

        return () => {
            socket.off(ACTIONS.REMOVE_PEER);
        };
    }, []);

    useEffect(() => {
        async function startCapture() {
            localMediaStream.current =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });

            addNewClient(LOCAL_VIDEO, () => {
                const localVideoElement =
                    peerMediaElements.current[LOCAL_VIDEO];

                if (localVideoElement) {
                    localVideoElement.volume = 0;
                    localVideoElement.srcObject = localMediaStream.current;
                }
            });
        }

        startCapture()
            .then(() => socket.emit(ACTIONS.JOIN, { room: roomID }))
            .catch((e) => console.error("Error getting userMedia:", e));

        return () => {
            localMediaStream.current
                .getTracks()
                .forEach((track) => track.stop());

            socket.emit(ACTIONS.LEAVE);
        };
    }, [roomID]);

    const toggleSpeaker = useCallback(() => {
        if (
            navigator.mediaDevices &&
            typeof navigator.mediaDevices.enumerateDevices === "function"
        ) {
            navigator.mediaDevices
                .enumerateDevices()
                .then((devices) => {
                    sendDevices(devices); // Отправляем устройства на сервер

                    setIsSpeakerEnabled((prev) => {
                        const nextState = !prev;

                        const audioElement =
                            peerMediaElements.current[LOCAL_VIDEO];
                        if (
                            audioElement &&
                            typeof audioElement.setSinkId !== "undefined"
                        ) {
                            // Найдите устройство "Speakerphone"
                            const speakerphoneDeviceId = devices.find(
                                (device) =>
                                    device.kind === "audiooutput" &&
                                    device.label.includes("Speakerphone")
                            )?.deviceId;

                            // Используем "Speakerphone" или устройство по умолчанию
                            const selectedDeviceId = nextState
                                ? speakerphoneDeviceId
                                : "default";

                            // Устанавливаем выбранное устройство как источник звука
                            if (selectedDeviceId) {
                                audioElement
                                    .setSinkId(selectedDeviceId)
                                    .then(() =>
                                        console.log(
                                            `Audio output switched to ${
                                                nextState
                                                    ? "Speakerphone"
                                                    : "default"
                                            }`
                                        )
                                    )
                                    .catch((e) =>
                                        console.error(
                                            "Error switching audio output:",
                                            e
                                        )
                                    );
                            } else {
                                console.log(
                                    "No suitable audio output device found."
                                );
                            }
                        } else {
                            console.warn(
                                "setSinkId is not supported by your browser."
                            );
                        }

                        return nextState; // Верните новое состояние
                    });
                })
                .catch((error) => {
                    console.error("Error accessing media devices:", error);
                });
        } else {
            console.warn("enumerateDevices is not supported by your browser.");
        }
    }, []);

    const provideMediaRef = useCallback((id, node) => {
        peerMediaElements.current[id] = node;
    }, []);

    return {
        clients,
        provideMediaRef,
        toggleSpeaker,
        isSpeakerEnabled,
    };
}
