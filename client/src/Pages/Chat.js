import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BackIcon from "../Icons/BackIcon";
import PhoneIcon from "../Icons/PhoneIcon";
import SendIcon from "../Icons/SendIcon";
import api from "../api";
import socket from "../socket";
import { v4 } from "uuid";
import CallComponent from "../Components/CallComponent";
import AutoResizingTextarea from "../Components/TextArea";

export default function Chat() {
  const { id } = useParams();
  const navigation = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState({});
  const [receiverData, setReceiverData] = useState({});
  const [page, setPage] = useState(1);
  const messagesEndRef = useRef(null);
  const [needScroll, setNeedScroll] = useState(true);

  const getInfo = () => {
    api
      .get("/getMe", {
        headers: { "Content-Type": "application/json" },
      })
      .then(({ data }) => {
        setUserData(data);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const getReceiverData = () => {
    api
      .post(
        "/getReceiverData",
        { id },
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then(({ data }) => {
        setReceiverData(data);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const getMessages = () => {
    api
      .post(
        "/getMessages",
        { type: id, page, receiver: id },
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then(({ data }) => {
        if (data.messages.length > 0) {
          const newMessages =
            data.messages.length > 0 && data.messages.reverse();
          setMessages([...messages, ...newMessages]);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  useEffect(() => {
    getInfo();
    if (id !== "group") {
      getReceiverData();
    }
    getMessages();
  }, []);

  useEffect(() => {
    if (userData?.userName) {
      // socket.emit("joinRoom", userData._id, userData.userName);
    }
  }, [userData]);

  useEffect(() => {
    const handleMessage = (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    socket.on("message", handleMessage);
    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  const handleSend = async () => {
    const messageData = {
      content: message,
      sender: userData._id,
      type: id === "group" ? "group" : "private",
      receiver: id === "group" ? null : receiverData._id,
    };

    socket.emit("sendMessage", messageData);
    setMessage("");

    setTimeout(() => {
      document.getElementById("messageTextarea").focus();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && message.length > 0) {
      event.preventDefault(); // Prevent default space behavior (scrolling)
      handleSend();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (needScroll && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setNeedScroll(false);
    }
  }, [messages]);

  function getInitials(fullName) {
    if (!fullName) return "";
    const names = fullName.split(" ");
    const initials = names.map((name) => name.charAt(0).toUpperCase()).join("");
    return initials;
  }

  const startCall = () => {
    const recId = receiverData._id;
    const link = `/call/${v4()}`;
    socket.emit("startPrivateCall", {
      recId: recId,
      link: link,
      caller: userData,
    });

    navigation(link, { state: { isAnswer: false, companion: recId } });
  };

  const startGrouopCall = () => {
    const recName = userData.userName;
    const link = `/groupCall/f5aa2211-c928-4f34-a8e4-d225e6b2a041`;
    socket.emit("startGroupCall", {
      recName: recName,
    });

    navigation(link);
  };

  return (
    <>
      <CallComponent />
      <div className="flex flex-col min-h-screen max-h-screen">
        <div className="flex items-center min-w-full px-3 py-4 border-b border-gray-600">
          <button
            className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
            onClick={() => {
              navigation(-1);
            }}>
            <BackIcon className="w-5 h-5" />
          </button>
          <div className="ml-3 flex items-center gap-x-3">
            {id === "group" ? (
              <div className="w-10 h-10 rounded-full bg-blue-800"></div>
            ) : (
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {receiverData.avatar ? (
                  <img
                    className="h-full"
                    src={`${process.env.REACT_APP_PORT}/uploads/${receiverData.avatar}`}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center">
                    {getInitials(receiverData?.fullName)}
                  </div>
                )}
              </div>
            )}
            <div className="">
              <div>{id === "group" ? "Общий чат" : receiverData.userName}</div>
              <div className="text-xs">Сейчас в сети</div>
            </div>
          </div>
          <button
            className="ml-auto flex items-center justify-center p-2 hover:bg-gray-200 rounded-full"
            onClick={() => {
              if (id === "group") {
                startGrouopCall();
              } else {
                startCall();
              }
            }}>
            <PhoneIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 py-3 px-2 overflow-y-scroll">
          {messages &&
            messages.length > 0 &&
            messages.map((item) => {
              if (item.type === "group") {
                return (
                  <div key={item._id} className="">
                    {item.sender._id === userData._id ? (
                      <div className="flex justify-end items-center gap-x-2">
                        <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                          {item.content}
                        </div>
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          {item.sender.avatar ? (
                            <img
                              className="h-full"
                              src={`${process.env.REACT_APP_PORT}/uploads/${item.sender.avatar}`}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                              {getInitials(item?.sender?.fullName)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-x-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          {item.sender.avatar ? (
                            <img
                              className="h-full"
                              src={`${process.env.REACT_APP_PORT}/uploads/${item.sender.avatar}`}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                              {getInitials(item?.sender?.fullName)}
                            </div>
                          )}
                        </div>
                        <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                          {item.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={item._id}>
                    {item.sender === userData._id ? (
                      <div className="flex justify-end items-center gap-x-2">
                        <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                          {item.content}
                        </div>
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          {userData.avatar ? (
                            <img
                              className="h-full"
                              src={`${process.env.REACT_APP_PORT}/uploads/${userData.avatar}`}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                              {getInitials(userData?.fullName)}
                            </div>
                          )}
                          <img
                            className="h-full"
                            src={`${process.env.REACT_APP_PORT}/uploads/${userData.avatar}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-x-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                          {receiverData.avatar ? (
                            <img
                              className="h-full"
                              src={`${process.env.REACT_APP_PORT}/uploads/${receiverData.avatar}`}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full border flex items-center justify-center">
                              {getInitials(receiverData?.fullName)}
                            </div>
                          )}
                        </div>
                        <div className="py-1 px-2 rounded-lg max-w-[70%] break-words text-sm border">
                          {item.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            })}
          <div ref={messagesEndRef} className="py-1" /> {/* Scroll anchor */}
        </div>
        <div className="fixed flex bottom-0 w-full items-center px-5 py-3 rounded-t-md border-t bg-gray-900 bg-opacity-30">
          <div className="flex-1">
            <AutoResizingTextarea value={message} setMessage={setMessage} />
          </div>
          <div className="ml-3">
            <button
              className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-900 bg-opacity-50"
              onClick={handleSend}
              disabled={message === ""}>
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
