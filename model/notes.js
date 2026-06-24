import mongoose from 'mongoose'

const { Schema } = mongoose

const NoteSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
            default: ''
        },
        originalName: {
            type: String,
            default: ''
        },
        fileSize: {
            type: Number,
            default: 0
        },
        cloudinaryId: {
            type: String,
            default: ''
        },
        rating: {
            type: Number,
            default: 0
        },
        ratingCount: {
            type: Number,
            default: 0
        },
        access: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        noteUrl: {
            type: String,
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        visibility: {
            type: String,
            enum: ['public', 'private', 'shared'],
            default: 'private'
        }
    },
    { timestamps: true }
)

export default mongoose.model('Note', NoteSchema)