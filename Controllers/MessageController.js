import Message from "../Models/Message.js";
import User from "../Models/User.js";
import CryptoJS from "crypto-js";

const decryptMessage = (ciphertext) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, process.env.CRYPTO);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("Error decrypting message:", error);
        return ciphertext; // Возвращаем исходное сообщение, если не удается расшифровать
    }
};

export const getMessages = async (req, res) => {
    try {
        const id = req.userId;
        const { type, page, receiver } = req.body;

        const limit = 20;
        const skip = (page - 1) * limit;

        let messages;

        if (type === "group") {
            messages = await Message.find({ type: "group" })
                .populate("sender")
                .sort({ createdAt: -1 });
        } else {
            messages = await Message.find({
                $or: [
                    { sender: id, receiver },
                    { sender: receiver, receiver: id },
                ],
            }).sort({ createdAt: -1 });
        }

        // Расшифровка каждого сообщения с обработкой ошибок
        const decryptedMessages = messages.map((message) => {
            try {
                return {
                    ...message.toObject(),
                    content: decryptMessage(message.content), // Попытка расшифровать
                };
            } catch (error) {
                console.error("Failed to decrypt message:", error);
                return message.toObject(); // Возвращаем как есть, если ошибка
            }
        });

        res.json({
            messages: decryptedMessages,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Ошибка на стороне сервера",
        });
    }
};

export const getChats = async (req, res) => {
    try {
        const id = req.userId;
        const user = await User.findById(id);
        const userId = user._id;

        const chats = await Message.aggregate([
            {
                $match: {
                    $and: [
                        {
                            $or: [{ sender: userId }, { receiver: userId }],
                        },
                        {
                            type: { $ne: "group" },
                        },
                    ],
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", userId] },
                            then: "$receiver",
                            else: "$sender",
                        },
                    },
                    lastMessage: { $first: "$$ROOT" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "receiverInfo",
                },
            },
            {
                $addFields: {
                    receiverUserName: {
                        $arrayElemAt: ["$receiverInfo.userName", 0],
                    },
                    receiverAvatar: {
                        $arrayElemAt: ["$receiverInfo.avatar", 0],
                    },
                    receiverId: {
                        $arrayElemAt: ["$receiverInfo._id", 0],
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    chatPartner: 1,
                    receiverUserName: 1,
                    receiverAvatar: 1,
                    receiverId: 1,
                    lastMessage: "$lastMessage.content",
                    timestamp: "$lastMessage.createdAt",
                },
            },
        ]);

        // Расшифровка последнего сообщения в каждом чате
        const decryptedChats = chats.map((chat) => ({
            ...chat,
            lastMessage: decryptMessage(chat.lastMessage),
        }));

        res.json({ chats: decryptedChats });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Ошибка на стороне сервера",
        });
    }
};
