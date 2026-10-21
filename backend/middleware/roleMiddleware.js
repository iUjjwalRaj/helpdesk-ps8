// Restrict route access to specified user roles (e.g., 'support')
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };
