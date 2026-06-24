import notes from '../model/notes.js'

export async function canAccessNote(req, res, next) {
    try {
        const noteId =
            req.params.id ||
            req.body?.noteId ||
            req.query?.noteId

        if (!noteId) {
            return res.status(400).json({
                message: 'Note ID is required'
            })
        }

        const note = await notes.findById(noteId)

        if (!note || note.status !== 'active') {
            return res.status(404).json({
                message: 'Note not found'
            })
        }

        const isOwner = note.user.toString() === req.user.toString()
        const isPublic = note.visibility === 'public'
        const isSharedWithUser =
            note.visibility === 'shared' &&
            note.access.some(id => id.toString() === req.user.toString())

        if (!isOwner && !isPublic && !isSharedWithUser) {
            return res.status(403).json({
                message: 'Access denied'
            })
        }

        req.note = note
        next()
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}