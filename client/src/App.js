import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthContext } from "./AuthContext";
import { useAuth } from "./auth.hook";
import { useEffect, useState } from "react";
import api from "./api";
import socket from "./socket";

function App() {
    const { token, login, logout } = useAuth();
    const isAuthenticated = !!token;
    const [userData, setUserData] = useState({});

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

    return (
        <>
            <AuthContext.Provider
                value={{
                    token,
                    login,
                    logout,
                    isAuthenticated,
                }}
            >
                <RouterProvider router={router} />
            </AuthContext.Provider>
        </>
    );
}

export default App;
