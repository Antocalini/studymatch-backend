// src/middlewares/roles.js

/**
 * Middleware to authorize users based on their roles.
 * @param {Array<string>} roles - An array of roles that are allowed to access the route (e.g., ['admin', 'user']).
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // The `protect` middleware should run before this, populating `req.user`.
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied. User role not found.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. You do not have the required role.' });
    }

    next(); // User has the required role, proceed to the next middleware/controller
  };
};

export { authorize };