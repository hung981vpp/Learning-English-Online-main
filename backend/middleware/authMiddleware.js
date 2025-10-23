// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        const token = authHeader.substring(7); // Bỏ "Bearer "
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('=== AUTH MIDDLEWARE DEBUG ===');
        console.log('Decoded token:', decoded);
        
        // ===== FIX: Set đúng tên field =====
        req.user = {
            userId: decoded.userId || decoded.id,  // Hỗ trợ cả 2
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role,
            isAdmin: decoded.isAdmin || false
        };
        
        console.log('req.user set to:', req.user);
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Middleware chỉ cho phép admin
const adminOnly = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền truy cập'
        });
    }
    
    next();
};

module.exports = { authMiddleware, adminOnly };
