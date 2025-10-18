const express = require('express');
const router = express.Router();
const blogController = require('../controller/blog-list.controller');

// GET /api/slugs/filter
router.get('/', blogController.getAll);

module.exports = router;
