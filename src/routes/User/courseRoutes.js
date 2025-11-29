const express = require('express');
const { listCourses, getCourseById } = require('../../controllers/User/courseController');

const router = express.Router();

router.get('/courses', listCourses);
router.get('/courses/:id', getCourseById);

module.exports = router;
