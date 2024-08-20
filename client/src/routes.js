import { createBrowserRouter, Navigate } from "react-router-dom";
import AddUsers from "./Pages/AddUsers";
import Call from "./Pages/Call";
import Chat from "./Pages/Chat";
import ChatData from "./Pages/ChatData";
import Login from "./Pages/Login";
import Main from "./Pages/Main";
import MainPage from "./Pages/MainPage";
import Settings from "./Pages/Settings";
//import TestChat from "./TestChat";

export const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    { path: "/", element: <MainPage /> },
    { path: "/main", element: <Main /> },
    { path: "/settings", element: <Settings /> },
    { path: "/chat/:id", element: <Chat /> },
    { path: "/chatData/:id", element: <ChatData /> },
    { path: "/call/:id", element: <Call /> },
    { path: "/addUsersEdil", element: <AddUsers /> },
    //{ path: "/test", element: <TestChat /> },

    { path: "*", element: <Navigate to="/login" replace /> },
]);
