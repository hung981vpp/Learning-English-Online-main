const express = require('express');
const router = express.Router();
const { getAllQuizzes, getQuizById, submitQuiz } = require('../controllers/quizController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/quizzes', authMiddleware, getAllQuizzes);
router.get('/quizzes/:id', authMiddleware, getQuizById);
router.post('/quizzes/submit', authMiddleware, submitQuiz);

module.exports = router;
