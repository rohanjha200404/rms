const jwt = require('jsonwebtoken');
const config = require('../config');

function tokenFor(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: '8h' }
  );
}

module.exports = { tokenFor };
