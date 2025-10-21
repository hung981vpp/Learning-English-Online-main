// backend/controllers/courseController.js
const { query } = require('../config/database');

class CourseController {
  // Lấy danh sách tất cả khóa học
  async getAllCourses(req, res) {
    try {
      const { category, level, search } = req.query;
      
      let queryString = `
        SELECT 
          kh.MaKhoaHoc,
          kh.TenKhoaHoc,
          kh.MoTa,
          kh.AnhBia,
          kh.CapDoCEFR,
          kh.TongSoBaiHoc,
          kh.ThoiLuongUocTinh,
          kh.LuotDangKy,
          kh.DiemTrungBinh,
          dm.TenDanhMuc,
          nd.HoTen as TenGiangVien
        FROM KhoaHoc kh
        INNER JOIN DanhMucKhoaHoc dm ON kh.MaDanhMuc = dm.MaDanhMuc
        INNER JOIN NguoiDung nd ON kh.NguoiTao = nd.MaNguoiDung
        WHERE kh.TrangThai = N'published'
      `;
      
      const params = {};
      
      if (category) {
        queryString += ` AND dm.MaDanhMuc = @category`;
        params.category = category;
      }
      
      if (level) {
        queryString += ` AND kh.CapDoCEFR = @level`;
        params.level = level;
      }
      
      if (search) {
        queryString += ` AND (kh.TenKhoaHoc LIKE @search OR kh.MoTa LIKE @search)`;
        params.search = `%${search}%`;
      }
      
      queryString += ` ORDER BY kh.NgayTao DESC`;
      
      const result = await query(queryString, params);
      
      res.json({
        success: true,
        data: result.recordset
      });
      
    } catch (error) {
      console.error('Get all courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách khóa học'
      });
    }
  }
  
  // Lấy chi tiết 1 khóa học
  async getCourseDetail(req, res) {
    try {
      const { id } = req.params;
      
      const courseQuery = `
        SELECT 
          kh.*,
          dm.TenDanhMuc,
          nd.HoTen as TenGiangVien,
          nd.Email as EmailGiangVien
        FROM KhoaHoc kh
        INNER JOIN DanhMucKhoaHoc dm ON kh.MaDanhMuc = dm.MaDanhMuc
        INNER JOIN NguoiDung nd ON kh.NguoiTao = nd.MaNguoiDung
        WHERE kh.MaKhoaHoc = @id
      `;
      
      const result = await query(courseQuery, { id });
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khóa học'
        });
      }
      
      // Lấy danh sách bài học
      const lessonsQuery = `
        SELECT MaBaiHoc, TenBaiHoc, MoTa, ThuTu, ThoiLuong, LoaiBaiHoc
        FROM BaiHoc
        WHERE MaKhoaHoc = @id
        ORDER BY ThuTu ASC
      `;
      
      const lessons = await query(lessonsQuery, { id });
      
      // Lấy số lượng đánh giá
      const reviewsQuery = `
        SELECT COUNT(*) as TongDanhGia
        FROM DanhGiaKhoaHoc
        WHERE MaKhoaHoc = @id
      `;
      
      const reviews = await query(reviewsQuery, { id });
      
      res.json({
        success: true,
        data: {
          ...result.recordset[0],
          baiHoc: lessons.recordset,
          tongDanhGia: reviews.recordset[0].TongDanhGia
        }
      });
      
    } catch (error) {
      console.error('Get course detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải chi tiết khóa học'
      });
    }
  }
  
  // Lấy khóa học của user đã đăng ký
  async getMyCourses(req, res) {
    try {
      const userId = req.user.id;
      
      const myCoursesQuery = `
        SELECT 
          kh.MaKhoaHoc,
          kh.TenKhoaHoc,
          kh.MoTa,
          kh.AnhBia,
          kh.CapDoCEFR,
          dk.TienDo,
          dk.TrangThai,
          dk.NgayDangKy,
          dk.NgayTruyCap
        FROM DangKyKhoaHoc dk
        INNER JOIN KhoaHoc kh ON dk.MaKhoaHoc = kh.MaKhoaHoc
        WHERE dk.MaNguoiDung = @userId
        ORDER BY dk.NgayTruyCap DESC
      `;
      
      const result = await query(myCoursesQuery, { userId });
      
      res.json({
        success: true,
        data: result.recordset
      });
      
    } catch (error) {
      console.error('Get my courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải khóa học của bạn'
      });
    }
  }
  
  // Đăng ký khóa học
  async enrollCourse(req, res) {
    try {
      const userId = req.user.id;
      const { courseId } = req.body;
      
      // Kiểm tra đã đăng ký chưa
      const checkQuery = `
        SELECT * FROM DangKyKhoaHoc 
        WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
      `;
      
      const check = await query(checkQuery, { userId, courseId });
      
      if (check.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đăng ký khóa học này rồi'
        });
      }
      
      // Đăng ký khóa học
      const enrollQuery = `
        INSERT INTO DangKyKhoaHoc (MaNguoiDung, MaKhoaHoc, TienDo, TrangThai)
        VALUES (@userId, @courseId, 0, N'learning')
      `;
      
      await query(enrollQuery, { userId, courseId });
      
      // Cập nhật lượt đăng ký
      const updateCountQuery = `
        UPDATE KhoaHoc 
        SET LuotDangKy = LuotDangKy + 1
        WHERE MaKhoaHoc = @courseId
      `;
      
      await query(updateCountQuery, { courseId });
      
      res.json({
        success: true,
        message: 'Đăng ký khóa học thành công'
      });
      
    } catch (error) {
      console.error('Enroll course error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng ký khóa học'
      });
    }
  }
  
  // Lấy danh mục khóa học
  async getCategories(req, res) {
    try {
      const categoriesQuery = `
        SELECT 
          dm.MaDanhMuc,
          dm.TenDanhMuc,
          dm.MoTa,
          dm.Icon,
          COUNT(kh.MaKhoaHoc) as SoLuongKhoaHoc
        FROM DanhMucKhoaHoc dm
        LEFT JOIN KhoaHoc kh ON dm.MaDanhMuc = kh.MaDanhMuc AND kh.TrangThai = N'published'
        GROUP BY dm.MaDanhMuc, dm.TenDanhMuc, dm.MoTa, dm.Icon, dm.ThuTu
        ORDER BY dm.ThuTu ASC
      `;
      
      const result = await query(categoriesQuery);
      
      res.json({
        success: true,
        data: result.recordset
      });
      
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh mục'
      });
    }
  }
  
  // Đánh giá khóa học
  async rateCourse(req, res) {
    try {
      const userId = req.user.id;
      const { courseId, rating, comment } = req.body;
      
      // Validation
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Đánh giá phải từ 1 đến 5 sao'
        });
      }
      
      // Kiểm tra đã đăng ký khóa học chưa
      const checkEnrollQuery = `
        SELECT * FROM DangKyKhoaHoc 
        WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
      `;
      
      const enrolled = await query(checkEnrollQuery, { userId, courseId });
      
      if (enrolled.recordset.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Bạn phải đăng ký khóa học trước khi đánh giá'
        });
      }
      
      // Kiểm tra đã đánh giá chưa
      const checkRatingQuery = `
        SELECT * FROM DanhGiaKhoaHoc 
        WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
      `;
      
      const existingRating = await query(checkRatingQuery, { userId, courseId });
      
      if (existingRating.recordset.length > 0) {
        // Cập nhật đánh giá
        const updateQuery = `
          UPDATE DanhGiaKhoaHoc 
          SET XepHang = @rating, BinhLuan = @comment, NgayDanhGia = GETDATE()
          WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
        `;
        
        await query(updateQuery, { rating, comment, userId, courseId });
      } else {
        // Thêm đánh giá mới
        const insertQuery = `
          INSERT INTO DanhGiaKhoaHoc (MaNguoiDung, MaKhoaHoc, XepHang, BinhLuan)
          VALUES (@userId, @courseId, @rating, @comment)
        `;
        
        await query(insertQuery, { userId, courseId, rating, comment });
      }
      
      // Cập nhật điểm trung bình
      const avgQuery = `
        SELECT AVG(CAST(XepHang as FLOAT)) as DiemTB
        FROM DanhGiaKhoaHoc
        WHERE MaKhoaHoc = @courseId
      `;
      
      const avgResult = await query(avgQuery, { courseId });
      
      const updateAvgQuery = `
        UPDATE KhoaHoc 
        SET DiemTrungBinh = @avgRating
        WHERE MaKhoaHoc = @courseId
      `;
      
      await query(updateAvgQuery, { 
        avgRating: avgResult.recordset[0].DiemTB,
        courseId 
      });
      
      res.json({
        success: true,
        message: 'Đánh giá khóa học thành công'
      });
      
    } catch (error) {
      console.error('Rate course error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đánh giá khóa học'
      });
    }
  }
  
  // Lấy đánh giá của khóa học
  async getCourseReviews(req, res) {
    try {
      const { id } = req.params;
      
      const reviewsQuery = `
        SELECT 
          dg.XepHang,
          dg.BinhLuan,
          dg.NgayDanhGia,
          nd.HoTen,
          nd.AnhDaiDien
        FROM DanhGiaKhoaHoc dg
        INNER JOIN NguoiDung nd ON dg.MaNguoiDung = nd.MaNguoiDung
        WHERE dg.MaKhoaHoc = @id
        ORDER BY dg.NgayDanhGia DESC
      `;
      
      const result = await query(reviewsQuery, { id });
      
      res.json({
        success: true,
        data: result.recordset
      });
      
    } catch (error) {
      console.error('Get course reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải đánh giá'
      });
    }
  }
}

module.exports = new CourseController();
