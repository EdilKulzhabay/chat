import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import CallComponent from "../Components/CallComponent";
import Hr from "../Components/Hr";
import BackIcon from "../Icons/BackIcon";

export default function ChatData() {
    const { id } = useParams();
    const navigation = useNavigate();
    const [users, setUsers] = useState([]);

    const getUsers = () => {
        api.get("/getUsers", {
            headers: { "Content-Type": "application/json" },
        })
            .then(({ data }) => {
                setUsers(data.users);
            })
            .catch((e) => {
                console.log(e);
            });
    };

    useEffect(() => {
        if (id === "group") {
            getUsers();
        }
    }, []);

    return (
        <>
            <CallComponent />
            <div className="flex items-center gap-x-3 px-3 py-4">
                <button
                    className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
                    onClick={() => {
                        navigation(-1);
                    }}
                >
                    <BackIcon className="w-5 h-5" />
                </button>
            </div>
            <Hr />
            <div className="mt-4 px-3">
                <div className="text-2xl font-medium">Участники</div>
                <div className="mt-3">
                    {users &&
                        users.length > 0 &&
                        users.map((item) => {
                            return (
                                <div
                                    key={item._id}
                                    className="py-2 px-1 border-y "
                                >
                                    <Link
                                        to={`/chat/${item._id}`}
                                        className="flex items-center"
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                            {item.avatar ? (
                                                <img
                                                    className="h-full"
                                                    src={`${process.env.REACT_APP_PORT}/uploads/${item.avatar}`}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full border flex items-center justify-center">
                                                    {item?.userName
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <div>{item.userName}</div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                </div>
            </div>
        </>
    );
}
