// backend/routes/quizRoutes.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/course/:courseId', quizController.getQuizzesByCourse);
router.get('/:id/info', quizController.getQuizInfo);
router.get('/:id/start', quizController.startQuiz);
router.post('/submit', quizController.submitQuiz);
router.get('/result/:id', quizController.getQuizResult);
router.get('/:id/answers', quizController.getQuizAnswers);

module.exports = router;
