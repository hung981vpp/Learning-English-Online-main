// backend/controllers/lessonController.js
const { query } = require('../config/database');

class LessonController {
  // Lấy chi tiết bài học
  async getLessonDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const lessonQuery = `
        SELECT 
          bh.*,
          kh.TenKhoaHoc
        FROM BaiHoc bh
        INNER JOIN KhoaHoc kh ON bh.MaKhoaHoc = kh.MaKhoaHoc
        WHERE bh.MaBaiHoc = @id
      `;
      
      const result = await query(lessonQuery, { id });
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }
      
      const lesson = result.recordset[0];
      
      // Kiểm tra user đã đăng ký khóa học chưa
      const enrollQuery = `
        SELECT * FROM DangKyKhoaHoc 
        WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
      `;
      
      const enrolled = await query(enrollQuery, { 
        userId, 
        courseId: lesson.MaKhoaHoc 
      });
      
      if (enrolled.recordset.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn chưa đăng ký khóa học này'
        });
      }
      
      // Lấy tiến độ bài học
      const progressQuery = `
        SELECT * FROM TienDoBaiHoc 
        WHERE MaNguoiDung = @userId AND MaBaiHoc = @id
      `;
      
      const progress = await query(progressQuery, { userId, id });
      
      res.json({
        success: true,
        data: {
          ...lesson,
          tienDo: progress.recordset[0] || null
        }
      });
      
    } catch (error) {
      console.error('Get lesson detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải bài học'
      });
    }
  }
  
  // Bắt đầu học bài
  async startLesson(req, res) {
    try {
      const userId = req.user.id;
      const { lessonId } = req.body;
      
      // Kiểm tra đã có tiến độ chưa
      const checkQuery = `
        SELECT * FROM TienDoBaiHoc 
        WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
      `;
      
      const existing = await query(checkQuery, { userId, lessonId });
      
      if (existing.recordset.length > 0) {
        // Cập nhật lần truy cập
        const updateQuery = `
          UPDATE TienDoBaiHoc 
          SET LanTruyCap = GETDATE()
          WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
        `;
        
        await query(updateQuery, { userId, lessonId });
      } else {
        // Tạo tiến độ mới
        const insertQuery = `
          INSERT INTO TienDoBaiHoc 
          (MaNguoiDung, MaBaiHoc, TrangThai, NgayBatDau, LanTruyCap)
          VALUES (@userId, @lessonId, N'in_progress', GETDATE(), GETDATE())
        `;
        
        await query(insertQuery, { userId, lessonId });
      }
      
      res.json({
        success: true,
        message: 'Đã bắt đầu bài học'
      });
      
    } catch (error) {
      console.error('Start lesson error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi bắt đầu bài học'
      });
    }
  }
  
  // Hoàn thành bài học
  async completeLesson(req, res) {
    try {
      const userId = req.user.id;
      const { lessonId, timeSpent } = req.body;
      
      // Cập nhật tiến độ
      const updateQuery = `
        UPDATE TienDoBaiHoc 
        SET TrangThai = N'completed',
            TienDo = 100,
            ThoiGianHoc = @timeSpent,
            NgayHoanThanh = GETDATE()
        WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
      `;
      
      await query(updateQuery, { userId, lessonId, timeSpent });
      
      // Cập nhật tiến độ khóa học
      await this.updateCourseProgress(userId, lessonId);
      
      res.json({
        success: true,
        message: 'Đã hoàn thành bài học'
      });
      
    } catch (error) {
      console.error('Complete lesson error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi hoàn thành bài học'
      });
    }
  }
  
  // Helper: Cập nhật tiến độ khóa học
  async updateCourseProgress(userId, lessonId) {
    try {
      // Lấy khóa học của bài học
      const getCourseQuery = `
        SELECT MaKhoaHoc FROM BaiHoc WHERE MaBaiHoc = @lessonId
      `;
      
      const courseResult = await query(getCourseQuery, { lessonId });
      const courseId = courseResult.recordset[0].MaKhoaHoc;
      
      // Tính tiến độ
      const progressQuery = `
        SELECT 
          COUNT(*) as TongBaiHoc,
          SUM(CASE WHEN td.TrangThai = N'completed' THEN 1 ELSE 0 END) as BaiHoanThanh
        FROM BaiHoc bh
        LEFT JOIN TienDoBaiHoc td ON bh.MaBaiHoc = td.MaBaiHoc AND td.MaNguoiDung = @userId
        WHERE bh.MaKhoaHoc = @courseId
      `;
      
      const progress = await query(progressQuery, { userId, courseId });
      const { TongBaiHoc, BaiHoanThanh } = progress.recordset[0];
      
      const tienDo = (BaiHoanThanh / TongBaiHoc) * 100;
      const trangThai = tienDo === 100 ? 'completed' : 'learning';
      
      // Cập nhật
      const updateQuery = `
        UPDATE DangKyKhoaHoc 
        SET TienDo = @tienDo,
            TrangThai = @trangThai,
            NgayTruyCap = GETDATE()
            ${trangThai === 'completed' ? ', NgayHoanThanh = GETDATE()' : ''}
        WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
      `;
      
      await query(updateQuery, { tienDo, trangThai, userId, courseId });
      
    } catch (error) {
      console.error('Update course progress error:', error);
    }
  }
}

module.exports = new LessonController();
