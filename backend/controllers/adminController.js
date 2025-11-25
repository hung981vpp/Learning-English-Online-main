const sql = require('mssql');
const dbConfig = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query('SELECT MaNguoiDung, HoTen, Email, MaVaiTro, NgayTao FROM NguoiDung ORDER BY NgayTao DESC');
        
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách người dùng'
        });
    }
};

// Add new user
const addUser = async (req, res) => {
    const { HoTen, Email, MatKhau, MaVaiTro } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        // Check if email exists
        const checkEmail = await pool.request()
            .input('Email', sql.NVarChar, Email)
            .query('SELECT MaNguoiDung FROM NguoiDung WHERE Email = @Email');
        
        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(MatKhau, 10);
        
        // Generate username from email (part before @)
        const TenDangNhap = Email.split('@')[0];
        
        // Insert user
        await pool.request()
            .input('TenDangNhap', sql.NVarChar, TenDangNhap)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('Email', sql.NVarChar, Email)
            .input('MatKhau', sql.NVarChar, hashedPassword)
            .input('MaVaiTro', sql.Int, MaVaiTro)
            .query(`
                INSERT INTO NguoiDung (TenDangNhap, HoTen, Email, MatKhau, MaVaiTro, NgayTao)
                VALUES (@TenDangNhap, @HoTen, @Email, @MatKhau, @MaVaiTro, GETDATE())
            `);
        
        return res.json({
            success: true,
            message: 'Thêm người dùng thành công'
        });
    } catch (error) {
        console.error('Add user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm người dùng'
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { HoTen, Email, MaVaiTro } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        // Check if email exists for other users
        const checkEmail = await pool.request()
            .input('Email', sql.NVarChar, Email)
            .input('MaNguoiDung', sql.Int, id)
            .query('SELECT MaNguoiDung FROM NguoiDung WHERE Email = @Email AND MaNguoiDung != @MaNguoiDung');
        
        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại'
            });
        }
        
        // Update user
        await pool.request()
            .input('MaNguoiDung', sql.Int, id)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('Email', sql.NVarChar, Email)
            .input('MaVaiTro', sql.Int, MaVaiTro)
            .query(`
                UPDATE NguoiDung 
                SET HoTen = @HoTen, Email = @Email, MaVaiTro = @MaVaiTro
                WHERE MaNguoiDung = @MaNguoiDung
            `);
        
        return res.json({
            success: true,
            message: 'Cập nhật người dùng thành công'
        });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật người dùng'
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        // Check if user exists
        const checkUser = await pool.request()
            .input('MaNguoiDung', sql.Int, id)
            .query('SELECT MaNguoiDung FROM NguoiDung WHERE MaNguoiDung = @MaNguoiDung');
        
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        // Delete user
        await pool.request()
            .input('MaNguoiDung', sql.Int, id)
            .query('DELETE FROM NguoiDung WHERE MaNguoiDung = @MaNguoiDung');
        
        return res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa người dùng'
        });
    }
};

// Get all teachers
const getAllTeachers = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query('SELECT MaNguoiDung, HoTen, Email FROM NguoiDung WHERE MaVaiTro = 2 ORDER BY HoTen');
        
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get teachers error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách giáo viên'
        });
    }
};

// Get all courses
const getAllCourses = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT 
                    k.*,
                    CASE 
                        WHEN nd.MaVaiTro = 3 THEN 'Admin'
                        ELSE nd.HoTen
                    END as TenNguoiTao,
                    ISNULL(k.LuotDangKy, 0) as SoHocVien
                FROM KhoaHoc k
                LEFT JOIN NguoiDung nd ON k.NguoiTao = nd.MaNguoiDung
                ORDER BY k.NgayTao DESC
            `);
        
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get all courses error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách khóa học'
        });
    }
};

// Add new course
const addCourse = async (req, res) => {
    const { TenKhoaHoc, MoTa, CapDoCEFR, AnhBia, NguoiTao } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        // Use default category ID = 1
        const maDanhMuc = 1;
        
        const nguoiTao = NguoiTao || 1;
        
        await pool.request()
            .input('TenKhoaHoc', sql.NVarChar, TenKhoaHoc)
            .input('MoTa', sql.NVarChar, MoTa || null)
            .input('CapDoCEFR', sql.NVarChar, CapDoCEFR || 'A1')
            .input('AnhBia', sql.NVarChar, AnhBia || null)
            .input('NguoiTao', sql.Int, nguoiTao)
            .input('MaDanhMuc', sql.Int, maDanhMuc)
            .input('TrangThai', sql.NVarChar, 'active')
            .query(`
                INSERT INTO KhoaHoc (TenKhoaHoc, MoTa, CapDoCEFR, AnhBia, NguoiTao, MaDanhMuc, TrangThai, NgayTao, NgayCapNhat)
                VALUES (@TenKhoaHoc, @MoTa, @CapDoCEFR, @AnhBia, @NguoiTao, @MaDanhMuc, @TrangThai, GETDATE(), GETDATE())
            `);
        
        return res.json({
            success: true,
            message: 'Thêm khóa học thành công'
        });
    } catch (error) {
        console.error('Add course error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm khóa học'
        });
    }
};

// Update course
const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { TenKhoaHoc, MoTa, CapDoCEFR, AnhBia, NguoiTao } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('MaKhoaHoc', sql.Int, id)
            .input('TenKhoaHoc', sql.NVarChar, TenKhoaHoc)
            .input('MoTa', sql.NVarChar, MoTa || null)
            .input('CapDoCEFR', sql.NVarChar, CapDoCEFR)
            .input('AnhBia', sql.NVarChar, AnhBia || null)
            .input('NguoiTao', sql.Int, NguoiTao)
            .query(`
                UPDATE KhoaHoc 
                SET TenKhoaHoc = @TenKhoaHoc, MoTa = @MoTa, CapDoCEFR = @CapDoCEFR, 
                    AnhBia = @AnhBia, NguoiTao = @NguoiTao, NgayCapNhat = GETDATE()
                WHERE MaKhoaHoc = @MaKhoaHoc
            `);
        
        return res.json({
            success: true,
            message: 'Cập nhật khóa học thành công'
        });
    } catch (error) {
        console.error('Update course error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật khóa học'
        });
    }
};

// Delete course
const deleteCourse = async (req, res) => {
    const { id } = req.params;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('MaKhoaHoc', sql.Int, id)
            .query('DELETE FROM KhoaHoc WHERE MaKhoaHoc = @MaKhoaHoc');
        
        return res.json({
            success: true,
            message: 'Xóa khóa học thành công'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa khóa học'
        });
    }
};

// Get all quizzes
const getAllQuizzes = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT 
                    bkt.*,
                    kh.TenKhoaHoc,
                    (SELECT COUNT(*) FROM CauHoi WHERE MaBaiKiemTra = bkt.MaBaiKiemTra) as SoCauHoi,
                    (SELECT COUNT(*) FROM KetQuaKiemTra WHERE MaBaiKiemTra = bkt.MaBaiKiemTra) as LuotLam
                FROM BaiKiemTra bkt
                LEFT JOIN KhoaHoc kh ON bkt.MaKhoaHoc = kh.MaKhoaHoc
                ORDER BY bkt.NgayTao DESC
            `);
        
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get all quizzes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách bài kiểm tra'
        });
    }
};

// Add new quiz
const addQuiz = async (req, res) => {
    const { TenBaiKiemTra, MoTa, MaKhoaHoc, ThoiGianLamBai, DiemToiThieu, SoLanLamToiDa } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('TenBaiKiemTra', sql.NVarChar, TenBaiKiemTra)
            .input('MoTa', sql.NVarChar, MoTa || null)
            .input('MaKhoaHoc', sql.Int, MaKhoaHoc)
            .input('ThoiGianLamBai', sql.Int, ThoiGianLamBai || 30)
            .input('DiemToiThieu', sql.Float, DiemToiThieu || 5)
            .input('SoLanLamToiDa', sql.Int, SoLanLamToiDa || 3)
            .query(`
                INSERT INTO BaiKiemTra (TenBaiKiemTra, MoTa, MaKhoaHoc, ThoiGianLamBai, DiemToiThieu, SoLanLamToiDa, NgayTao)
                VALUES (@TenBaiKiemTra, @MoTa, @MaKhoaHoc, @ThoiGianLamBai, @DiemToiThieu, @SoLanLamToiDa, GETDATE())
            `);
        
        return res.json({
            success: true,
            message: 'Thêm bài kiểm tra thành công'
        });
    } catch (error) {
        console.error('Add quiz error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm bài kiểm tra'
        });
    }
};

// Update quiz
const updateQuiz = async (req, res) => {
    const { id } = req.params;
    const { TenBaiKiemTra, MoTa, MaKhoaHoc, ThoiGianLamBai, DiemToiThieu, SoLanLamToiDa } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('MaBaiKiemTra', sql.Int, id)
            .input('TenBaiKiemTra', sql.NVarChar, TenBaiKiemTra)
            .input('MoTa', sql.NVarChar, MoTa || null)
            .input('MaKhoaHoc', sql.Int, MaKhoaHoc)
            .input('ThoiGianLamBai', sql.Int, ThoiGianLamBai)
            .input('DiemToiThieu', sql.Float, DiemToiThieu)
            .input('SoLanLamToiDa', sql.Int, SoLanLamToiDa)
            .query(`
                UPDATE BaiKiemTra 
                SET TenBaiKiemTra = @TenBaiKiemTra, MoTa = @MoTa, MaKhoaHoc = @MaKhoaHoc,
                    ThoiGianLamBai = @ThoiGianLamBai, DiemToiThieu = @DiemToiThieu, SoLanLamToiDa = @SoLanLamToiDa
                WHERE MaBaiKiemTra = @MaBaiKiemTra
            `);
        
        return res.json({
            success: true,
            message: 'Cập nhật bài kiểm tra thành công'
        });
    } catch (error) {
        console.error('Update quiz error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật bài kiểm tra'
        });
    }
};

// Delete quiz
const deleteQuiz = async (req, res) => {
    const { id } = req.params;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('MaBaiKiemTra', sql.Int, id)
            .query('DELETE FROM BaiKiemTra WHERE MaBaiKiemTra = @MaBaiKiemTra');
        
        return res.json({
            success: true,
            message: 'Xóa bài kiểm tra thành công'
        });
    } catch (error) {
        console.error('Delete quiz error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bài kiểm tra'
        });
    }
};

// Get all lessons
const getAllLessons = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT 
                    bh.*,
                    kh.TenKhoaHoc
                FROM BaiHoc bh
                LEFT JOIN KhoaHoc kh ON bh.MaKhoaHoc = kh.MaKhoaHoc
                ORDER BY bh.MaKhoaHoc, bh.ThuTu
            `);
        
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get all lessons error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách bài học'
        });
    }
};

// Add new lesson
const addLesson = async (req, res) => {
    const { TenBaiHoc, NoiDung, MaKhoaHoc, ThuTu, ThoiLuong, VideoUrl } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('TenBaiHoc', sql.NVarChar, TenBaiHoc)
            .input('NoiDung', sql.NVarChar, NoiDung || null)
            .input('MaKhoaHoc', sql.Int, MaKhoaHoc)
            .input('ThuTu', sql.Int, ThuTu || 1)
            .input('ThoiLuong', sql.Int, ThoiLuong || 30)
            .input('VideoUrl', sql.NVarChar, VideoUrl || null)
            .query(`
                INSERT INTO BaiHoc (TenBaiHoc, NoiDung, MaKhoaHoc, ThuTu, ThoiLuong, VideoUrl, NgayTao)
                VALUES (@TenBaiHoc, @NoiDung, @MaKhoaHoc, @ThuTu, @ThoiLuong, @VideoUrl, GETDATE())
            `);
        
        return res.json({
            success: true,
            message: 'Thêm bài học thành công'
        });
    } catch (error) {
        console.error('Add lesson error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm bài học'
        });
    }
};

// Update lesson
const updateLesson = async (req, res) => {
    const { id } = req.params;
    const { TenBaiHoc, NoiDung, MaKhoaHoc, ThuTu, ThoiLuong, VideoUrl } = req.body;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('MaBaiHoc', sql.Int, id)
            .input('TenBaiHoc', sql.NVarChar, TenBaiHoc)
            .input('NoiDung', sql.NVarChar, NoiDung || null)
            .input('MaKhoaHoc', sql.Int, MaKhoaHoc)
            .input('ThuTu', sql.Int, ThuTu)
            .input('ThoiLuong', sql.Int, ThoiLuong)
            .input('VideoUrl', sql.NVarChar, VideoUrl || null)
            .query(`
                UPDATE BaiHoc 
                SET TenBaiHoc = @TenBaiHoc, NoiDung = @NoiDung, MaKhoaHoc = @MaKhoaHoc,
                    ThuTu = @ThuTu, ThoiLuong = @ThoiLuong, VideoUrl = @VideoUrl
                WHERE MaBaiHoc = @MaBaiHoc
            `);
        
        return res.json({
            success: true,
            message: 'Cập nhật bài học thành công'
        });
    } catch (error) {
        console.error('Update lesson error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật bài học'
        });
    }
};

// Delete lesson
const deleteLesson = async (req, res) => {
    const { id } = req.params;
    
    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('MaBaiHoc', sql.Int, id)
            .query('DELETE FROM BaiHoc WHERE MaBaiHoc = @MaBaiHoc');
        
        return res.json({
            success: true,
            message: 'Xóa bài học thành công'
        });
    } catch (error) {
        console.error('Delete lesson error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bài học'
        });
    }
};

// Get all flashcards from JSON
const getAllFlashcards = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const flashcardDataPath = path.join(__dirname, '../../frontend/data/flashcard-data.json');
        const flashcardData = JSON.parse(fs.readFileSync(flashcardDataPath, 'utf8'));
        
        // Flatten flashcard sets into individual cards
        const allCards = [];
        flashcardData.flashcardSets.forEach((set, setIndex) => {
            set.cards.forEach((card, cardIndex) => {
                allCards.push({
                    MaTheGhiNho: card.id,
                    MatTruoc: card.front,
                    MatSau: card.back,
                    GoiY: card.phonetic || '',
                    ViDu: card.example || '',
                    TenKhoaHoc: set.title,
                    MaKhoaHoc: set.id,
                    DoKho: set.level === 'A1' ? 1 : set.level === 'B1' ? 2 : 3,
                    NgayTao: new Date().toISOString()
                });
            });
        });
        
        return res.json({
            success: true,
            data: allCards
        });
    } catch (error) {
        console.error('Get all flashcards error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách flashcard'
        });
    }
};

// Add new flashcard to JSON
const addFlashcard = async (req, res) => {
    const { MatTruoc, MatSau, GoiY, MaKhoaHoc, DoKho, ViDu } = req.body;
    
    try {
        const fs = require('fs');
        const path = require('path');
        const flashcardDataPath = path.join(__dirname, '../../frontend/data/flashcard-data.json');
        const flashcardData = JSON.parse(fs.readFileSync(flashcardDataPath, 'utf8'));
        
        // Find the set or create new one
        let targetSet = flashcardData.flashcardSets.find(s => s.id === MaKhoaHoc);
        if (!targetSet) {
            targetSet = {
                id: MaKhoaHoc,
                title: 'New Set',
                description: '',
                topic: 'General',
                level: DoKho === 1 ? 'A1' : DoKho === 2 ? 'B1' : 'C1',
                cards: []
            };
            flashcardData.flashcardSets.push(targetSet);
        }
        
        // Add new card
        const newCard = {
            id: Math.max(...flashcardData.flashcardSets.flatMap(s => s.cards.map(c => c.id)), 0) + 1,
            front: MatTruoc,
            back: MatSau,
            example: ViDu || '',
            phonetic: GoiY || '',
            type: 'word'
        };
        
        targetSet.cards.push(newCard);
        
        // Save back to file
        fs.writeFileSync(flashcardDataPath, JSON.stringify(flashcardData, null, 2), 'utf8');
        
        return res.json({
            success: true,
            message: 'Thêm flashcard thành công'
        });
    } catch (error) {
        console.error('Add flashcard error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm flashcard'
        });
    }
};

// Update flashcard in JSON
const updateFlashcard = async (req, res) => {
    const { id } = req.params;
    const { MatTruoc, MatSau, GoiY, MaKhoaHoc, DoKho, ViDu } = req.body;
    
    try {
        const fs = require('fs');
        const path = require('path');
        const flashcardDataPath = path.join(__dirname, '../../frontend/data/flashcard-data.json');
        const flashcardData = JSON.parse(fs.readFileSync(flashcardDataPath, 'utf8'));
        
        // Find and update the card
        let found = false;
        for (let set of flashcardData.flashcardSets) {
            const cardIndex = set.cards.findIndex(c => c.id === parseInt(id));
            if (cardIndex !== -1) {
                set.cards[cardIndex].front = MatTruoc;
                set.cards[cardIndex].back = MatSau;
                set.cards[cardIndex].example = ViDu || '';
                set.cards[cardIndex].phonetic = GoiY || '';
                found = true;
                break;
            }
        }
        
        if (!found) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy flashcard'
            });
        }
        
        // Save back to file
        fs.writeFileSync(flashcardDataPath, JSON.stringify(flashcardData, null, 2), 'utf8');
        
        return res.json({
            success: true,
            message: 'Cập nhật flashcard thành công'
        });
    } catch (error) {
        console.error('Update flashcard error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật flashcard'
        });
    }
};

// Delete flashcard from JSON
const deleteFlashcard = async (req, res) => {
    const { id } = req.params;
    
    try {
        const fs = require('fs');
        const path = require('path');
        const flashcardDataPath = path.join(__dirname, '../../frontend/data/flashcard-data.json');
        const flashcardData = JSON.parse(fs.readFileSync(flashcardDataPath, 'utf8'));
        
        // Find and delete the card
        let found = false;
        for (let set of flashcardData.flashcardSets) {
            const cardIndex = set.cards.findIndex(c => c.id === parseInt(id));
            if (cardIndex !== -1) {
                set.cards.splice(cardIndex, 1);
                found = true;
                break;
            }
        }
        
        if (!found) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy flashcard'
            });
        }
        
        // Save back to file
        fs.writeFileSync(flashcardDataPath, JSON.stringify(flashcardData, null, 2), 'utf8');
        
        return res.json({
            success: true,
            message: 'Xóa flashcard thành công'
        });
    } catch (error) {
        console.error('Delete flashcard error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa flashcard'
        });
    }
};

// Get all quiz results
const getAllResults = async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .query(`
                SELECT 
                    kq.*,
                    nd.HoTen,
                    nd.Email,
                    bkt.TenBaiKiemTra
                FROM KetQuaKiemTra kq
                INNER JOIN NguoiDung nd ON kq.MaNguoiDung = nd.MaNguoiDung
                INNER JOIN BaiKiemTra bkt ON kq.MaBaiKiemTra = bkt.MaBaiKiemTra
                ORDER BY kq.NgayLamBai DESC
            `);
        
        return res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Get all results error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải danh sách kết quả'
        });
    }
};

module.exports = {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    getAllTeachers,
    getAllCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    getAllQuizzes,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    getAllLessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getAllFlashcards,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    getAllResults
};
