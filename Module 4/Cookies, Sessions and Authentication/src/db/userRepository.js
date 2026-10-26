const prisma = require('./prisma');

function findUserForLoginByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
}

function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}

module.exports = { findUserForLoginByEmail, findUserById };
