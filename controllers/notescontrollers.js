import notes from '../model/notes.js'
import cloudinary from '../config/cloudinary.js'
import upload from '../config/multer.js';
import user from '../model/user.js';


export async function uploadfile(req,res){
    const User = await user.findById(req.user)
    try {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }


    
    let newNotes = new notes({
        noteUrl: req.file.path,
        user: req.user
    })
    await newNotes.save()
    User.Notes.push(newNotes._id)
    await User.save()
    
        res.status(200).json({
        message: 'Upload successful',
        url: req.file.path,       // Cloudinary secure URL
        public_id: req.file.filename,
    });

    } catch (err) {
    res.status(500).json({ error: err.message });
    }
}


export async function GetNotesAll(req,res){
    const User = await user.findById(req.user).populate("Notes");

    let a = []

    for (let note of User.Notes){
        if(note.status === "active"){
            a.push(note.noteUrl)
        }
    }

    res.send(a)
}

export async function GetNotesone(req,res){
    try{
        const note = await notes.findOne({
            _id: req.body.noteId,
            user: req.user,
            status: "active"
        });

        if(!note){
            return res.send()
        }

        res.send(note)

    }catch(err){
        console.error(err)
    }
}



export async function DeleteOne(req,res){
    try{

        const note = await notes.findOne({
            _id: req.body.noteId,
            user: req.user
        });
        if(!note){
            return res.status(404).send("Note not found");
        }
        note.status = "inactive";
        await note.save();

        res.send("Note deleted");
    }catch(err){
        console.error(err);
        res.status(500).send("Server Error");
    }
}