// In src/routes/User/testSeriesRoutes.js

const express = require('express');
const router = express.Router();
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const {
  listPublicTestSeries,
  getPublicTestSeriesById,
  getPublicTestInSeries,
  getPublicTestInSeriesPublic // New controller function for public access
} = require('../../controllers/User/testSeriesPublicController');

// Public list of active Test Series (no auth required)
router.get('/', listPublicTestSeries);

// Public details for a single Test Series (no auth required)
router.get('/:seriesId', getPublicTestSeriesById);
router.get('/public/:seriesId/tests/:testId', getPublicTestInSeriesPublic); // New public endpoint

// Test details; video URL only for authenticated & paid users
router.get('/:seriesId/tests/:testId', userAuthMiddleware, getPublicTestInSeries);

module.exports = router;