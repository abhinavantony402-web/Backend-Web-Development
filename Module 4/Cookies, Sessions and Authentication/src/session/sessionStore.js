const sessions = new Map();

function createSession(sessionId, userId, expiresAt) {
  sessions.set(sessionId, { userId, expiresAt });
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

function destroySession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = { createSession, getSession, destroySession };
