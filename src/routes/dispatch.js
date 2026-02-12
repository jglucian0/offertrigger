const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../config/dispatchStore');

router.get('/', (req, res) => {
  res.json(getConfig());
});

router.post('/', (req, res) => {
  updateConfig(req.body);
  res.json({ success: true });
});

module.exports = router;