import notes from "../model/notes.js";
import user from "../model/user.js";

export async function uploadfile(req, res) {
    try {
        const User = await user.findById(req.user);

        if (!User) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        const visibility = req.body.visibility || "private";

        if (!["public", "private", "shared"].includes(visibility)) {
            return res.status(400).json({
                message: "Invalid visibility"
            });
        }

        let sharedEmails = [];

        if (req.body.sharedEmails) {
            try {
                sharedEmails = JSON.parse(req.body.sharedEmails);
            } catch {
                return res.status(400).json({
                    message: "Invalid shared users data"
                });
            }
        }

        if (!Array.isArray(sharedEmails)) {
            return res.status(400).json({
                message: "Shared users must be an array"
            });
        }

        const cleanEmails = [
            ...new Set(
                sharedEmails
                    .map(email => String(email).trim().toLowerCase())
                    .filter(Boolean)
            )
        ];

        let sharedUsers = [];

        if (cleanEmails.length > 0) {
            sharedUsers = await user.find({
                email: { $in: cleanEmails }
            });

            if (sharedUsers.length !== cleanEmails.length) {
                return res.status(400).json({
                    message: "One or more shared users were not found"
                });
            }
        }

        if (visibility === "shared" && sharedUsers.length === 0) {
            return res.status(400).json({
                message: "Select at least one user for shared visibility"
            });
        }

        const newNote = new notes({
            noteUrl: req.file.path,
            user: req.user,
            visibility,
            access: sharedUsers.map(foundUser => foundUser._id)
        });

        await newNote.save();

        User.Notes.push(newNote._id);
        await User.save();

        const populatedNote = await notes
            .findById(newNote._id)
            .populate("access", "username email")
            .populate("user", "username email");

        res.status(201).json({
            message: "Upload successful",
            note: populatedNote
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message || "Server Error"
        });
    }
}

export async function GetNotesAll(req, res) {
    try {
        const foundNotes = await notes
            .find({
                user: req.user,
                status: "active"
            })
            .populate("access", "username email")
            .sort({ createdAt: -1 });

        res.status(200).json(foundNotes);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function GetNotesone(req, res) {
    try {
        const note = await notes
            .findById(req.params.id)
            .populate("user", "username email")
            .populate("access", "username email");

        if (!note || note.status !== "active") {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        res.status(200).json(note);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function DeleteOne(req, res) {
    try {
        const note = await notes.findOne({
            _id: req.params.id,
            user: req.user
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        note.status = "inactive";
        await note.save();

        res.status(200).json({
            message: "Note deleted"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function GetReceivedNotes(req, res) {
    try {
        const receivedNotes = await notes
            .find({
                access: req.user,
                visibility: "shared",
                status: "active"
            })
            .populate("user", "username email")
            .sort({ createdAt: -1 });

        res.status(200).json(receivedNotes);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function SearchNotes(req, res) {
    try {
        const {
            search,
            sort,
            page = 1,
            limit = 6
        } = req.query;

        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(
            Math.max(Number(limit) || 6, 1),
            50
        );

        let noteFilter = {
            visibility: "public",
            status: "active"
        };

        if (search) {
            const foundUsers = await user.find({
                $or: [
                    {
                        username: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        email: {
                            $regex: search,
                            $options: "i"
                        }
                    }
                ]
            });

            const userIds = foundUsers.map(
                currentUser => currentUser._id
            );

            if (userIds.length === 0) {
                return res.status(200).json({
                    currentPage: pageNumber,
                    totalPages: 0,
                    totalNotes: 0,
                    notes: []
                });
            }

            noteFilter.user = { $in: userIds };
        }

        let sortOption = { createdAt: -1 };

        if (sort === "highest") sortOption = { rating: -1 };
        if (sort === "lowest") sortOption = { rating: 1 };
        if (sort === "newest") sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };

        const totalNotes = await notes.countDocuments(noteFilter);

        const foundNotes = await notes
            .find(noteFilter)
            .populate("user", "username email")
            .sort(sortOption)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        res.status(200).json({
            currentPage: pageNumber,
            totalPages: Math.ceil(totalNotes / limitNumber),
            totalNotes,
            notes: foundNotes
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}
