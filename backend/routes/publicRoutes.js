const express = require('express');
const router = express.Router();
const { getPortalData } = require('../controllers/publicController');

router.get('/portal/:token', getPortalData);

module.exports = router;
