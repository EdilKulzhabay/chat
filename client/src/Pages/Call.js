import { useParams } from "react-router-dom";
import useWebRTC, { LOCAL_VIDEO } from "../hooks/useWebRTC";

export default function Call() {
    const { id: roomID } = useParams();

    const { clients, provideMediaRef } = useWebRTC(roomID);
    return (
        <div>
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
        </div>
    );
}
