import Message from "../Models/Message.js";
import User from "../Models/User.js";

export const getMessages = async (req, res) => {
    try {
        const id = req.userId;

        const user = await User.findById(id);

        const { type, page, receiver } = req.body;

        const limit = 5;
        const skip = (page - 1) * limit;

        if (type === "group") {
            const messages = await Message.find({ type: "group" })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: 1 });

            res.json({
                messages,
            });
        } else {
            const messages = await Message.find({
                $or: [
                    { sender: user.userName, receiver },
                    { sender: receiver, receiver: user.userName },
                ],
            })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            res.json({
                messages,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Ошибка на стороне сервера",
        });
    }
};

export const getChatData = async (req, res) => {
    try {
        const { type, receiver } = req.body;

        if (type === "group") {
        } else {
        }
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
        const userName = user.userName;

        const chats = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userName }, { receiver: userName }],
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", userName] },
                            then: "$receiver",
                            else: "$sender",
                        },
                    },
                    lastMessage: { $first: "$$ROOT" },
                },
            },
            {
                $project: {
                    _id: 0,
                    chatPartner: "$_id",
                    lastMessage: "$lastMessage.content",
                    timestamp: "$lastMessage.createdAt",
                },
            },
        ]);

        res.json({ chats });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Ошибка на стороне сервера",
        });
    }
};
