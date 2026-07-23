// Assumes the shared AuthMiddleware.js already ran and attached req.user
// from the decoded JWT (e.g. req.user = { id, email, role }).
// Chain this AFTER the shared auth middleware on protected routes.

function requireOfficerRole(req, res, next) {
  if (!req.user) {
    const err = { status: 401, message: "Authentication required" };
    return res.status(err.status).json({ error: err.message });
  }

  if (req.user.role !== "officer") {
    return res.status(403).json({ error: "Only NEA officers can perform this action" });
  }

  next();
}

module.exports = requireOfficerRole;