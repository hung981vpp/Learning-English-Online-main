const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { getConnection } = require('./config/database');
const { initAdminPassword } = require('./config/admin');

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const quizRoutes = require('./routes/quizRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Cho phép cổng 3000 truy cập
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api', quizRoutes);
app.use('/api', flashcardRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy endpoint'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await getConnection();
    console.log('✅ Kết nối database thành công');
    
    // Khởi tạo admin password
    await initAdminPassword();
    console.log('✅ Khởi tạo tài khoản Admin thành công');
    console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
    
    app.listen(PORT, () => {
      console.log('🚀 ========================================');
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
      console.log('🚀 ========================================');
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server:', error);
    process.exit(1);
  }
};

startServer();
