const express = require('express');
const {
  createPublication,
  getPublications,
  getPublicationById,
  updatePublication,
  deletePublication,
} = require('../../controllers/Admin/publicationController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post(
  '/',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'authorImages', maxCount: 10 },
    { name: 'galleryImages', maxCount: 20 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  createPublication
);

router.get('/', getPublications);
router.get('/:id', getPublicationById);

router.put(
  '/:id',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'authorImages', maxCount: 10 },
    { name: 'galleryImages', maxCount: 20 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  updatePublication
);

router.delete('/:id', deletePublication);

module.exports = router;
