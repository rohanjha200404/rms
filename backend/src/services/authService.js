const bcrypt = require('bcryptjs');
const { User } = require('../db');
const { validCaptcha } = require('../utils/captcha');
const { tokenFor } = require('../utils/token');

async function register({ name, email, password, captchaId, captchaAnswer }) {
  if (!name || !email || !password || password.length < 8 || !validCaptcha(captchaId, captchaAnswer)) {
    const error = new Error('Provide valid details and solve the CAPTCHA correctly.');
    error.status = 400;
    throw error;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash });
  return { token: tokenFor(user), user: { name: user.name, email: user.email } };
}

async function login({ email, password, captchaId, captchaAnswer }) {
  if (!email || !password || !validCaptcha(captchaId, captchaAnswer)) {
    const error = new Error('Invalid credentials or CAPTCHA.');
    error.status = 400;
    throw error;
  }
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error('Email or password is incorrect.');
    error.status = 401;
    throw error;
  }
  return { token: tokenFor(user), user: { name: user.name, email: user.email } };
}

function forgotPassword({ email, captchaId, captchaAnswer }) {
  if (!email || !validCaptcha(captchaId, captchaAnswer)) {
    const error = new Error('Provide a valid email and CAPTCHA.');
    error.status = 400;
    throw error;
  }
  return { message: 'If that email is registered, reset instructions will be sent shortly.' };
}

module.exports = { register, login, forgotPassword };
