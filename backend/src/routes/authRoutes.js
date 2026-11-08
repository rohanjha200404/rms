const express = require('express');
const authService = require('../services/authService');

const router = express.Router();
router.post('/register', async (req, res, next) => {
  try { res.status(201).json(await authService.register(req.body)); } catch (error) { next(error); }
});
router.post('/login', async (req, res, next) => {
  try { res.json(await authService.login(req.body)); } catch (error) { next(error); }
});
router.post('/forgot-password', (req, res, next) => {
  try { res.json(authService.forgotPassword(req.body)); } catch (error) { next(error); }
});

module.exports = router;
