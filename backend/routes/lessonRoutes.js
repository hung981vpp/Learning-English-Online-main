// backend/routes/lessonRoutes.js
const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/:id', lessonController.getLessonDetail);
router.post('/start', lessonController.startLesson);
router.post('/complete', lessonController.completeLesson);

module.exports = router;
