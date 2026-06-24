import mongoose from 'mongoose'

const { Schema } = mongoose

const ratingSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        note: {
            type: Schema.Types.ObjectId,
            ref: 'Note',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    },
    { timestamps: true }
)

ratingSchema.index(
    {
        user: 1,
        note: 1
    },
    {
        unique: true
    }
)

export default mongoose.model('Rating', ratingSchema)
