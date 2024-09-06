import { useEffect, useRef, useCallback, useState } from "react";
import freeice from "freeice";
import useStateWithCallback from "./useStateWithCallback";
import socket from "../socket";
import ACTIONS from "../socket/actions";

export const LOCAL_AUDIO = "LOCAL_AUDIO";

export default function useWebRTC(roomID) {
    const [clients, updateClients] = useStateWithCallback([]);
    const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(false);

    const peerConnections = useRef({});
    const localMediaStream = useRef(null);
    const peerMediaElements = useRef({
        [LOCAL_AUDIO]: null,
    });

    const addNewClient = useCallback(
        (newClient, cb) => {
            updateClients((list) => {
                if (!list.includes(newClient)) {
                    return [...list, newClient];
                }
                return list;
            }, cb);
        },
        [updateClients]
    );

    useEffect(() => {
        async function handleNewPeer({ peerID, createOffer }) {
            if (peerID in peerConnections.current) {
                return;
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

            peerConnections.current[peerID].ontrack = ({
                streams: [remoteStream],
            }) => {
                addNewClient(peerID, () => {
                    const audioElement = peerMediaElements.current[peerID];
                    if (audioElement) {
                        audioElement.srcObject = remoteStream;
                    }
                });
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
    }, [addNewClient]);

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
    }, [updateClients]);

    useEffect(() => {
        async function startCapture() {
            localMediaStream.current =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

            addNewClient(LOCAL_AUDIO, () => {
                const localAudioElement =
                    peerMediaElements.current[LOCAL_AUDIO];
                if (localAudioElement) {
                    localAudioElement.volume = 0;
                    localAudioElement.srcObject = localMediaStream.current;
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
    }, [roomID, addNewClient]);

    const toggleSpeaker = useCallback(() => {
        const audioElement = peerMediaElements.current[LOCAL_AUDIO];

        if (audioElement && typeof audioElement.setSinkId !== "undefined") {
            navigator.mediaDevices.enumerateDevices().then((devices) => {
                const earpieceDevice = devices.find(
                    (device) =>
                        device.kind === "audiooutput" &&
                        device.label.includes("Headset earpiece")
                );

                const speakerDevice = devices.find(
                    (device) =>
                        device.kind === "audiooutput" &&
                        device.label.includes("Speakerphone")
                );

                const selectedDeviceId = isSpeakerEnabled
                    ? earpieceDevice?.deviceId || "default"
                    : speakerDevice?.deviceId || "default";

                if (selectedDeviceId) {
                    audioElement
                        .setSinkId(selectedDeviceId)
                        .then(() =>
                            console.log(
                                `Audio output switched to ${
                                    isSpeakerEnabled
                                        ? "Headset earpiece"
                                        : "Speakerphone"
                                }`
                            )
                        )
                        .catch((error) =>
                            console.error(
                                "Error switching audio output:",
                                error
                            )
                        );
                } else {
                    console.warn("No suitable audio output device found.");
                }

                setIsSpeakerEnabled(!isSpeakerEnabled);
            });
        } else {
            console.warn("setSinkId is not supported by your browser.");
        }
    }, [isSpeakerEnabled]);

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
