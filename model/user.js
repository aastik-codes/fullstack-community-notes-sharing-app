import mongoose from 'mongoose'

const { Schema } = mongoose

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: /@/
        },
        password: {
            type: String,
            required: true
        },
        Rating: {
            type: Number,
            default: 0
        },
        Notes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Note'
            }
        ],
        token: {
            type: String
        },
        tokenExpiry: {
            type: Date
        }
    },
    { timestamps: true }
)

export default mongoose.model('User', userSchema)