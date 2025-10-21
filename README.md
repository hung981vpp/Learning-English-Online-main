# 🎓 Learning English Online - Website học tiếng Anh trực tuyến

Dự án website học tiếng Anh trực tuyến với đầy đủ các tính năng quản lý khóa học, bài học, kiểm tra và theo dõi tiến độ học tập.

## 📋 Thông tin dự án

- **Tên dự án**: Learning English Online
- **Nhóm**: CNTT17-10 - Nhóm 6
- **Thành viên**:
  - Vương Thị Ngọc Ánh - 1771020066
  - Đàm Vĩnh Hưng - 1771020333
  - Phạm Thị Yến Anh - 1771020060
  - Nguyễn Minh Tuân - 1771020713
- **Giảng viên hướng dẫn**: ThS. Phạm Thị Tố Nga

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** v18+ với Express.js
- **SQL Server** (Named Instance)
- **JWT** cho authentication
- **bcryptjs** cho mã hóa mật khẩu
- **mssql** driver cho SQL Server

### Frontend
- **HTML5**, **CSS3**, **JavaScript** (Vanilla)
- **Bootstrap 5.3** - UI Framework
- **Font Awesome 6.4** - Icons

## 📁 Cấu trúc dự án
```
Learning-English-Online/
├── backend/
│ ├── config/
│ │ ├── database.js # Cấu hình database
│ │ └── admin.js # Cấu hình admin account
│ ├── controllers/
│ │ ├── authController.js # Xử lý authentication
│ │ ├── courseController.js # Xử lý khóa học
│ │ ├── lessonController.js # Xử lý bài học
│ │ └── quizController.js # Xử lý bài kiểm tra
│ ├── middleware/
│ │ └── authMiddleware.js # Middleware xác thực
│ ├── routes/
│ │ ├── authRoutes.js
│ │ ├── courseRoutes.js
│ │ ├── lessonRoutes.js
│ │ └── quizRoutes.js
│ ├── .env # Environment variables
│ ├── index.js # Entry point
│ └── package.json
├── frontend/
│ ├── assets/
│ │ ├── css/
│ │ │ └── style.css # Custom styles
│ │ └── js/
│ │ ├── api.js # API wrapper
│ │ ├── auth.js # Auth helpers
│ │ └── main.js # Utilities
│ ├── pages/
│ │ ├── courses.html # Danh sách khóa học
│ │ ├── course-detail.html # Chi tiết khóa học
│ │ ├── my-courses.html # Khóa học của tôi
│ │ ├── lesson.html # Trang học bài
│ │ ├── quiz.html # Làm bài kiểm tra
│ │ └── profile.html # Trang cá nhân
│ ├── index.html # Trang chủ
│ ├── login.html # Đăng nhập
│ └── register.html # Đăng ký
├── database/
│ └── schema.sql # Database schema
├── .gitignore
└── README.md
```

## 🚀 Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống

- **Node.js** v18 trở lên
- **SQL Server** 2019 trở lên
- **Git**

### 2. Cài đặt Database

#### Bước 1: Tạo database trong SQL Server
```
CREATE DATABASE HOC_TIENGANH_DB;
GO
```

#### Bước 2: Chạy script tạo tables
Mở file `database/schema.sql` trong SQL Server Management Studio và execute.

#### Bước 3: Tạo login cho ứng dụng
```
-- Tạo login
CREATE LOGIN your_username WITH PASSWORD = 'your_password';
GO

-- Cấp quyền
USE HOC_TIENGANH_DB;
GO
CREATE USER your_username FOR LOGIN your_username;
ALTER ROLE db_owner ADD MEMBER your_username;
GO
```
### 3. Cài đặt Backend
```
Di chuyển vào thư mục backend
cd backend

Cài đặt dependencies
npm install

Tạo file .env
cp .env.example .env

Sửa file .env với thông tin của bạn
text
```
**File `.env` mẫu:**
```
Server
PORT=3001
NODE_ENV=development

Database
DB_SERVER=LAPTOP-HWUNGG\MAYAO
DB_DATABASE=HOC_TIENGANH_DB
DB_USER=your_username
DB_PASSWORD=your_password

JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

CORS
CORS_ORIGIN=http://localhost:3000

Admin Account
ADMIN_EMAIL=admin@learningenglish.com
ADMIN_PASSWORD=Admin@123456
ADMIN_USERNAME=admin
ADMIN_FULLNAME=Quản trị hệ thống
```
### 4. Chạy ứng dụng

#### Backend:
```
cd backend
npm run dev

Server sẽ chạy tại: `http://localhost:3001`
```
#### Frontend:
Mở file `frontend/index.html` bằng Live Server hoặc truy cập qua:
Sử dụng http-server (nếu đã cài)
```
npx http-server frontend -p 3000
```
Frontend sẽ chạy tại: `http://localhost:3000`

## 🔑 Tài khoản mặc định

### Admin
- **Email**: admin@learningenglish.com
- **Password**: Admin@123456

### Học viên
- **Email**: student1@email.com
- **Password**: 123456

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin user
- `PUT /api/auth/change-password` - Đổi mật khẩu

### Courses
- `GET /api/courses` - Lấy danh sách khóa học
- `GET /api/courses/:id` - Chi tiết khóa học
- `GET /api/courses/my/courses` - Khóa học của tôi
- `POST /api/courses/enroll` - Đăng ký khóa học
- `POST /api/courses/rate` - Đánh giá khóa học
- `GET /api/courses/categories` - Danh mục khóa học

### Lessons
- `GET /api/lessons/:id` - Chi tiết bài học
- `POST /api/lessons/start` - Bắt đầu học
- `POST /api/lessons/complete` - Hoàn thành bài học

### Quiz
- `GET /api/quiz/course/:courseId` - Quiz theo khóa học
- `GET /api/quiz/:id/info` - Thông tin quiz
- `GET /api/quiz/:id/start` - Bắt đầu làm quiz
- `POST /api/quiz/submit` - Nộp bài
- `GET /api/quiz/result/:id` - Xem kết quả

## 🎯 Tính năng chính

### Học viên
- ✅ Đăng ký, đăng nhập tài khoản
- ✅ Duyệt và tìm kiếm khóa học
- ✅ Đăng ký học khóa học
- ✅ Học bài học (video, audio, text)
- ✅ Làm bài kiểm tra
- ✅ Theo dõi tiến độ học tập
- ✅ Đánh giá khóa học
- ✅ Quản lý thông tin cá nhân

### Admin
- ✅ Quản lý người dùng
- ✅ Quản lý khóa học
- ✅ Quản lý bài học
- ✅ Quản lý bài kiểm tra
- ✅ Xem thống kê

## 🐛 Troubleshooting

### Lỗi kết nối SQL Server
Kiểm tra SQL Server đang chạy
services.msc → SQL Server (MAYAO)

Kiểm tra SQL Server Browser
services.msc → SQL Server Browser

Enable Mixed Mode Authentication
SQL Server Properties → Security → SQL Server and Windows Authentication mode

text

### Lỗi CORS
Đảm bảo `CORS_ORIGIN` trong `.env` khớp với URL frontend của bạn.

### Lỗi JWT
Thay đổi `JWT_SECRET` trong `.env` thành giá trị ngẫu nhiên phức tạp.

## 📞 Liên hệ

- Email: info@learningenglish.com
- GitHub: [your-repo-url]

## 📝 License

MIT License - Copyright (c) 2025 CNTT17-10 Nhóm 6

---

**Made with ❤️ by CNTT17-10 - Nhóm 6**