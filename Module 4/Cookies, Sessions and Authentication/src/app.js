require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');

if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 32) {
  throw new Error('COOKIE_SECRET must contain at least 32 characters');
}

const app = express();
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use('/auth', authRoutes);
app.use((error, req, res, next) => {
  console.error(error.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening on ${port}`));
