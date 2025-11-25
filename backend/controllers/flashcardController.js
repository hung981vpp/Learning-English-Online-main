const sql = require('mssql');
const dbConfig = require('../config/database');

// Get all flashcard sets
const getAllFlashcardSets = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT 
                    bf.MaBoFlashcard,
                    bf.TenBo,
                    bf.MoTa,
                    bf.ChuDe,
                    bf.CapDo,
                    bf.HinhAnh,
                    (SELECT COUNT(*) FROM Flashcard WHERE MaBoFlashcard = bf.MaBoFlashcard) as SoLuongThe
                FROM BoFlashcard bf
                ORDER BY bf.NgayTao DESC
            `);

        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get flashcard sets error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách bộ flashcard'
        });
    }
};

// Get flashcard set by ID with cards
const getFlashcardSetById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const pool = await sql.connect(dbConfig);

        // Get set info
        const setResult = await pool.request()
            .input('setId', sql.Int, id)
            .query('SELECT * FROM BoFlashcard WHERE MaBoFlashcard = @setId');

        if (setResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bộ flashcard'
            });
        }

        // Get flashcards with user progress
        const cardsResult = await pool.request()
            .input('setId', sql.Int, id)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    f.*,
                    td.TrangThai,
                    td.SoLanXem,
                    td.SoLanDung,
                    td.SoLanSai
                FROM Flashcard f
                LEFT JOIN TienDoFlashcard td ON f.MaFlashcard = td.MaFlashcard AND td.MaNguoiDung = @userId
                WHERE f.MaBoFlashcard = @setId
                ORDER BY f.ThuTu
            `);

        return res.json({
            success: true,
            data: {
                set: setResult.recordset[0],
                cards: cardsResult.recordset
            }
        });
    } catch (error) {
        console.error('Get flashcard set error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải bộ flashcard'
        });
    }
};

// Update flashcard progress
const updateProgress = async (req, res) => {
    try {
        const { flashcardId, isCorrect } = req.body;
        const userId = req.user.userId;
        const pool = await sql.connect(dbConfig);

        // Check if progress exists
        const existingResult = await pool.request()
            .input('userId', sql.Int, userId)
            .input('flashcardId', sql.Int, flashcardId)
            .query('SELECT * FROM TienDoFlashcard WHERE MaNguoiDung = @userId AND MaFlashcard = @flashcardId');

        if (existingResult.recordset.length === 0) {
            // Create new progress
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('flashcardId', sql.Int, flashcardId)
                .input('soLanDung', sql.Int, isCorrect ? 1 : 0)
                .input('soLanSai', sql.Int, isCorrect ? 0 : 1)
                .query(`
                    INSERT INTO TienDoFlashcard 
                    (MaNguoiDung, MaFlashcard, TrangThai, SoLanXem, SoLanDung, SoLanSai, LanXemCuoi)
                    VALUES 
                    (@userId, @flashcardId, N'dang_hoc', 1, @soLanDung, @soLanSai, GETDATE())
                `);
        } else {
            // Update existing progress
            const current = existingResult.recordset[0];
            const newSoLanDung = current.SoLanDung + (isCorrect ? 1 : 0);
            const newSoLanSai = current.SoLanSai + (isCorrect ? 0 : 1);
            const newSoLanXem = current.SoLanXem + 1;
            
            // Determine new status
            let newStatus = 'dang_hoc';
            if (newSoLanDung >= 3 && newSoLanSai === 0) {
                newStatus = 'da_nho';
            }

            await pool.request()
                .input('userId', sql.Int, userId)
                .input('flashcardId', sql.Int, flashcardId)
                .input('soLanXem', sql.Int, newSoLanXem)
                .input('soLanDung', sql.Int, newSoLanDung)
                .input('soLanSai', sql.Int, newSoLanSai)
                .input('trangThai', sql.NVarChar, newStatus)
                .input('ngayHocXong', sql.DateTime, newStatus === 'da_nho' ? new Date() : null)
                .query(`
                    UPDATE TienDoFlashcard 
                    SET SoLanXem = @soLanXem,
                        SoLanDung = @soLanDung,
                        SoLanSai = @soLanSai,
                        TrangThai = @trangThai,
                        LanXemCuoi = GETDATE(),
                        NgayHocXong = @ngayHocXong
                    WHERE MaNguoiDung = @userId AND MaFlashcard = @flashcardId
                `);
        }

        return res.json({
            success: true,
            message: 'Cập nhật tiến độ thành công'
        });
    } catch (error) {
        console.error('Update progress error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tiến độ'
        });
    }
};

// Get user statistics for a flashcard set
const getSetStatistics = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('setId', sql.Int, id)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    COUNT(f.MaFlashcard) as TongSoThe,
                    COUNT(td.MaTienDo) as SoTheDaXem,
                    SUM(CASE WHEN td.TrangThai = N'da_nho' THEN 1 ELSE 0 END) as SoTheDaNho,
                    SUM(CASE WHEN td.TrangThai = N'dang_hoc' THEN 1 ELSE 0 END) as SoTheDangHoc,
                    SUM(ISNULL(td.SoLanDung, 0)) as TongSoLanDung,
                    SUM(ISNULL(td.SoLanSai, 0)) as TongSoLanSai
                FROM Flashcard f
                LEFT JOIN TienDoFlashcard td ON f.MaFlashcard = td.MaFlashcard AND td.MaNguoiDung = @userId
                WHERE f.MaBoFlashcard = @setId
            `);

        return res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê'
        });
    }
};

module.exports = {
    getAllFlashcardSets,
    getFlashcardSetById,
    updateProgress,
    getSetStatistics
};
