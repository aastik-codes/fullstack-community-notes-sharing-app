import notes from '../model/notes.js'   
import upload from '../config/multer.js' 
import user from '../model/user.js'      
export async function uploadfile(req, res) {
    try {
        const User = await user.findById(req.user); 
        
        if (!User) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!req.file) { // multer apne aap req.file ko set karta hai
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let newNotes = new notes({
            noteUrl: req.file.path,   // multer yeh wala path deta hai after upload 
            user: req.user          
        });
        await newNotes.save(); // yahan new notes.id automatically generate horhi
        User.Notes.push(newNotes._id); 
        await User.save(); 

        res.status(200).json({
            message: 'Upload successful',
            url: req.file.path,        
            public_id: req.file.filename  // yeh dono cheeze bhi maine multer ke function se nikali hai
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function GetNotesAll(req, res) {
    try {
        const User = await user.findById(req.user).populate("Notes"); 

        if (!User) {
            return res.status(404).json({ error: 'User not found' });
        }

        let a = [];

        for (let note of User.Notes) { 
            if (note.status === "active") {
                a.push(note.noteUrl); 
            }
        }

        res.send(a);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function GetNotesone(req, res) {
    try {
        const note = await notes.findOne({
            _id: req.params.id, // yahan paramameter wale routes use karne jaise  /note/:id
            user: req.user      
        });

        if (!note) {
            return res.status(404).send("Note not found");
        }

        res.send(note);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export async function DeleteOne(req, res) {
    try {
        const note = await notes.findOne({
            _id: req.body.noteId, 
            user: req.user       
        });

        if (!note) {
            return res.status(404).send("Note not found");
        }

        note.status = "inactive"; 
        await note.save();

        res.send("Note deleted");

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
}