import jwt from 'jsonwebtoken'
export const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const token = (req.headers.authorization).split(" ")[1];
        // Check if token exists
        if (!token) {
            return res.status(401).json({ // 401 means you are not authroized 
                message: "Unauthorized"
            });
        }
        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        // first checks if the token is real and created by my server 
        // decodes the content of the header body i.e payload and puts it inside the variable decoded in json
        req.user = decoded.userID; // storing the value os user id in req.user
        // Continue to protected route
        next(); // this tells express, security checked, run the actual route now 
    } catch (error) {
        return res.status(401).json({
            message: "Invalid Token"
        });
    }
};



