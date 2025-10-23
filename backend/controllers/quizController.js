const sql = require('mssql');
const dbConfig = require('../config/database');

// Get all available quizzes
const getAllQuizzes = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT 
                    MaBaiKiemTra,
                    TenBaiKiemTra,
                    MoTa,
                    ThoiGianLamBai,
                    DiemToiDa,
                    LoaiBaiKiemTra,
                    CapDo,
                    (SELECT COUNT(*) FROM CauHoi WHERE MaBaiKiemTra = BaiKiemTra.MaBaiKiemTra) as SoCauHoi
                FROM BaiKiemTra 
                WHERE MaKhoaHoc IS NULL
                ORDER BY MaBaiKiemTra DESC
            `);

        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get quizzes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách bài kiểm tra'
        });
    }
};

// Get quiz by ID with questions
const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await sql.connect(dbConfig);

        // Get quiz info
        const quizResult = await pool.request()
            .input('quizId', sql.Int, id)
            .query('SELECT * FROM BaiKiemTra WHERE MaBaiKiemTra = @quizId');

        if (quizResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài kiểm tra'
            });
        }

        // Get questions with answers
        const questionsResult = await pool.request()
            .input('quizId', sql.Int, id)
            .query(`
                SELECT 
                    c.MaCauHoi,
                    c.NoiDungCauHoi,
                    c.LoaiCauHoi,
                    c.PhanThi,
                    c.ThuTu,
                    c.GiaiThich,
                    c.HinhAnh,
                    c.AudioUrl
                FROM CauHoi c
                WHERE c.MaBaiKiemTra = @quizId 
                ORDER BY c.ThuTu
            `);

        // Get answers for each question
        for (let question of questionsResult.recordset) {
            const answersResult = await pool.request()
                .input('questionId', sql.Int, question.MaCauHoi)
                .query(`
                    SELECT MaDapAn, NoiDung, ThuTu 
                    FROM DapAn 
                    WHERE MaCauHoi = @questionId 
                    ORDER BY ThuTu
                `);
            question.DapAn = answersResult.recordset;
        }

        return res.json({
            success: true,
            data: {
                quiz: quizResult.recordset[0],
                questions: questionsResult.recordset
            }
        });
    } catch (error) {
        console.error('Get quiz error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải bài kiểm tra'
        });
    }
};

// Submit quiz and calculate score
const submitQuiz = async (req, res) => {
    try {
        const { quizId, answers, timeSpent } = req.body;
        const userId = req.user.userId;

        const pool = await sql.connect(dbConfig);

        // Get correct answers
        const correctAnswersResult = await pool.request()
            .input('quizId', sql.Int, quizId)
            .query(`
                SELECT 
                    c.MaCauHoi,
                    d.MaDapAn,
                    c.PhanThi,
                    c.DiemSo
                FROM CauHoi c
                INNER JOIN DapAn d ON c.MaCauHoi = d.MaCauHoi
                WHERE c.MaBaiKiemTra = @quizId AND d.DungSai = 1
            `);

        const correctAnswers = {};
        let totalListening = 0;
        let totalReading = 0;

        correctAnswersResult.recordset.forEach(row => {
            correctAnswers[row.MaCauHoi] = row.MaDapAn;
            if (row.PhanThi === 'listening') totalListening++;
            else totalReading++;
        });

        // Calculate score
        let correctCount = 0;
        let listeningCorrect = 0;
        let readingCorrect = 0;

        Object.keys(answers).forEach(questionId => {
            if (answers[questionId] == correctAnswers[questionId]) {
                correctCount++;
                const question = correctAnswersResult.recordset.find(q => q.MaCauHoi == questionId);
                if (question && question.PhanThi === 'listening') listeningCorrect++;
                else readingCorrect++;
            }
        });

        // Calculate scaled scores
        const listeningScore = totalListening > 0 ? Math.round((listeningCorrect / totalListening) * 50) : 0;
        const readingScore = totalReading > 0 ? Math.round((readingCorrect / totalReading) * 50) : 0;
        const totalScore = listeningScore + readingScore;

        return res.json({
            success: true,
            data: {
                totalScore,
                listeningScore,
                readingScore,
                correctCount,
                totalQuestions: Object.keys(correctAnswers).length,
                percentage: Math.round((correctCount / Object.keys(correctAnswers).length) * 100)
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi nộp bài kiểm tra'
        });
    }
};

module.exports = {
    getAllQuizzes,
    getQuizById,
    submitQuiz
};
