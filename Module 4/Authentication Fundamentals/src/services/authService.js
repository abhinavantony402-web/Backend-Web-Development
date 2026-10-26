const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const INVALID_CREDENTIALS = {
  code: 'INVALID_CREDENTIALS',
  message: 'Invalid email or password'
};

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireFields(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Request body must be an object');
  }

  for (const field of fields) {
    const value = body[field];
    if (typeof value !== 'string' || value.length === 0 || (field !== 'password' && value.trim().length === 0)) {
      throw new HttpError(400, 'INVALID_REQUEST', `A non-empty ${field} is required`);
    }
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function serializeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function getBcryptCost() {
  const cost = Number(process.env.BCRYPT_COST || 12);
  if (!Number.isInteger(cost) || cost < 4 || cost > 31) {
    throw new Error('BCRYPT_COST must be an integer between 4 and 31');
  }
  return cost;
}

async function register(body) {
  requireFields(body, ['name', 'email', 'password']);

  const email = normalizeEmail(body.email);
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(body.password, getBcryptCost());
  try {
    const user = await userRepository.create({
      name: body.name.trim(),
      email,
      passwordHash
    });
    return serializeUser(user);
  } catch (error) {
    if (error.code === 'P2002') {
      throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
    }
    throw error;
  }
}

async function login(body) {
  requireFields(body, ['email', 'password']);

  const user = await userRepository.findByEmail(normalizeEmail(body.email));
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new HttpError(401, INVALID_CREDENTIALS.code, INVALID_CREDENTIALS.message);
  }

  return serializeUser(user);
}

module.exports = { register, login, HttpError };
