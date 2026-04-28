/**
 * requireAuth middleware — protects all API routes.
 * Returns 401 JSON if the user is not logged in.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({
    error: true,
    code: 'UNAUTHORIZED',
    message: 'You must be logged in to access this resource.'
  });
}

module.exports = { requireAuth };
