import notes from '../model/notes.js'
import user from '../model/user.js'

export async function AddAccess(req, res) {
    try {
        const noteId = req.body.noteId
        const email = req.body.email?.trim().toLowerCase()

        if (!noteId || !email) {
            return res.status(400).json({
                message: 'Note ID and email are required'
            })
        }

        const note = await notes.findById(noteId)

        if (!note || note.status !== 'active') {
            return res.status(404).json({
                message: 'Note not found'
            })
        }

        if (note.user.toString() !== req.user.toString()) {
            return res.status(403).json({
                message: 'Not owner'
            })
        }

        const foundUser = await user.findOne({ email })

        if (!foundUser) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (foundUser._id.toString() === req.user.toString()) {
            return res.status(400).json({
                message: 'You already own this note'
            })
        }

        const alreadyAdded = note.access.some(
            id => id.toString() === foundUser._id.toString()
        )

        if (alreadyAdded) {
            return res.status(400).json({
                message: 'User already has access'
            })
        }

        note.access.push(foundUser._id)
        await note.save()

        const updatedNote = await notes
            .findById(note._id)
            .populate('access', 'username email')

        res.status(200).json({
            message: 'Access added',
            access: updatedNote.access
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function RemoveAccess(req, res) {
    try {
        const noteId = req.body.noteId
        const email = req.body.email?.trim().toLowerCase()

        if (!noteId || !email) {
            return res.status(400).json({
                message: 'Note ID and email are required'
            })
        }

        const note = await notes.findById(noteId)

        if (!note || note.status !== 'active') {
            return res.status(404).json({
                message: 'Note not found'
            })
        }

        if (note.user.toString() !== req.user.toString()) {
            return res.status(403).json({
                message: 'Not owner'
            })
        }

        const foundUser = await user.findOne({ email })

        if (!foundUser) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        note.access = note.access.filter(
            id => id.toString() !== foundUser._id.toString()
        )

        await note.save()

        const updatedNote = await notes
            .findById(note._id)
            .populate('access', 'username email')

        res.status(200).json({
            message: 'Access removed',
            access: updatedNote.access
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function ChangeVisibility(req, res) {
    try {
        const noteId = req.body.noteId
        const visibility = req.body.visibility
        const allowed = ['public', 'private', 'shared']

        if (!noteId || !allowed.includes(visibility)) {
            return res.status(400).json({
                message: 'Valid note ID and visibility are required'
            })
        }

        const note = await notes.findById(noteId)

        if (!note || note.status !== 'active') {
            return res.status(404).json({
                message: 'Note not found'
            })
        }

        if (note.user.toString() !== req.user.toString()) {
            return res.status(403).json({
                message: 'Not owner'
            })
        }

        note.visibility = visibility
        await note.save()

        res.status(200).json({
            message: 'Visibility updated',
            visibility: note.visibility
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}