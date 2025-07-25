import { verifyJWT } from "../utils/auth.js";

/**
 * Middleware to authenticate JWT tokens
 * Adds user info to req.user if token is valid
 */
export function authenticateToken(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    // Verify the token and get user data
    const decoded = verifyJWT(token);

    // Add user info to request object for use in other routes
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };

    // Continue to the next middleware/route
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

/**
 * Optional middleware - authenticate if token provided, but don't require it
 * Useful for routes that work for both authenticated and non-authenticated users
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // No token provided, continue without user info
    req.user = null;
    return next();
  }

  try {
    // Token provided, try to verify it
    const decoded = verifyJWT(token);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };
    next();
  } catch (error) {
    // Invalid token, but we don't require auth, so continue without user info
    req.user = null;
    next();
  }
}
