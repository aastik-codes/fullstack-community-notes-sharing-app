import user from "../model/user.js"


export async function Userprofile(req,res){
        const User  = await user.findById(req.user)
        res.json([User.username,User.email,User.Rating,User.Notes])
}


export async function UpdateProfile(req,res){
        const User = await user.findById(req.user)
        User.username = req.body.username;

        if (req.body.email.includes("@")){
                User.email = req.body.email
                User.save()
                res.send("changed name and email")
        }else{
                res.status(400).json({
                        message:"INVALID EMAIL"
                })
        }
}

export async function Dashboard(req,res){
        const User = await user.findById(req.user)
        let  a = {
                "Notes Uploaded" : User.Notes.length,
                "Rating": User.Rating
        }
        res.send(a)
}
