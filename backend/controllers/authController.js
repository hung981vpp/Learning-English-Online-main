// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { isAdminEmail, verifyAdminPassword, getAdminAccount } = require('../config/admin');

class AuthController {
  // Đăng ký (chỉ cho học viên và giáo viên)
  async register(req, res) {
    try {
      const { hoTen, email, tenDangNhap, matKhau, soDienThoai } = req.body;
      
      // Validation
      if (!hoTen || !email || !tenDangNhap || !matKhau) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin'
        });
      }
      
      // Kiểm tra không cho đăng ký bằng email admin
      if (isAdminEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email này không thể sử dụng để đăng ký'
        });
      }
      
      if (matKhau.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
      }
      
      // Kiểm tra email đã tồn tại
      const checkEmail = await query(
        'SELECT * FROM NguoiDung WHERE Email = @email',
        { email }
      );
      
      if (checkEmail.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
      
      // Kiểm tra tên đăng nhập đã tồn tại
      const checkUsername = await query(
        'SELECT * FROM NguoiDung WHERE TenDangNhap = @tenDangNhap',
        { tenDangNhap }
      );
      
      if (checkUsername.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập đã được sử dụng'
        });
      }
      
      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(matKhau, 10);
      
      // Tạo user mới (MaVaiTro = 1 là Học viên)
      const insertQuery = `
        INSERT INTO NguoiDung (TenDangNhap, Email, MatKhau, HoTen, SoDienThoai, MaVaiTro)
        OUTPUT INSERTED.MaNguoiDung
        VALUES (@tenDangNhap, @email, @matKhau, @hoTen, @soDienThoai, 1)
      `;
      
      const result = await query(insertQuery, {
        tenDangNhap,
        email,
        matKhau: hashedPassword,
        hoTen,
        soDienThoai: soDienThoai || null
      });
      
      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        userId: result.recordset[0].MaNguoiDung
      });
      
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng ký'
      });
    }
  }
  
  // Đăng nhập (cho cả admin và user)
  async login(req, res) {
    try {
      const { email, matKhau } = req.body;
      
      // Validation
      if (!email || !matKhau) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email và mật khẩu'
        });
      }
      
      // ===== KIỂM TRA ADMIN TRƯỚC =====
      if (isAdminEmail(email)) {
        const isValidPassword = await verifyAdminPassword(matKhau);
        
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Email hoặc mật khẩu không chính xác'
          });
        }
        
        // Tạo JWT token cho admin
        const adminAccount = getAdminAccount();
        const token = jwt.sign(
          {
            id: adminAccount.id,
            email: adminAccount.email,
            role: adminAccount.role,
            isAdmin: true
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        return res.json({
          success: true,
          message: 'Đăng nhập Admin thành công',
          token,
          user: {
            id: adminAccount.id,
            hoTen: adminAccount.fullName,
            email: adminAccount.email,
            role: 'Quản trị',
            isAdmin: true
          }
        });
      }
      
      // ===== KIỂM TRA USER TRONG DATABASE =====
      const userQuery = `
        SELECT nd.*, vt.TenVaiTro
        FROM NguoiDung nd
        INNER JOIN VaiTro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.Email = @email
      `;
      
      const result = await query(userQuery, { email });
      
      if (result.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        });
      }
      
      const user = result.recordset[0];
      
      // Kiểm tra mật khẩu
      const isValidPassword = await bcrypt.compare(matKhau, user.MatKhau);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác'
        });
      }
      
      // Tạo JWT token
      const token = jwt.sign(
        {
          id: user.MaNguoiDung,
          email: user.Email,
          role: user.TenVaiTro,
          isAdmin: false
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: user.MaNguoiDung,
          hoTen: user.HoTen,
          email: user.Email,
          role: user.TenVaiTro,
          isAdmin: false
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng nhập'
      });
    }
  }
  
  // Lấy thông tin user hiện tại
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;
      
      // Nếu là admin, trả về thông tin admin
      if (isAdmin) {
        const adminAccount = getAdminAccount();
        return res.json({
          success: true,
          data: {
            MaNguoiDung: adminAccount.id,
            HoTen: adminAccount.fullName,
            Email: adminAccount.email,
            TenVaiTro: 'Quản trị',
            isAdmin: true
          }
        });
      }
      
      // Nếu là user thường, lấy từ database
      const userQuery = `
        SELECT nd.MaNguoiDung, nd.HoTen, nd.Email, nd.SoDienThoai, nd.AnhDaiDien, vt.TenVaiTro
        FROM NguoiDung nd
        INNER JOIN VaiTro vt ON nd.MaVaiTro = vt.MaVaiTro
        WHERE nd.MaNguoiDung = @userId
      `;
      
      const result = await query(userQuery, { userId });
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      
      res.json({
        success: true,
        data: {
          ...result.recordset[0],
          isAdmin: false
        }
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin'
      });
    }
  }
  
  // Đổi mật khẩu
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;
      const { matKhauCu, matKhauMoi } = req.body;
      
      // Admin không thể đổi mật khẩu qua API (phải đổi trong .env)
      if (isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Không thể đổi mật khẩu Admin qua API. Vui lòng liên hệ quản trị hệ thống.'
        });
      }
      
      // Validation
      if (!matKhauCu || !matKhauMoi) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ thông tin'
        });
      }
      
      if (matKhauMoi.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }
      
      // Lấy user hiện tại
      const getUserQuery = `
        SELECT MatKhau FROM NguoiDung WHERE MaNguoiDung = @userId
      `;
      
      const userResult = await query(getUserQuery, { userId });
      
      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      
      // Kiểm tra mật khẩu cũ
      const isValidPassword = await bcrypt.compare(
        matKhauCu, 
        userResult.recordset[0].MatKhau
      );
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu cũ không chính xác'
        });
      }
      
      // Hash mật khẩu mới
      const hashedNewPassword = await bcrypt.hash(matKhauMoi, 10);
      
      // Cập nhật mật khẩu
      const updateQuery = `
        UPDATE NguoiDung 
        SET MatKhau = @matKhauMoi, NgayCapNhat = GETDATE()
        WHERE MaNguoiDung = @userId
      `;
      
      await query(updateQuery, { 
        matKhauMoi: hashedNewPassword, 
        userId 
      });
      
      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đổi mật khẩu'
      });
    }
  }
}

module.exports = new AuthController();
