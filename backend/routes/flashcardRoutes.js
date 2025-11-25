const express = require('express');
const router = express.Router();
const { 
    getAllFlashcardSets, 
    getFlashcardSetById, 
    updateProgress,
    getSetStatistics 
} = require('../controllers/flashcardController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/flashcards', authMiddleware, getAllFlashcardSets);
router.get('/flashcards/:id', authMiddleware, getFlashcardSetById);
router.get('/flashcards/:id/statistics', authMiddleware, getSetStatistics);
router.post('/flashcards/progress', authMiddleware, updateProgress);

module.exports = router;
