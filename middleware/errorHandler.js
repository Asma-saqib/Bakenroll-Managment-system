/**
 * Global error handler middleware.
 * Must be registered LAST in server.js.
 */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: true,
      code: 'DUPLICATE_ENTRY',
      message: 'A record with that value already exists.'
    });
  }

  // MySQL foreign key violation
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: true,
      code: 'FOREIGN_KEY_VIOLATION',
      message: 'This record is linked to other data and cannot be deleted, or the referenced record does not exist.'
    });
  }

  // Validation errors thrown manually
  if (err.status === 400) {
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: err.message || 'Invalid request data.'
    });
  }

  // Default 500
  return res.status(500).json({
    error: true,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong on the server. Please try again.'
  });
}

module.exports = errorHandler;
