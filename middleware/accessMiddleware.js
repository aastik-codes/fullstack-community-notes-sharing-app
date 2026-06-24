import mongoose from "mongoose";
import notes from "../model/notes.js";

export async function canAccessNote(req, res, next) {
    try {
        const noteId =
            req.params.id ||
            req.body.noteId ||
            req.query.noteId;

        if (!noteId) {
            return res.status(400).json({
                message: "Note ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return res.status(400).json({
                message: "Invalid note ID"
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

        const accessList = Array.isArray(note.access)
            ? note.access
            : [];

        const isShared =
            note.visibility === "shared" &&
            accessList.some(
                userId =>
                    userId.toString() === req.user.toString()
            );

        if (!isOwner && !isPublic && !isShared) {
            return res.status(403).json({
                message: "You do not have access to this note"
            });
        }

        req.note = note;

        next();

    } catch (error) {
        console.error("Access middleware error:", error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}