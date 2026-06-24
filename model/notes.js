import mongoose from 'mongoose'

const { Schema } = mongoose

const NoteSchema = new Schema(
    {
        rating: {
            type: Number,
            default: 0
        },

        access: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        noteUrl: {
            type: String,
            required: true
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
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
        }
    },
{ timestamps: true });


export default mongoose.model("Note", NoteSchema)