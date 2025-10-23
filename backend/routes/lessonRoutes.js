const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ===== OPTIONAL AUTH: Dùng middleware tùy chọn =====
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                userId: decoded.userId || decoded.id,
                email: decoded.email,
                isAdmin: decoded.isAdmin || false
            };
        }
    } catch (error) {
        // Ignore error, just continue without user
    }
    next();
};

// Public routes with optional auth
router.get('/:id', optionalAuth, lessonController.getLessonById);
router.get('/course/:courseId', lessonController.getLessonsByCourse);

// Protected routes (cần đăng nhập)
router.post('/:id/complete', authMiddleware, lessonController.markLessonComplete);
router.post('/:id/notes', authMiddleware, lessonController.saveNotes);

module.exports = router;
