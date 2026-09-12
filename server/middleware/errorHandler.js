// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('[Error Logger]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  // Custom Application Errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { errorDetails: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(require('path').join(__dirname, '../../public/404.html'));
  }
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
