const express = require('express');
const router = express.Router();

const sessionController = require('../controllers/sessionController');

router.post('/start', sessionController.startSession);
router.get('/status/:userId', sessionController.checkStatus);
router.delete('/:userId', sessionController.deleteSession);
router.get('/list', sessionController.listSessions);
router.get('/groups/:userId', sessionController.getGroups);

module.exports = router;