import Comment from '../model/comment.js'
import notes from '../model/notes.js'

export async function AddComment(req, res) {
    try {
        const noteId = req.body.noteId
        const message = req.body.message?.trim()

        if (!noteId || !message) {
            return res.status(400).json({
                message: 'Note ID and comment message are required'
            })
        }

        const note = await notes.findById(noteId)

        if (!note || note.status !== 'active') {
            return res.status(404).json({
                message: 'Note not found'
            })
        }

        const newComment = await Comment.create({
            user: req.user,
            note: noteId,
            message
        })

        const populatedComment = await Comment
            .findById(newComment._id)
            .populate('user', 'username email')

        res.status(201).json({
            message: 'Comment added',
            comment: {
                ...populatedComment.toObject(),
                isOwner: true
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function GetComments(req, res) {
    try {
        const noteId = req.body.noteId

        if (!noteId) {
            return res.status(400).json({
                message: 'Note ID is required'
            })
        }

        const comments = await Comment
            .find({ note: noteId })
            .populate('user', 'username email')
            .sort({ createdAt: 1 })
            .lean()

        const safeComments = comments.map(comment => ({
            ...comment,
            isOwner: comment.user?._id?.toString() === req.user.toString()
        }))

        res.status(200).json({
            totalComments: safeComments.length,
            comments: safeComments
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function DeleteComment(req, res) {
    try {
        const commentId = req.body.commentId

        if (!commentId) {
            return res.status(400).json({
                message: 'Comment ID is required'
            })
        }

        const comment = await Comment.findById(commentId)

        if (!comment) {
            return res.status(404).json({
                message: 'Comment not found'
            })
        }

        if (comment.user.toString() !== req.user.toString()) {
            return res.status(403).json({
                message: 'You can only delete your own comment'
            })
        }

        await Comment.findByIdAndDelete(commentId)

        res.status(200).json({
            message: 'Comment deleted'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }}