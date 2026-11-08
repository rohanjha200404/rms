const { randomInt, randomUUID } = require('crypto');

const captchaStore = new Map();

function createCaptcha() {
  const left = randomInt(2, 10);
  const right = randomInt(1, 9);
  const id = randomUUID();
  captchaStore.set(id, { answer: String(left + right), expiresAt: Date.now() + 5 * 60 * 1000 });
  return { id, question: `What is ${left} + ${right}?` };
}

function validCaptcha(id, answer) {
  const item = captchaStore.get(id);
  captchaStore.delete(id);
  return Boolean(item && item.expiresAt > Date.now() && item.answer === String(answer).trim());
}

module.exports = { createCaptcha, validCaptcha };
