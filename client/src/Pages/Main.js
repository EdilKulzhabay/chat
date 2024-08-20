import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import socket from "../socket";
import ACTIONS from "../socket/actions";

export default function Main() {
    const navigate = useNavigate();
    const [rooms, updateRooms] = useState([]);
    const rootNode = useRef();

    useEffect(() => {
        socket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] }) => {
            if (rootNode.current) {
                updateRooms(rooms);
            }
        });
    }, []);

    return (
        <div ref={rootNode}>
            <h1>Rooms Phone123</h1>
            <ul>
                {rooms.map((roomID) => (
                    <li key={roomID}>
                        {roomID}
                        <button
                            onClick={() => {
                                navigate(`/call/${roomID}`);
                            }}
                        >
                            join
                        </button>
                    </li>
                ))}
            </ul>
            <button
                onClick={() => {
                    navigate(`/call/${v4()}`);
                }}
            >
                Create new room
            </button>
        </div>
    );
}
