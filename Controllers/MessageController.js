import Message from "../Models/Message.js";
import User from "../Models/User.js";

export const getMessages = async (req, res) => {
    try {
        const id = req.userId;

        const { type, page, receiver } = req.body;

        const limit = 20;
        const skip = (page - 1) * limit;

        if (type === "group") {
            const messages = await Message.find({ type: "group" })
                .populate("sender")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            res.json({
                messages,
            });
        } else {
            const messages = await Message.find({
                $or: [
                    { sender: id, receiver },
                    { sender: receiver, receiver: id },
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

        res.json({ chats });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Ошибка на стороне сервера",
        });
    }
};
