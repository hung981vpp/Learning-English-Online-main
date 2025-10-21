// backend/controllers/quizController.js
const { query } = require('../config/database');

class QuizController {
  // Lấy danh sách quiz của khóa học
  async getQuizzesByCourse(req, res) {
    try {
      const { courseId } = req.params;
      
      const quizQuery = `
        SELECT 
          MaBaiKiemTra,
          TenBaiKiemTra,
          MoTa,
          ThoiGianLamBai,
          DiemToiDa,
          DiemQuaMon,
          LoaiBaiKiemTra,
          CapDo
        FROM BaiKiemTra
        WHERE MaKhoaHoc = @courseId
        ORDER BY NgayTao ASC
      `;
      
      const result = await query(quizQuery, { courseId });
      
      res.json({
        success: true,
        data: result.recordset
      });
      
    } catch (error) {
      console.error('Get quizzes error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách bài kiểm tra'
      });
    }
  }
  
  // Lấy chi tiết quiz (chưa có câu hỏi)
  async getQuizInfo(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const quizQuery = `
        SELECT 
          bkt.*,
          kh.TenKhoaHoc,
          (SELECT COUNT(*) FROM CauHoi WHERE MaBaiKiemTra = @id) as TongCauHoi
        FROM BaiKiemTra bkt
        INNER JOIN KhoaHoc kh ON bkt.MaKhoaHoc = kh.MaKhoaHoc
        WHERE bkt.MaBaiKiemTra = @id
      `;
      
      const result = await query(quizQuery, { id });
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài kiểm tra'
        });
      }
      
      const quiz = result.recordset[0];
      
      // Kiểm tra đã đăng ký khóa học chưa
      const enrollQuery = `
        SELECT * FROM DangKyKhoaHoc 
        WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
      `;
      
      const enrolled = await query(enrollQuery, { 
        userId, 
        courseId: quiz.MaKhoaHoc 
      });
      
      if (enrolled.recordset.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa đăng ký khóa học này'
        });
      }
      
      // Lấy lịch sử làm bài
      const historyQuery = `
        SELECT 
          Diem,
          TongCauHoi,
          SoCauDung,
          ThoiGianLamBai,
          LanThu,
          NgayLamBai
        FROM KetQuaKiemTra
        WHERE MaNguoiDung = @userId AND MaBaiKiemTra = @id
        ORDER BY NgayLamBai DESC
      `;
      
      const history = await query(historyQuery, { userId, id });
      
      res.json({
        success: true,
        data: {
          ...quiz,
          lichSu: history.recordset
        }
      });
      
    } catch (error) {
      console.error('Get quiz info error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thông tin bài kiểm tra'
      });
    }
  }
  
  // Bắt đầu làm bài (lấy câu hỏi)
  async startQuiz(req, res) {
    try {
      const { id } = req.params;
      
      const questionsQuery = `
        SELECT 
          ch.MaCauHoi,
          ch.NoiDungCauHoi,
          ch.LoaiCauHoi,
          ch.HinhAnh,
          ch.AudioUrl,
          ch.DiemSo,
          ch.ThuTu
        FROM CauHoi ch
        WHERE ch.MaBaiKiemTra = @id
        ORDER BY ch.ThuTu ASC
      `;
      
      const questions = await query(questionsQuery, { id });
      
      if (questions.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bài kiểm tra chưa có câu hỏi'
        });
      }
      
      // Lấy đáp án cho từng câu hỏi
      const questionIds = questions.recordset.map(q => q.MaCauHoi);
      
      const answersQuery = `
        SELECT 
          MaDapAn,
          MaCauHoi,
          NoiDung,
          ThuTu
        FROM DapAn
        WHERE MaCauHoi IN (${questionIds.join(',')})
        ORDER BY MaCauHoi, ThuTu
      `;
      
      const answers = await query(answersQuery);
      
      // Gộp câu hỏi và đáp án
      const quizData = questions.recordset.map(question => {
        const questionAnswers = answers.recordset.filter(
          a => a.MaCauHoi === question.MaCauHoi
        );
        
        return {
          ...question,
          dapAn: questionAnswers
        };
      });
      
      res.json({
        success: true,
        data: quizData
      });
      
    } catch (error) {
      console.error('Start quiz error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi bắt đầu làm bài'
      });
    }
  }
  
  // Nộp bài và chấm điểm
  async submitQuiz(req, res) {
    try {
      const userId = req.user.id;
      const { quizId, answers, timeSpent } = req.body;
      
      // Lấy đáp án đúng
      const correctAnswersQuery = `
        SELECT ch.MaCauHoi, ch.DiemSo, da.MaDapAn
        FROM CauHoi ch
        INNER JOIN DapAn da ON ch.MaCauHoi = da.MaCauHoi
        WHERE ch.MaBaiKiemTra = @quizId AND da.DungSai = 1
      `;
      
      const correctAnswers = await query(correctAnswersQuery, { quizId });
      
      // Tính điểm
      let totalScore = 0;
      let correctCount = 0;
      const totalQuestions = correctAnswers.recordset.length;
      
      correctAnswers.recordset.forEach(correct => {
        const userAnswer = answers.find(a => a.questionId === correct.MaCauHoi);
        
        if (userAnswer && userAnswer.answerId === correct.MaDapAn) {
          totalScore += correct.DiemSo;
          correctCount++;
        }
      });
      
      // Lấy điểm tối đa
      const quizInfoQuery = `
        SELECT DiemToiDa FROM BaiKiemTra WHERE MaBaiKiemTra = @quizId
      `;
      
      const quizInfo = await query(quizInfoQuery, { quizId });
      const maxScore = quizInfo.recordset[0].DiemToiDa;
      
      // Tính điểm theo thang 100
      const finalScore = (totalScore / totalQuestions) * (maxScore / totalQuestions);
      
      // Đếm số lần làm
      const countQuery = `
        SELECT COUNT(*) as SoLan 
        FROM KetQuaKiemTra 
        WHERE MaNguoiDung = @userId AND MaBaiKiemTra = @quizId
      `;
      
      const countResult = await query(countQuery, { userId, quizId });
      const attemptNumber = countResult.recordset[0].SoLan + 1;
      
      // Lưu kết quả
      const saveResultQuery = `
        INSERT INTO KetQuaKiemTra 
        (MaNguoiDung, MaBaiKiemTra, Diem, TongCauHoi, SoCauDung, ThoiGianLamBai, LanThu)
        VALUES (@userId, @quizId, @score, @totalQuestions, @correctCount, @timeSpent, @attemptNumber)
      `;
      
      await query(saveResultQuery, {
        userId,
        quizId,
        score: parseFloat(finalScore.toFixed(2)),
        totalQuestions,
        correctCount,
        timeSpent,
        attemptNumber
      });
      
      res.json({
        success: true,
        message: 'Đã nộp bài thành công',
        data: {
          diem: parseFloat(finalScore.toFixed(2)),
          tongCauHoi: totalQuestions,
          soCauDung: correctCount,
          thoiGianLamBai: timeSpent,
          lanThu: attemptNumber
        }
      });
      
    } catch (error) {
      console.error('Submit quiz error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi nộp bài'
      });
    }
  }
  
  // Xem kết quả chi tiết
  async getQuizResult(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const resultQuery = `
        SELECT 
          kq.*,
          bkt.TenBaiKiemTra,
          bkt.DiemQuaMon
        FROM KetQuaKiemTra kq
        INNER JOIN BaiKiemTra bkt ON kq.MaBaiKiemTra = bkt.MaBaiKiemTra
        WHERE kq.MaKetQua = @id AND kq.MaNguoiDung = @userId
      `;
      
      const result = await query(resultQuery, { id, userId });
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kết quả'
        });
      }
      
      const ketQua = result.recordset[0];
      const daQua = ketQua.Diem >= ketQua.DiemQuaMon;
      
      res.json({
        success: true,
        data: {
          ...ketQua,
          daQua
        }
      });
      
    } catch (error) {
      console.error('Get quiz result error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải kết quả'
      });
    }
  }
  
  // Lấy đáp án đúng sau khi làm xong
  async getQuizAnswers(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Kiểm tra user đã làm bài chưa
      const checkQuery = `
        SELECT * FROM KetQuaKiemTra 
        WHERE MaNguoiDung = @userId AND MaBaiKiemTra = @id
      `;
      
      const check = await query(checkQuery, { userId, id });
      
      if (check.recordset.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa làm bài kiểm tra này'
        });
      }
      
      const answersQuery = `
        SELECT 
          ch.MaCauHoi,
          ch.NoiDungCauHoi,
          ch.GiaiThich,
          da.MaDapAn,
          da.NoiDung,
          da.DungSai
        FROM CauHoi ch
        INNER JOIN DapAn da ON ch.MaCauHoi = da.MaCauHoi
        WHERE ch.MaBaiKiemTra = @id
        ORDER BY ch.ThuTu, da.ThuTu
      `;
      
      const answers = await query(answersQuery, { id });
      
      res.json({
        success: true,
        data: answers.recordset
      });
      
    } catch (error) {
      console.error('Get quiz answers error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải đáp án'
      });
    }
  }
}

module.exports = new QuizController();
