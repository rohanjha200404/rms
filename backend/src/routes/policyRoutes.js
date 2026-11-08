const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { sheetUpload } = require('../middleware/upload');
const router = express.Router();
let policyService;
function configurePolicyRoutes(service) {
  policyService = service;
  return router;
}
router.use(requireAuth);
router.get('/summary', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));
    const dueDaysValue = Number.parseInt(req.query.dueDays, 10);
    const dueDays = [45, 60, 90].includes(dueDaysValue) ? dueDaysValue : '';
    res.json(await policyService.summary({ page, pageSize, search: String(req.query.search || '').trim(), status: String(req.query.status || '').trim(), dueDays }));
  } catch (error) { next(error); }
});
router.post('/import', sheetUpload.single('file'), async (req, res, next) => {
  try { res.json(await policyService.importCsv(req.file, req.user.sub)); } catch (error) { next(error); }
});
router.patch('/:id/status', async (req, res, next) => {
  try { await policyService.updateStatus(req.params.id, req.body.status); res.json({ ok: true }); } catch (error) { next(error); }
});
router.patch('/:id/disposition', async (req, res, next) => {
  try { await policyService.updateDisposition(req.params.id, req.body.disposition); res.json({ ok: true }); } catch (error) { next(error); }
});

module.exports = { router, configurePolicyRoutes };
