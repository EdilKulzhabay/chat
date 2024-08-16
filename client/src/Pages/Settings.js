import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Hr from "../Components/Hr";
import BackIcon from "../Icons/BackIcon";
import UserIcon from "../Icons/UserIcon";

export default function Settings() {
    const [userData, setUserData] = useState({});
    const inputFileRef = useRef(null);
    const navigation = useNavigate();

    const getInfo = () => {
        api.get("/getMe", {
            headers: { "Content-Type": "application/json" },
        })
            .then(({ data }) => {
                setUserData(data);
            })
            .catch((e) => {
                console.log("sldfsldkfmlsdk");
            });
    };

    useEffect(() => {
        getInfo();
    }, []);

    const handleChangeFile = async (event) => {
        event.preventDefault();
        try {
            const formData = new FormData();
            formData.append("image", event.target.files[0]);
            api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
                .then(({ data }) => {
                    getInfo();
                })
                .catch((err) => {
                    console.log(err);
                });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            <div className="flex items-center gap-x-3 px-3 py-4">
                <button
                    className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
                    onClick={() => {
                        navigation(-1);
                    }}
                >
                    <BackIcon className="w-5 h-5" />
                </button>
                <div className="text-xl font-medium">Настройки</div>
            </div>
            <Hr />
            <div className="mt-5 flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="flex items-center justify-center w-[200px] h-[200px] border-2 border-purple-800 rounded-full overflow-hidden bg-gray-400 bg-opacity-50">
                        {userData.avatar && userData.avatar !== "" ? (
                            <img
                                className="h-full"
                                src={`http://localhost:5002/uploads/${userData.avatar}`}
                            />
                        ) : (
                            <UserIcon className="w-[90px] h-[90px]" />
                        )}
                    </div>

                    <div className="absolute bottom-2 right-8">
                        <button
                            type="button"
                            className="flex items-center justify-center w-6 h-6 bg-[#5e00ff] rounded-full text-white hover:bg-[#5d00ffc0]"
                            onClick={() => inputFileRef.current.click()}
                        >
                            <p className="text-lg font-medium">+</p>
                        </button>
                        <input
                            ref={inputFileRef}
                            type="file"
                            onChange={handleChangeFile}
                            hidden
                        />
                    </div>
                </div>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center">
                <div className="text-lg font-medium ">{userData?.fullName}</div>
                <div className="mt-1 text-sm font-medium ">
                    {userData?.phone}
                </div>
            </div>
        </>
    );
}
