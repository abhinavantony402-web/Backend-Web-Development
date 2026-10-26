const userRepository = require('../db/userRepository');
const sessionStore = require('../session/sessionStore');

function rejectUnauthenticated(res) {
  return res.status(401).json({
    error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
  });
}

module.exports = function requireSession(req, res, next) {
  const sessionId = req.signedCookies.sid;
  if (typeof sessionId !== 'string') return rejectUnauthenticated(res);

  const session = sessionStore.getSession(sessionId);
  if (!session) return rejectUnauthenticated(res);

  return userRepository.findUserById(session.userId)
    .then((user) => {
      if (!user) {
        sessionStore.destroySession(sessionId);
        return rejectUnauthenticated(res);
      }

      req.user = user;
      next();
    })
    .catch(next);
};
