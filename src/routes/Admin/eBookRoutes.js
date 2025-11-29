const express = require('express');
const {
  createEBook,
  getEBooks,
  getEBookById,
  updateEBook,
  deleteEBook,
} = require('../../controllers/Admin/eBookController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post(
  '/',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  createEBook
);

router.get('/', getEBooks);
router.get('/:id', getEBookById);

router.put(
  '/:id',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
  ]),
  updateEBook
);

router.delete('/:id', deleteEBook);

module.exports = router;
