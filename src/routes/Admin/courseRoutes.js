const express = require('express');
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../../controllers/Admin/courseController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post(
  '/',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  createCourse
);

router.get('/', getCourses);
router.get('/:id', getCourseById);

router.put(
  '/:id',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  updateCourse
);

router.delete('/:id', deleteCourse);

module.exports = router;
