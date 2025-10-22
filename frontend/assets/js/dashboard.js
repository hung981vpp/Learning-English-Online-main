// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    loadUserInfo();
    loadDashboardData();
    loadDashboardStats(); // ← Thêm dòng này
    initSidebarToggle();
});

function loadUserInfo() {
    const user = getCurrentUser();
    
    if (user) {
        document.getElementById('userName').textContent = user.hoTen || 'User';
        document.getElementById('userRole').textContent = user.isAdmin ? 'Admin' : 'Học viên';
        
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.hoTen || 'User')}&background=4A90E2&color=fff`;
        document.getElementById('userAvatar').src = avatarUrl;
        
        if (user.isAdmin) {
            document.getElementById('adminDivider').style.display = 'block';
            document.getElementById('adminUsers').style.display = 'block';
            document.getElementById('adminCourses').style.display = 'block';
            document.getElementById('adminStats').style.display = 'block';
        }
    }
}

async function loadDashboardData() {
    try {
        const data = await API.courses.getMyCourses();
        
        if (data.success) {
            const courses = data.data;
            displayMyCourses(courses.slice(0, 3));
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Hàm mới - Lấy thống kê từ SQL
async function loadDashboardStats() {
    try {
        const data = await API.dashboard.getUserStats();
        
        if (data.success) {
            const stats = data.data;
            
            // Cập nhật stats cards với dữ liệu thực
            document.getElementById('totalCourses').textContent = stats.totalCourses;
            document.getElementById('completedCourses').textContent = stats.completedCourses;
            document.getElementById('learningHours').textContent = stats.learningHours + 'h';
            document.getElementById('streak').textContent = stats.streak;
            
            // Hiển thị hoạt động gần đây
            displayRecentActivity(stats.recentActivity);
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

function displayRecentActivity(activities) {
    const timeline = document.getElementById('activityTimeline');
    
    if (!activities || activities.length === 0) {
        timeline.innerHTML = '<p class="text-muted text-center">Chưa có hoạt động nào</p>';
        return;
    }
    
    timeline.innerHTML = activities.map(activity => {
        const iconClass = activity.ActivityType === 'quiz' ? 'fa-star' : 'fa-check';
        const bgClass = activity.ActivityType === 'quiz' ? 'bg-warning' : 'bg-success';
        const timeAgo = formatTimeAgo(activity.NgayCapNhat);
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${bgClass}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <p class="mb-1"><strong>${activity.TenKhoaHoc}</strong></p>
                    <small class="text-muted">${activity.TenBaiHoc}</small>
                    <small class="text-muted d-block">${timeAgo}</small>
                </div>
            </div>
        `;
    }).join('');
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    } else {
        return `${diffDays} ngày trước`;
    }
}

function displayMyCourses(courses) {
    const container = document.getElementById('myCoursesContainer');
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4">
                <p class="text-muted">Bạn chưa đăng ký khóa học nào</p>
                <a href="pages/courses.html" class="btn btn-primary">
                    <i class="fas fa-search"></i> Khám phá khóa học
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = courses.map(course => `
        <div class="col-md-4 mb-3">
            <div class="card h-100">
                <img src="${course.AnhBia || 'https://via.placeholder.com/300x150'}" 
                     class="card-img-top" style="height: 150px; object-fit: cover;">
                <div class="card-body">
                    <h6 class="card-title">${truncateText(course.TenKhoaHoc, 40)}</h6>
                    <div class="mb-2">
                        <small class="text-muted">Tiến độ: ${course.TienDo || 0}%</small>
                    </div>
                    <div class="progress mb-3" style="height: 6px;">
                        <div class="progress-bar" style="width: ${course.TienDo || 0}%"></div>
                    </div>
                    <a href="pages/course-detail.html?id=${course.MaKhoaHoc}" 
                       class="btn btn-sm btn-primary w-100">
                        <i class="fas fa-play"></i> Tiếp tục học
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

function initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}
