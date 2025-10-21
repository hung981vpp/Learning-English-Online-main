// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/categories', courseController.getCategories);
router.get('/:id', courseController.getCourseDetail);
router.get('/:id/reviews', courseController.getCourseReviews);

// Protected routes
router.get('/my/courses', authMiddleware, courseController.getMyCourses);
router.post('/enroll', authMiddleware, courseController.enrollCourse);
router.post('/rate', authMiddleware, courseController.rateCourse);

module.exports = router;
