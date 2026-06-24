import user from "../model/user.js";

export async function Userprofile(req, res) {
    try {
        const User = await user
            .findById(req.user)
            .select("username email Rating Notes");

        if (!User) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json(User);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function UpdateProfile(req, res) {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({
                message: "Username and email are required"
            });
        }

        if (!email.includes("@")) {
            return res.status(400).json({
                message: "Invalid email"
            });
        }

        const emailOwner = await user.findOne({
            email: email,
            _id: { $ne: req.user }
        });

        if (emailOwner) {
            return res.status(400).json({
                message: "Email already in use"
            });
        }

        const User = await user.findById(req.user);

        if (!User) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        User.username = username.trim();
        User.email = email.trim().toLowerCase();

        await User.save();

        res.status(200).json({
            message: "Profile updated",
            user: {
                username: User.username,
                email: User.email,
                Rating: User.Rating,
                Notes: User.Notes
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function Dashboard(req, res) {
    try {
        const User = await user.findById(req.user);

        if (!User) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            "Notes Uploaded": User.Notes.length,
            "Rating": User.Rating
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}

export async function FindUserByEmail(req, res) {
    try {
        const email = req.query.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const foundUser = await user
            .findOne({ email })
            .select("_id username email");

        if (!foundUser) {
            return res.status(404).json({
                message: "No user found"
            });
        }

        if (foundUser._id.toString() === req.user.toString()) {
            return res.status(400).json({
                message: "You cannot share a note with yourself"
            });
        }

        res.status(200).json(foundUser);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
}
