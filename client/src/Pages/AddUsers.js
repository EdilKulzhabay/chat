import { useState } from "react";
import api from "../api";

export default function AddUsers() {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");

    const addUser = () => {
        api.post(
            "/register",
            { userName, password },
            {
                headers: { "Content-Type": "application/json" },
            }
        ).then(() => {
            setUserName("");
            setPassword("");
        });
    };

    return (
        <>
            <div className="py-5 px-3 space-y-3">
                <div>
                    UserName
                    <input
                        className="ml-2 outline-nonde border rounded-md "
                        value={userName}
                        onChange={(e) => {
                            setUserName(e.target.value);
                        }}
                    />
                </div>
                <div>
                    Password
                    <input
                        className="ml-2 outline-nonde border rounded-md "
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                    />
                </div>
                <button
                    onClick={addUser}
                    className="py-1 px-2 bg-purple-800 text-white font-medium text-lg"
                >
                    Добавить
                </button>
            </div>
        </>
    );
}
