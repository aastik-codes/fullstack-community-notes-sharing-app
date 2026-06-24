import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Unauthorized'
            })
        }

        const token = authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized'
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded.userID
        next()
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid Token'
        })
    }
}