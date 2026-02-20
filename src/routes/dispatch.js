const express = require('express');
const router = express.Router();
const controller = require('../controllers/dispatchController');

router.post('/config', controller.saveConfig);
router.get('/config/:sessionId', controller.listConfigs);
router.patch('/config/toggle', controller.toggle);
router.get('/queue/:sessionId/:niche', controller.listQueue);
router.delete('/config/:sessionId/:niche', controller.deleteConfig);
router.get('/stats/:sessionId', controller.stats);
router.get('/history/:sessionId', controller.history);

module.exports = router;