import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        note: {
            type: Schema.Types.ObjectId,
            ref: "Note",
            required: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        }
    },

);

export default mongoose.model("Comment", commentSchema);