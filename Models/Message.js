import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
    {
        content: {
            type: String,
        },
        sender: {
            type: String,
        },
        type: {
            type: String,
        },
        receiver: {
            type: String,
        },
        readBy: [String],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Message", MessageSchema);
