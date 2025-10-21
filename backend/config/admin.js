// backend/config/admin.js
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Tài khoản admin hard-coded (không lưu trong database)
const ADMIN_ACCOUNT = {
  id: 0, // ID đặc biệt để phân biệt với user trong DB
  email: process.env.ADMIN_EMAIL || 'admin@learningenglish.com',
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  fullName: process.env.ADMIN_FULLNAME || 'Quản trị hệ thống',
  role: 'admin',
  permissions: ['all'] // Full quyền
};

// Hash password để so sánh (chỉ hash 1 lần khi khởi động server)
let hashedAdminPassword = null;

const initAdminPassword = async () => {
  if (!hashedAdminPassword) {
    hashedAdminPassword = await bcrypt.hash(ADMIN_ACCOUNT.password, 10);
  }
};

const getAdminAccount = () => {
  return {
    ...ADMIN_ACCOUNT,
    password: undefined // Không trả về plain password
  };
};

const isAdminEmail = (email) => {
  return email.toLowerCase() === ADMIN_ACCOUNT.email.toLowerCase();
};

const verifyAdminPassword = async (password) => {
  await initAdminPassword();
  return bcrypt.compare(password, hashedAdminPassword);
};

module.exports = {
  ADMIN_ACCOUNT,
  getAdminAccount,
  isAdminEmail,
  verifyAdminPassword,
  initAdminPassword
};
