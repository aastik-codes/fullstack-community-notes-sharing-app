import user from '../model/user.js'
import notes from '../model/notes.js'
import Rating from '../model/rating.js'

export async function Userprofile(req, res) {
    try {
        const currentUser = await user.findById(req.user)

        if (!currentUser) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const notesCount = await notes.countDocuments({
            user: req.user,
            status: 'active'
        })

        res.status(200).json({
            id: currentUser._id,
            username: currentUser.username,
            email: currentUser.email,
            rating: currentUser.Rating,
            notesCount
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function UpdateProfile(req, res) {
    try {
        const username = req.body.username?.trim()
        const email = req.body.email?.trim().toLowerCase()

        if (!username || !email) {
            return res.status(400).json({
                message: 'Username and email are required'
            })
        }

        if (!email.includes('@')) {
            return res.status(400).json({
                message: 'Invalid email'
            })
        }

        const emailOwner = await user.findOne({
            email,
            _id: { $ne: req.user }
        })

        if (emailOwner) {
            return res.status(400).json({
                message: 'Email already registered'
            })
        }

        const currentUser = await user.findByIdAndUpdate(
            req.user,
            { username, email },
            { new: true, runValidators: true }
        )

        if (!currentUser) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        res.status(200).json({
            message: 'Profile updated',
            user: {
                id: currentUser._id,
                username: currentUser.username,
                email: currentUser.email,
                rating: currentUser.Rating
            }
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

export async function Dashboard(req, res) {
    try {
        const currentUser = await user.findById(req.user)

        if (!currentUser) {
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const foundNotes = await notes
            .find({
                user: req.user,
                status: 'active'
            })
            .sort({ createdAt: -1 })
            .lean()

        const noteIds = foundNotes.map(note => note._id)

        const ratingCounts = noteIds.length
            ? await Rating.aggregate([
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
            : []

        const ratingCountMap = new Map(
            ratingCounts.map(item => [
                item._id.toString(),
                item.count
            ])
        )

        const notesWithCounts = foundNotes.map(note => ({
            ...note,
            ratingCount:
                ratingCountMap.get(note._id.toString()) || 0
        }))

        const counts = {
            public: 0,
            private: 0,
            shared: 0
        }

        notesWithCounts.forEach(note => {
            counts[note.visibility] += 1
        })

        const topRatedNote = [...notesWithCounts]
            .filter(note => Number(note.rating) > 0)
            .sort((a, b) => Number(b.rating) - Number(a.rating))[0] || null

        res.status(200).json({
            username: currentUser.username,
            rating: currentUser.Rating,
            totalNotes: notesWithCounts.length,
            counts,
            topRatedNote,
            recentNotes: notesWithCounts.slice(0, 4)
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: 'Server Error'
        })
    }
}