import { createBrowserRouter, Navigate } from "react-router-dom";
import Chat from "./Pages/Chat";
import ChatData from "./Pages/ChatData";
import Login from "./Pages/Login";
import MainPage from "./Pages/MainPage";
import Settings from "./Pages/Settings";
//import TestChat from "./TestChat";

export const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    { path: "/", element: <MainPage /> },
    { path: "/settings", element: <Settings /> },
    { path: "/chat/:id", element: <Chat /> },
    { path: "/chatData/:id", element: <ChatData /> },
    //{ path: "/test", element: <TestChat /> },

    { path: "*", element: <Navigate to="/login" replace /> },
]);
