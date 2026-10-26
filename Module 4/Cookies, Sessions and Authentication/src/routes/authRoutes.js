const express = require('express');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const userRepository = require('../db/userRepository');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');
const { cookieOptions, sessionMaxAgeMs } = require('../config/auth');

const router = express.Router();

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function rejectUnauthenticated(res) {
  return res.status(401).json({
    error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password' },
  });
}

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  if (
    typeof email !== 'string'
    || typeof password !== 'string'
    || email.trim().length === 0
    || email.trim().length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    || Buffer.byteLength(password, 'utf8') === 0
    || Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: { code: 'INVALID_REQUEST', message: 'A valid email and password are required' },
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findUserForLoginByEmail(normalizedEmail);
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) return rejectUnauthenticated(res);

    const sessionId = randomBytes(32).toString('base64url');
    sessionStore.createSession(sessionId, user.id, Date.now() + sessionMaxAgeMs);
    res.cookie('sid', sessionId, cookieOptions);
    return res.status(200).json({ user: safeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireSession, (req, res) => {
  res.status(200).json({ user: req.user });
});

router.post('/logout', (req, res) => {
  const sessionId = req.signedCookies.sid;
  if (typeof sessionId === 'string') sessionStore.destroySession(sessionId);
  res.clearCookie('sid', cookieOptions);
  return res.status(204).end();
});

module.exports = router;
