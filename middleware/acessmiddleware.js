import notes from '../model/notes.js'


export async function canAccessNote(req,res,next){

    try{

        const note = await notes.findById(req.body.noteId)

        if(!note){
            return res.status(404).send("Note not found")
        }

        if(note.user  === req.user){

            req.note = note

            return next()
        }

        if(note.visibility === "public"){

            req.note = note

            return next()
        }

        if(
            note.visibility === "shared" &&
            note.access.some(
                id => id.toString() === req.user
            )
        ){

            req.note = note

            return next()
        }


        return res.status(403).send("Access denied")

    }catch(err){

        console.error(err)

        res.status(500).send("Server Error")

    }

}