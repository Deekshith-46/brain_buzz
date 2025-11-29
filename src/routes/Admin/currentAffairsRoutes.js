const express = require('express');
const {
  createLatestCurrentAffair,
  getLatestCurrentAffairs,
  getLatestCurrentAffairById,
  updateLatestCurrentAffair,
  deleteLatestCurrentAffair,
  createMonthlyCurrentAffair,
  getMonthlyCurrentAffairs,
  getMonthlyCurrentAffairById,
  updateMonthlyCurrentAffair,
  deleteMonthlyCurrentAffair,
  createSportsCurrentAffair,
  listSportsCurrentAffairs,
  getSportsCurrentAffairById,
  updateSportsCurrentAffair,
  deleteSportsCurrentAffair,
  createStateCurrentAffair,
  listStateCurrentAffairs,
  getStateCurrentAffairById,
  updateStateCurrentAffair,
  deleteStateCurrentAffair,
  createInternationalCurrentAffair,
  listInternationalCurrentAffairs,
  getInternationalCurrentAffairById,
  updateInternationalCurrentAffair,
  deleteInternationalCurrentAffair,
  createPoliticsCurrentAffair,
  listPoliticsCurrentAffairs,
  getPoliticsCurrentAffairById,
  updatePoliticsCurrentAffair,
  deletePoliticsCurrentAffair,
  createLocalCurrentAffair,
  listLocalCurrentAffairs,
  getLocalCurrentAffairById,
  updateLocalCurrentAffair,
  deleteLocalCurrentAffair,
} = require('../../controllers/Admin/currentAffairsController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

// Test endpoint - no auth required
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Current Affairs API is working!' });
});

// Apply auth middleware to all routes except test
router.use(adminAuthMiddleware);

// Latest Current Affairs
router.post(
  '/latest',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  createLatestCurrentAffair
);
router.get('/latest', getLatestCurrentAffairs);
router.get('/latest/:id', getLatestCurrentAffairById);
router.put(
  '/latest/:id',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  updateLatestCurrentAffair
);
router.delete('/latest/:id', deleteLatestCurrentAffair);

// Monthly Current Affairs
router.post(
  '/monthly',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  createMonthlyCurrentAffair
);
router.get('/monthly', getMonthlyCurrentAffairs);
router.get('/monthly/:id', getMonthlyCurrentAffairById);
router.put(
  '/monthly/:id',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  updateMonthlyCurrentAffair
);
router.delete('/monthly/:id', deleteMonthlyCurrentAffair);

// Sports Current Affairs
router.post(
  '/sports',
  upload.single('thumbnail'),
  createSportsCurrentAffair
);
router.get('/sports', listSportsCurrentAffairs);
router.get('/sports/:id', getSportsCurrentAffairById);
router.put(
  '/sports/:id',
  upload.single('thumbnail'),
  updateSportsCurrentAffair
);
router.delete('/sports/:id', deleteSportsCurrentAffair);

// State Current Affairs
router.post(
  '/state',
  upload.single('thumbnail'),
  createStateCurrentAffair
);
router.get('/state', listStateCurrentAffairs);
router.get('/state/:id', getStateCurrentAffairById);
router.put(
  '/state/:id',
  upload.single('thumbnail'),
  updateStateCurrentAffair
);
router.delete('/state/:id', deleteStateCurrentAffair);

// International Current Affairs
router.post(
  '/international',
  upload.single('thumbnail'),
  createInternationalCurrentAffair
);
router.get('/international', listInternationalCurrentAffairs);
router.get('/international/:id', getInternationalCurrentAffairById);
router.put(
  '/international/:id',
  upload.single('thumbnail'),
  updateInternationalCurrentAffair
);
router.delete('/international/:id', deleteInternationalCurrentAffair);

// Politics Current Affairs
router.post(
  '/politics',
  upload.single('thumbnail'),
  createPoliticsCurrentAffair
);
router.get('/politics', listPoliticsCurrentAffairs);
router.get('/politics/:id', getPoliticsCurrentAffairById);
router.put(
  '/politics/:id',
  upload.single('thumbnail'),
  updatePoliticsCurrentAffair
);
router.delete('/politics/:id', deletePoliticsCurrentAffair);

// Local Current Affairs
router.post(
  '/local',
  upload.single('thumbnail'),
  createLocalCurrentAffair
);
router.get('/local', listLocalCurrentAffairs);
router.get('/local/:id', getLocalCurrentAffairById);
router.put(
  '/local/:id',
  upload.single('thumbnail'),
  updateLocalCurrentAffair
);
router.delete('/local/:id', deleteLocalCurrentAffair);

module.exports = router;
