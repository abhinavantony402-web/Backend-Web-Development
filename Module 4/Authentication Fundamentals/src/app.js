require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const { HttpError } = require('./services/authService');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use((error, req, res, next) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message }
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON' }
    });
  }

  if (error.status === 413 || error.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' }
    });
  }

  if (error.statusCode && error.statusCode < 500) {
    return res.status(error.statusCode).json({
      error: { code: 'INVALID_REQUEST', message: 'Invalid request' }
    });
  }

  console.error('Request failed unexpectedly');
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  return res.status(status).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API listening on ${port}`));
}

module.exports = app;
