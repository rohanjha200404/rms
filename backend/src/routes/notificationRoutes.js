const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
let notificationService;
function configureNotificationRoutes(service) {
  notificationService = service;
  return router;
}

router.use(requireAuth);
router.get('/', async (req, res, next) => {
  try { res.json(await notificationService.list(req.user.sub)); } catch (error) { next(error); }
});
router.patch('/read-all', async (req, res, next) => {
  try { await notificationService.markAllRead(req.user.sub); res.json({ ok: true }); } catch (error) { next(error); }
});

module.exports = { router, configureNotificationRoutes };
