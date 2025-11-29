const express = require('express');
const {
  listCurrentAffairs,
  getCurrentAffairById,
} = require('../../controllers/User/currentAffairsController');

const router = express.Router();

// Get all current affairs
router.get('/current-affairs', listCurrentAffairs);

// Get single current affair by ID
router.get('/current-affairs/:id', getCurrentAffairById);

module.exports = router;
