const jwt = require('jsonwebtoken');

/**
 * Generate a JWT for a user id
 * @param {string|number} userId
 * @returns {string} signed JWT
 */
function generateJWT(userId) {
	// uses JWT_SECRET from .env
	return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
		expiresIn: '7d', // adjust as needed
	});
}

/**
 * Return a safe user object for responses by removing sensitive fields.
 * Accepts plain objects or ORM instances (with toJSON).
 */
function sanitizeUser(user) {
	if (!user) return null;
	// If it's an ORM instance, convert to plain object first
	let u = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
	// Remove common sensitive fields
	delete u.password;
	delete u.resetToken;
	delete u.resetPasswordExpires;
	// remove any other sensitive props your model has
	return u;
}

/**
 * Set token cookie and send minimal JSON response.
 * Use in login/signup controllers after validating/creating the user.
 */
function sendTokenAsCookie(res, token, userObj) {
	const cookieOptions = {
		httpOnly: true,
		secure: process.env.COOKIE_SECURE === 'true', // false in dev by default
		sameSite: process.env.SESSION_SAMESITE || 'lax',
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	};

	// cookie name 'token' — change if your frontend expects a different name
	res.cookie('token', token, cookieOptions);

	// send sanitized user back
	return res.status(200).json({ success: true, user: sanitizeUser(userObj) });
}

// Example sign-in / sign-up handler
async function loginController(req, res, next) {
	// ...existing code: validate credentials, create token, fetch user...
	const token = generateJWT(foundUser.id);              // <-- replaces placeholder
	return sendTokenAsCookie(res, token, foundUser);      // <-- replaces placeholder
}

module.exports = {
	// ...existing exports...
	generateJWT,
	sanitizeUser,
	sendTokenAsCookie,
	loginController,
};