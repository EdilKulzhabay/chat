import { useState } from "react";
import api from "../api";

export default function AddUsers() {
    const [userName, setUserName] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");

    const addUser = () => {
        api.post(
            "/register",
            { userName, fullName, password, phone },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
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
                    FullName
                    <input
                        className="ml-2 outline-nonde border rounded-md "
                        value={fullName}
                        onChange={(e) => {
                            setFullName(e.target.value);
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
                <div>
                    Phone
                    <input
                        className="ml-2 outline-nonde border rounded-md "
                        value={phone}
                        onChange={(e) => {
                            setPhone(e.target.value);
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
