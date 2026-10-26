const sessionMaxAgeMs = Number(process.env.SESSION_TTL_MS || 60 * 60 * 1000);

if (!Number.isSafeInteger(sessionMaxAgeMs) || sessionMaxAgeMs <= 0) {
  throw new Error('SESSION_TTL_MS must be a positive integer');
}

const configuredSecure = process.env.COOKIE_SECURE;
if (configuredSecure !== undefined && configuredSecure !== 'true' && configuredSecure !== 'false') {
  throw new Error('COOKIE_SECURE must be true or false');
}

const secure = process.env.NODE_ENV === 'production' || configuredSecure === 'true';

const cookieOptions = Object.freeze({
  httpOnly: true,
  sameSite: 'lax',
  secure,
  path: '/',
  maxAge: sessionMaxAgeMs,
  signed: true,
});

module.exports = { cookieOptions, sessionMaxAgeMs };
