const express = require('express');
const { createCaptcha } = require('../utils/captcha');

const router = express.Router();
router.get('/', (_req, res) => res.json(createCaptcha()));

module.exports = router;
