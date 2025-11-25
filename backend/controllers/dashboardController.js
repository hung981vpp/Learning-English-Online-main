const sql = require('mssql');
const dbConfig = require('../config/database');

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // Count total users
        const usersResult = await pool.request()
            .query('SELECT COUNT(*) as total FROM NguoiDung');
        const totalUsers = usersResult.recordset[0].total;
        
        // Count users by role - check if VaiTro column exists
        let rolesResult;
        try {
            rolesResult = await pool.request()
                .query(`
                    SELECT 
                        SUM(CASE WHEN MaVaiTro = 1 THEN 1 ELSE 0 END) as students,
                        SUM(CASE WHEN MaVaiTro = 2 THEN 1 ELSE 0 END) as teachers,
                        SUM(CASE WHEN MaVaiTro = 3 THEN 1 ELSE 0 END) as admins
                    FROM NguoiDung
                `);
        } catch (err) {
            // Fallback if column doesn't exist
            rolesResult = { recordset: [{ students: 0, teachers: 0, admins: 0 }] };
        }
        
        // Count total courses
        const coursesResult = await pool.request()
            .query('SELECT COUNT(*) as total FROM KhoaHoc');
        const totalCourses = coursesResult.recordset[0].total;
        
        // Count total quizzes completed
        const quizzesResult = await pool.request()
            .query('SELECT COUNT(*) as total FROM KetQuaKiemTra');
        const totalQuizzes = quizzesResult.recordset[0].total;
        
        // Count total flashcards from JSON file
        const fs = require('fs');
        const path = require('path');
        let totalFlashcards = 0;
        try {
            const flashcardDataPath = path.join(__dirname, '../../frontend/data/flashcard-data.json');
            const flashcardData = JSON.parse(fs.readFileSync(flashcardDataPath, 'utf8'));
            totalFlashcards = flashcardData.flashcardSets.reduce((total, set) => total + set.cards.length, 0);
        } catch (err) {
            console.error('Error reading flashcard data:', err);
            totalFlashcards = 0;
        }
        
        return res.json({
            success: true,
            data: {
                totalUsers,
                totalCourses,
                totalQuizzes,
                totalFlashcards,
                students: rolesResult.recordset[0].students || 0,
                teachers: rolesResult.recordset[0].teachers || 0,
                admins: rolesResult.recordset[0].admins || 0
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê'
        });
    }
};

module.exports = {
    getAdminStats
};
