// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============= PUBLIC ROUTES =============
// Lấy tất cả khóa học
router.get('/', courseController.getAllCourses);

// Lấy danh mục
router.get('/categories', courseController.getCategories);

// Lấy chi tiết khóa học
router.get('/:id', courseController.getCourseDetail);

// Lấy đánh giá khóa học (public)
router.get('/:id/reviews', reviewController.getCourseReviews);

// ============= PROTECTED ROUTES (cần đăng nhập) =============
// Lấy khóa học của tôi
router.get('/my/courses', authMiddleware, courseController.getMyCourses);

// Đăng ký khóa học
router.post('/enroll', authMiddleware, courseController.enrollCourse);

// Đánh giá khóa học (cũ - nếu có)
router.post('/rate', authMiddleware, courseController.rateCourse);

// Gửi đánh giá mới (dùng reviewController)
router.post('/:id/reviews', authMiddleware, reviewController.submitReview);

module.exports = router;
