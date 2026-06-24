import notes from "../model/notes.js";

export async function canAccessNote(req, res, next) {
    try {
        const noteId =
            req.body.noteId ||
            req.params.id ||
            req.query.noteId;

        if (!noteId) {
            return res.status(400).json({
                message: "Note ID is required"
            });
        }

        const note = await notes.findById(noteId);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        const isOwner =
            note.user.toString() === req.user.toString();

        const isPublic =
            note.visibility === "public";

        const isShared =
            note.visibility === "shared" &&
            note.access.some(
                id => id.toString() === req.user.toString()
            );

        if (!isOwner && !isPublic && !isShared) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        req.note = note;

        next();

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}
