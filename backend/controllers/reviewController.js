// backend/controllers/reviewController.js
const sql = require('mssql');

class ReviewController {
    /**
     * Lấy tất cả đánh giá của một khóa học
     */
    async getCourseReviews(req, res) {
        try {
            const { id } = req.params;

            const pool = await sql.connect();
            const result = await pool.request()
                .input('courseId', sql.Int, id)
                .query(`
                    SELECT 
                        dg.MaDanhGia,
                        dg.XepHang as DiemDanhGia,
                        dg.BinhLuan as NhanXet,
                        dg.NgayDanhGia,
                        nd.HoTen,
                        nd.AnhDaiDien
                    FROM DanhGiaKhoaHoc dg
                    INNER JOIN NguoiDung nd ON dg.MaNguoiDung = nd.MaNguoiDung
                    WHERE dg.MaKhoaHoc = @courseId
                    ORDER BY dg.NgayDanhGia DESC
                `);

            return res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('Get reviews error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tải đánh giá'
            });
        }
    }

    /**
     * Thêm hoặc cập nhật đánh giá
     */
    async submitReview(req, res) {
        try {
            const { id } = req.params;
            const { diemDanhGia, nhanXet } = req.body;
            const userId = req.user.userId;

            // Validate
            if (!diemDanhGia || diemDanhGia < 1 || diemDanhGia > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Điểm đánh giá phải từ 1-5'
                });
            }

            if (!nhanXet || nhanXet.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập nhận xét'
                });
            }

            const pool = await sql.connect();

            // ===== SỬA TÊN BẢNG: DangKyKhoaHoc =====
            const enrollmentCheck = await pool.request()
                .input('userId', sql.Int, userId)
                .input('courseId', sql.Int, id)
                .query(`
                    SELECT * FROM DangKyKhoaHoc 
                    WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
                `);

            if (enrollmentCheck.recordset.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn phải đăng ký khóa học trước khi đánh giá'
                });
            }

            // Kiểm tra đã đánh giá chưa
            const existingReview = await pool.request()
                .input('userId', sql.Int, userId)
                .input('courseId', sql.Int, id)
                .query('SELECT * FROM DanhGiaKhoaHoc WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId');

            if (existingReview.recordset.length > 0) {
                // Cập nhật đánh giá cũ
                await pool.request()
                    .input('rating', sql.Int, diemDanhGia)
                    .input('comment', sql.NVarChar, nhanXet)
                    .input('userId', sql.Int, userId)
                    .input('courseId', sql.Int, id)
                    .query(`
                        UPDATE DanhGiaKhoaHoc 
                        SET XepHang = @rating, BinhLuan = @comment, NgayDanhGia = GETDATE()
                        WHERE MaNguoiDung = @userId AND MaKhoaHoc = @courseId
                    `);

                return res.json({
                    success: true,
                    message: 'Cập nhật đánh giá thành công'
                });
            } else {
                // Thêm đánh giá mới
                await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('courseId', sql.Int, id)
                    .input('rating', sql.Int, diemDanhGia)
                    .input('comment', sql.NVarChar, nhanXet)
                    .query(`
                        INSERT INTO DanhGiaKhoaHoc (MaNguoiDung, MaKhoaHoc, XepHang, BinhLuan, NgayDanhGia)
                        VALUES (@userId, @courseId, @rating, @comment, GETDATE())
                    `);

                return res.json({
                    success: true,
                    message: 'Đánh giá thành công'
                });
            }
        } catch (error) {
            console.error('Submit review error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi gửi đánh giá'
            });
        }
    }
}

module.exports = new ReviewController();
