import notes from '../model/notes.js'
import user from '../model/user.js'
import Rating from '../model/rating.js'

const allowedVisibility = ['public', 'private', 'shared']

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function attachRatingCounts(noteDocuments) {
    const noteIds = noteDocuments.map(note => note._id)

    if (!noteIds.length) {
        return []
    }

    const counts = await Rating.aggregate([
        {
            $match: {
                note: { $in: noteIds }
            }
        },
        {
            $group: {
                _id: '$note',
                count: { $sum: 1 }
            }
        }
    ])

    const countMap = new Map(
        counts.map(item => [item._id.toString(), item.count])
    )

    return noteDocuments.map(note => ({
        ...note.toObject(),
        ratingCount: countMap.get(note._id.toString()) || 0
    }))
}

export async function uploadfile(req, res) {
    try {
        const currentUser = await user.findById(req.user)

        if (!currentUser) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'No file uploaded'
            })
        }

        const requestedVisibility = req.body.visibility
        const visibility = allowedVisibility.includes(requestedVisibility)
            ? requestedVisibility
            : 'private'

        const newNote = await notes.create({
            title: req.body.title?.trim() || '',
            originalName: req.file.originalname || '',
            fileSize: req.file.size || Number(req.body.fileSize) || 0,
            cloudinaryId: req.file.filename || '',
            noteUrl: req.file.path,
            user: req.user,
            visibility
        })

        currentUser.Notes.push(newNote._id)
        await currentUser.save()

        const populatedNote = await notes
            .findById(newNote._id)
            .populate('user', 'username email Rating')
            .populate('access', 'username email')

        res.status(201).json({
            message: 'Upload successful',
            note: populatedNote
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Upload failed',
            error: err.message
        })
    }
}

export async function GetNotesAll(req, res) {
    try {
        const foundNotes = await notes
            .find({
                user: req.user,
                status: 'active'
            })
            .populate('user', 'username email Rating')
            .populate('access', 'username email')
            .sort({ createdAt: -1 })

        const notesWithCounts = await attachRatingCounts(foundNotes)

        res.status(200).json({
            totalNotes: notesWithCounts.length,
            notes: notesWithCounts
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function GetNotesone(req, res) {
    try {
        const noteId = req.params.id
        const note = await notes
            .findById(noteId)
            .populate('user', 'username email Rating')
            .populate('access', 'username email')

        if (!note || note.status !== 'active') {
            return res.status(404).json({
                message: 'Note not found'
            })
        }

        const ratingDocs = await Rating.find({ note: noteId }).select('rating')
        const myRatingDoc = await Rating.findOne({
            note: noteId,
            user: req.user
        })

        const ratingBreakdown = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        }

        ratingDocs.forEach(item => {
            ratingBreakdown[item.rating] += 1
        })

        res.status(200).json({
            ...note.toObject(),
            ratingCount: ratingDocs.length,
            myRating: myRatingDoc?.rating || 0,
            ratingBreakdown
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function DeleteOne(req, res) {
    try {
        const noteId = req.body.noteId || req.body.noteID

        if (!noteId) {
            return res.status(400).json({
                message: 'Note ID is required'
            })
        }

        const note = await notes.findOne({
            _id: noteId,
            user: req.user,
            status: 'active'
        })

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            })
        }

        note.status = 'inactive'
        await note.save()

        const currentUser = await user.findByIdAndUpdate(
            req.user,
            {
                $pull: { Notes: note._id }
            },
            { new: true }
        )

        const remainingRatedNotes = await notes.find({
            user: req.user,
            status: 'active',
            rating: { $gt: 0 }
        }).select('rating')

        const updatedUserRating = remainingRatedNotes.length
            ? remainingRatedNotes.reduce(
                (sum, item) => sum + Number(item.rating || 0),
                0
            ) / remainingRatedNotes.length
            : 0

        if (currentUser) {
            currentUser.Rating = Number(updatedUserRating.toFixed(2))
            await currentUser.save()
        }

        res.status(200).json({
            message: 'Note deleted'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function SearchNotes(req, res) {
    try {
        const {
            search = '',
            sort = 'highest',
            page = 1,
            limit = 5
        } = req.query

        const pageNumber = Math.max(Number(page) || 1, 1)
        const limitNumber = Math.min(Math.max(Number(limit) || 5, 1), 50)

        const filter = {
            visibility: 'public',
            status: 'active'
        }

        if (search.trim()) {
            const expression = new RegExp(escapeRegex(search.trim()), 'i')

            const foundUsers = await user.find({
                $or: [
                    { username: expression },
                    { email: expression }
                ]
            }).select('_id')

            const userIds = foundUsers.map(item => item._id)

            filter.$or = [
                { user: { $in: userIds } },
                { title: expression },
                { originalName: expression }
            ]
        }

        const sortOptions = {
            highest: { rating: -1, createdAt: -1 },
            lowest: { rating: 1, createdAt: -1 },
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 }
        }

        const sortOption = sortOptions[sort] || sortOptions.highest
        const totalNotes = await notes.countDocuments(filter)

        const foundNotes = await notes
            .find(filter)
            .populate('user', 'username email Rating')
            .sort(sortOption)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)

        const notesWithCounts = await attachRatingCounts(foundNotes)

        res.status(200).json({
            currentPage: pageNumber,
            totalPages: Math.ceil(totalNotes / limitNumber),
            totalNotes,
            notes: notesWithCounts
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}