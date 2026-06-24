import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        noteUrl: {
            type: String,
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        rating: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },

        visibility: {
            type: String,
            enum: ["public", "private", "shared"],
            default: "private"
        },

        access: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Note", noteSchema);
