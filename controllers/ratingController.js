import Rating from "../model/rating.js";
import notes from "../model/notes.js";
import user from "../model/user.js";

export async function RateNote(req, res) {
    try {
        const { noteId, rating } = req.body;
        if (!noteId || rating === undefined) {
            return res.status(400).json({
                error: "Note ID and rating are required"
            });
        }
        if (
            typeof rating !== "number" ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be a whole number between 1 and 5"
            });
        }

        const note = await notes.findById(noteId);

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }
        // agar exist karti hai toh find the existing rating jo iss user ne di hai pehle 
        let savedRating = await Rating.findOne({
            user: req.user,
            note: noteId
        });

        if (savedRating) {
            // agar mil gayi toh usse update kar rha 
            savedRating.rating = rating;
            await savedRating.save();
        } else {
            // nahi milli toh new rating 
            savedRating = new Rating({
                user: req.user,
                note: noteId,
                rating: rating
            });

            await savedRating.save();
        }

        // finding average rating 
        const noteRatings = await Rating.find({
            note: noteId
        });

        let noteRatingTotal = 0;

        for (let currentRating of noteRatings) {
            noteRatingTotal += currentRating.rating;
        }

        const noteAverageRating =
            noteRatings.length > 0
                ? noteRatingTotal / noteRatings.length
                : 0;

        // Store average rating in the note
        note.rating = Number(noteAverageRating.toFixed(2));

        await note.save();

        // Find all notes uploaded by the owner of this note
        const ownerNotes = await notes.find({
            user: note.user,
            status: "active"
        });

        let userRatingTotal = 0;

        for (let ownerNote of ownerNotes) {
            userRatingTotal += ownerNote.rating;
        }

        const userAverageRating =
            ownerNotes.length > 0
                ? userRatingTotal / ownerNotes.length
                : 0;

        // Update note owner's rating
        const noteOwner = await user.findById(note.user);

        if (noteOwner) {
            noteOwner.Rating = Number(userAverageRating.toFixed(2));
            await noteOwner.save();
        }

        res.status(200).json({
            message: savedRating.createdAt.getTime() === savedRating.updatedAt.getTime()
                ? "Rating saved"
                : "Rating updated",

            rating: savedRating.rating,
            noteAverageRating: note.rating,
            userAverageRating: noteOwner ? noteOwner.Rating : 0
        });

    } catch (err) {
        console.error(err);

        if (err.code === 11000) {
            return res.status(400).json({
                message: "You have already rated this note"
            });
        }

        res.status(500).json({
            message: "Server Error"
        });
    }
}