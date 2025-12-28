// const jwt = require('jsonwebtoken');

// module.exports = function (req, res, next) {
//     const authHeader = req.header('Authorization');
//     if (!authHeader) {
//         return res.status(401).json({ msg: 'No token, authorization denied' });
//     }

//     // Check if the token is in the correct 'Bearer <token>' format
//     const parts = authHeader.split(' ');
//     if (parts.length !== 2 || parts[0] !== 'Bearer') {
//         return res.status(401).json({ msg: 'Token is not valid' });
//     }
//     const token = parts[1];

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded.user;
//         next();
//     } catch (err) {
//         res.status(401).json({ msg: 'Token is not valid' });
//     }
// };

// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
    const token = (req.cookies && req.cookies.token) || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Set the full user object from the token
        if (!decoded.user) {
            throw new Error('Invalid token format: user data missing');
        }
        req.user = decoded.user;  // This should be the full user object
        return next();
    } catch (err) {
        if (err && err.name === 'TokenExpiredError') {
            console.info('[auth] JWT expired for token preview:', String(token).slice(0, 24));
            return res.status(401).json({ 
                msg: 'Token expired', 
                code: 'TOKEN_EXPIRED' 
            });
        }
        console.warn('[auth] JWT verification failed:', err && (err.name || err.message));
        return res.status(401).json({ 
            msg: 'Token is not valid',
            error: err.message 
        });
    }
};
