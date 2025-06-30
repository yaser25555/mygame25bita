const express = require('express');
const router = express.Router();
const agoraTokenRoutes = require('./agoraToken');

router.use('/', agoraTokenRoutes);

module.exports = router; 