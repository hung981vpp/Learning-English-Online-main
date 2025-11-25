const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.addUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Teacher list
router.get('/teachers', adminController.getAllTeachers);

// Course management
router.get('/courses', adminController.getAllCourses);
router.post('/courses', adminController.addCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);

// Quiz management
router.get('/quizzes', adminController.getAllQuizzes);
router.post('/quizzes', adminController.addQuiz);
router.put('/quizzes/:id', adminController.updateQuiz);
router.delete('/quizzes/:id', adminController.deleteQuiz);

// Lesson management
router.get('/lessons', adminController.getAllLessons);
router.post('/lessons', adminController.addLesson);
router.put('/lessons/:id', adminController.updateLesson);
router.delete('/lessons/:id', adminController.deleteLesson);

// Flashcard management
router.get('/flashcards', adminController.getAllFlashcards);
router.post('/flashcards', adminController.addFlashcard);
router.put('/flashcards/:id', adminController.updateFlashcard);
router.delete('/flashcards/:id', adminController.deleteFlashcard);

// Results management
router.get('/results', adminController.getAllResults);

module.exports = router;
