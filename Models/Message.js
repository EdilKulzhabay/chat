import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
    {
        content: {
            type: String,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        readBy: [String],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Message", MessageSchema);
