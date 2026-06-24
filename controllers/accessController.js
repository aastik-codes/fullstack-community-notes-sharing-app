import notes from '../model/notes.js'
import user from '../model/user.js'


export async function AddAccess(req,res){

    try{
        const { noteId , email } = req.body


        const note = await notes.findById(noteId)

        if(!note){
            return res.status(404).send("Note not found")
        } // 404 -> server speicific request kiya  hua resource nahi dhund paya


        if(note.user !== req.user){
            return res.status(403).send("Not owner")
        } // forbidden from requesting that data


        const User = await user.findOne({email})

        if(!User){
            return res.status(404).send("User not found")
        }
        if(note.access.includes(User._id)){
            return res.send("User already has access")
        }
        note.access.push(User._id)
        await note.save()
        res.send("Access added")
    }catch(err){
        console.error(err)
        res.status(500).send("Server Error")
    }

}



export async function RemoveAccess(req,res){

    try{

        const { noteId , email } = req.body

        const note = await notes.findById(noteId)

        if(!note){
            return res.status(404).send("Note not found")
        }
        if(note.user.toString() !== req.user){
            return res.status(403).send("Not owner")
        }
        const User = await user.findOne({email})

        if(!User){
            return res.status(404).send("User not found")
        }

        note.access = note.access.filter(
            id => id.toString() !== User._id.toString()
        )

        await note.save()

        res.send("Access removed")

    }catch(err){

        console.error(err)

        res.status(500).send("Server Error")

    }

}



export async function ChangeVisibility(req,res){

    try{

        const { noteId , visibility } = req.body

        const note = await notes.findById(noteId)

        if(!note){
            return res.status(404).send("Note not found")
        }
// sirf owner visiblity change kar sakta hai 
        if(note.user.toString() !== req.user){
            return res.status(403).send("Not owner")
        }

        note.visibility = visibility

        await note.save()

        res.send("Visibility updated")

    }catch(err){

        console.error(err)

        res.status(500).send("Server Error")

    }

}