import notes from "../model/notes.js";
import user from "../model/user.js";

export async function AddAccess(req, res) {
    try {
        const { noteId, email } = req.body;

        const note = await notes.findById(noteId);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        if (note.user.toString() !== req.user.toString()) {
            return res.status(403).json({
                message: "Not owner"
            });
        }

        const foundUser = await user.findOne({
            email: email.trim().toLowerCase()
        });

        if (!foundUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (foundUser._id.toString() === req.user.toString()) {
            return res.status(400).json({
                message: "You cannot share a note with yourself"
            });
        }

        const alreadyAdded = note.access.some(
            id => id.toString() === foundUser._id.toString()
        );

        if (!alreadyAdded) {
            note.access.push(foundUser._id);
        }

        note.visibility = "shared";

        await note.save();

        res.status(200).json({
            message: alreadyAdded
                ? "User already has access"
                : "Access added"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function RemoveAccess(req, res) {
    try {
        const { noteId, email } = req.body;

        const note = await notes.findById(noteId);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        if (note.user.toString() !== req.user.toString()) {
            return res.status(403).json({
                message: "Not owner"
            });
        }

        const foundUser = await user.findOne({
            email: email.trim().toLowerCase()
        });

        if (!foundUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        note.access = note.access.filter(
            id => id.toString() !== foundUser._id.toString()
        );

        await note.save();

        res.status(200).json({
            message: "Access removed"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function ChangeVisibility(req, res) {
    try {
        const { noteId, visibility } = req.body;

        if (!["public", "private", "shared"].includes(visibility)) {
            return res.status(400).json({
                message: "Invalid visibility"
            });
        }

        const note = await notes.findById(noteId);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        if (note.user.toString() !== req.user.toString()) {
            return res.status(403).json({
                message: "Not owner"
            });
        }

        note.visibility = visibility;

        await note.save();

        res.status(200).json({
            message: "Visibility updated",
            visibility: note.visibility
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}
