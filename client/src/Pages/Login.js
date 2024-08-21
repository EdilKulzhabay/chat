import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api";
import MySnackBar from "../Components/MySnackBar";

export default function Login() {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [errorText, setErrorText] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [et, setEt] = useState("");

    const [form, setForm] = useState({
        userName: "",
        password: "",
    });

    const changeHandler = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const loginHandler = async () => {
        api.post(
            "/login",
            { ...form },
            {
                headers: { "Content-Type": "application/json" },
            }
        )
            .then(({ data }) => {
                auth.login(data.accessToken);
                navigate("/");
                setErrorText(false);
            })
            .catch((e) => {
                if (e.response && e.response.data) {
                    setErrorText(true);
                    setEt(e.response.data.message);
                } else {
                    setErrorText(true);
                    setEt("Неизвестная ошибка. Попробуйте еще раз.");
                }
            });
    };

    const handleClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setErrorText(false);
    };

    useEffect(() => {
        if (localStorage.getItem("token") !== null) {
            api.get("getMe", {
                headers: { "Content-Type": "application/json" },
            }).then(({ data }) => {
                if (data._id) {
                    setIsAuth(data);
                }
            });
        }
    }, []);

    useEffect(() => {
        if (isAuth._id) {
            navigate("/");
        }
    }, [isAuth, navigate]);

    return (
        <div className="min-h-screen flex justify-center items-center">
            <div className="-mt-10">
                <div className="text-4xl text-purple-900 font-semibold text-center">
                    VOCA
                </div>
                <div className="mt-3 text-sm text-[#606B85] text-center">
                    Пожалуйста, войдите в свой аккаунт и начните работу
                </div>
                <div className="mt-7 px-4">
                    <div>
                        <input
                            error="true"
                            className="w-full p-3 border rounded-md"
                            placeholder="Имя"
                            id="userName"
                            type="text"
                            name="userName"
                            value={form.userName}
                            onChange={changeHandler}
                        />
                    </div>
                    <div className="mt-3">
                        <input
                            error="true"
                            className="w-full p-3 border rounded-md"
                            placeholder="Пароль"
                            id="password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={changeHandler}
                        />
                    </div>
                </div>

                <div className="w-full mt-5">
                    <button
                        onClick={loginHandler}
                        className="w-full py-2.5 text-center rounded-lg font-medium bg-purple-700 text-white"
                    >
                        ВОЙТИ
                    </button>
                </div>
            </div>
            <MySnackBar
                close={handleClose}
                open={errorText}
                status="error"
                text={et}
            />
        </div>
    );
}
