// backend/controllers/lessonController.js
const sql = require('mssql');

class LessonController {
  async getLessonById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const pool = await sql.connect();
      const result = await pool.request()
        .input('lessonId', sql.Int, id)
        .query(`
                SELECT 
                    bh.MaBaiHoc,
                    bh.TenBaiHoc,
                    bh.MoTa as NoiDung,
                    bh.ThoiLuong,
                    bh.VideoUrl,
                    bh.AudioUrl,
                    bh.TaiLieuDinhKem,
                    bh.ThuTu,
                    bh.LoaiBaiHoc,
                    bh.MaKhoaHoc,
                    kh.TenKhoaHoc
                FROM BaiHoc bh
                INNER JOIN KhoaHoc kh ON bh.MaKhoaHoc = kh.MaKhoaHoc
                WHERE bh.MaBaiHoc = @lessonId
            `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài học'
        });
      }

      const lesson = result.recordset[0];

      // ===== LOAD PROGRESS VÀ GHI CHÚ =====
      if (userId) {
        const progressResult = await pool.request()
          .input('userId', sql.Int, userId)
          .input('lessonId', sql.Int, id)
          .query(`
                    SELECT TrangThai, TienDo, NgayHoanThanh, GhiChu
                    FROM TienDoBaiHoc 
                    WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
                `);

        if (progressResult.recordset.length > 0) {
          const progress = progressResult.recordset[0];
          lesson.IsCompleted = progress.TrangThai === 'completed';
          lesson.Progress = progress.TienDo || 0;
          lesson.CompletedDate = progress.NgayHoanThanh;
          lesson.SavedNotes = progress.GhiChu || ''; // THÊM: Load ghi chú
        } else {
          lesson.IsCompleted = false;
          lesson.Progress = 0;
          lesson.SavedNotes = '';
        }
      } else {
        lesson.IsCompleted = false;
        lesson.Progress = 0;
        lesson.SavedNotes = '';
      }

      return res.json({
        success: true,
        data: lesson
      });
    } catch (error) {
      console.error('Get lesson error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải bài học'
      });
    }
  }

  async getLessonsByCourse(req, res) {
    try {
      const { courseId } = req.params;

      const pool = await sql.connect();
      const result = await pool.request()
        .input('courseId', sql.Int, courseId)
        .query(`
                    SELECT 
                        MaBaiHoc,
                        TenBaiHoc,
                        MoTa as NoiDung,
                        ThoiLuong,
                        ThuTu,
                        LoaiBaiHoc
                    FROM BaiHoc
                    WHERE MaKhoaHoc = @courseId
                    ORDER BY ThuTu ASC
                `);

      return res.json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      console.error('Get lessons by course error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách bài học'
      });
    }
  }

  async markLessonComplete(req, res) {
    try {
      const { id } = req.params;

      // ===== VALIDATION: Kiểm tra req.user =====
      if (!req.user || !req.user.userId) {
        console.error('req.user is missing or invalid:', req.user);
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }

      const userId = req.user.userId;
      console.log('=== MARK COMPLETE ===');
      console.log('User ID:', userId);
      console.log('Lesson ID:', id);

      const pool = await sql.connect();

      // Kiểm tra đã có tiến độ chưa
      const checkProgress = await pool.request()
        .input('userId', sql.Int, userId)
        .input('lessonId', sql.Int, id)
        .query(`
                    SELECT * FROM TienDoBaiHoc 
                    WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
                `);

      if (checkProgress.recordset.length > 0) {
        // Cập nhật
        await pool.request()
          .input('userId', sql.Int, userId)
          .input('lessonId', sql.Int, id)
          .query(`
                        UPDATE TienDoBaiHoc 
                        SET TrangThai = 'completed', 
                            TienDo = 100, 
                            NgayHoanThanh = GETDATE(),
                            LanTruyCap = GETDATE()
                        WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
                    `);
      } else {
        // Thêm mới - MaNguoiDung và MaBaiHoc là NOT NULL nên phải có
        await pool.request()
          .input('userId', sql.Int, userId)
          .input('lessonId', sql.Int, id)
          .query(`
                        INSERT INTO TienDoBaiHoc (
                            MaNguoiDung, 
                            MaBaiHoc, 
                            TrangThai, 
                            TienDo, 
                            NgayBatDau, 
                            NgayHoanThanh,
                            ThoiGianHoc,
                            LanTruyCap
                        )
                        VALUES (
                            @userId, 
                            @lessonId, 
                            'completed', 
                            100, 
                            GETDATE(), 
                            GETDATE(),
                            0,
                            GETDATE()
                        )
                    `);
      }

      return res.json({
        success: true,
        message: 'Đã đánh dấu hoàn thành bài học'
      });
    } catch (error) {
      console.error('Mark lesson complete error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu tiến độ',
        error: error.message
      });
    }
  }

  async saveNotes(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = req.user.userId;

      const pool = await sql.connect();

      // Check đã có record chưa
      const checkNotes = await pool.request()
        .input('userId', sql.Int, userId)
        .input('lessonId', sql.Int, id)
        .query(`
                SELECT * FROM TienDoBaiHoc 
                WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
            `);

      if (checkNotes.recordset.length > 0) {
        // Update ghi chú
        await pool.request()
          .input('userId', sql.Int, userId)
          .input('lessonId', sql.Int, id)
          .input('notes', sql.NVarChar, notes)
          .query(`
                    UPDATE TienDoBaiHoc 
                    SET GhiChu = @notes
                    WHERE MaNguoiDung = @userId AND MaBaiHoc = @lessonId
                `);
      } else {
        // Tạo record mới với ghi chú
        await pool.request()
          .input('userId', sql.Int, userId)
          .input('lessonId', sql.Int, id)
          .input('notes', sql.NVarChar, notes)
          .query(`
                    INSERT INTO TienDoBaiHoc (
                        MaNguoiDung, 
                        MaBaiHoc, 
                        GhiChu,
                        NgayBatDau
                    )
                    VALUES (
                        @userId, 
                        @lessonId, 
                        @notes,
                        GETDATE()
                    )
                `);
      }

      return res.json({
        success: true,
        message: 'Đã lưu ghi chú'
      });
    } catch (error) {
      console.error('Save notes error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu ghi chú'
      });
    }
  }
}

module.exports = new LessonController();
