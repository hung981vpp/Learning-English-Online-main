// frontend/assets/js/auth.js

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

// Get current user info
function getCurrentUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // SỬA: Thêm dấu / ở đầu để luôn về trang chủ gốc, không tìm trong thư mục hiện tại
    window.location.href = '/index.html'; 
}

// Check authentication and update navbar
function checkAuth() {
    const user = getCurrentUser();
    
    const loginNav = document.getElementById('loginNav');
    const logoutNav = document.getElementById('logoutNav');
    const profileNav = document.getElementById('profileNav');
    const myCoursesNav = document.getElementById('myCoursesNav');
    const heroRegisterBtn = document.getElementById('heroRegisterBtn');
    
    if (user) {
        // User is logged in
        if (loginNav) loginNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = 'block';
        if (profileNav) profileNav.style.display = 'block';
        if (myCoursesNav) myCoursesNav.style.display = 'block';
        
        // Update profile link with user name if exists
        if (profileNav) {
            const profileLink = profileNav.querySelector('a');
            if (profileLink) {
                profileLink.innerHTML = `<i class="fas fa-user"></i> ${user.hoTen || 'Tài khoản'}`;
            }
        }
        if (heroRegisterBtn) heroRegisterBtn.style.display = 'none';
    } else {
        // User is not logged in
        if (loginNav) loginNav.style.display = 'block';
        if (logoutNav) logoutNav.style.display = 'none';
        if (profileNav) profileNav.style.display = 'none';
        if (myCoursesNav) myCoursesNav.style.display = 'none';
    }
}

// Require authentication for protected pages
function requireAuth() {
    if (!isAuthenticated()) {
        // Lưu URL hiện tại để redirect về sau khi login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        alert('Vui lòng đăng nhập để tiếp tục');
        // SỬA: Dùng /login.html thay vì ./login.html để luôn tìm từ thư mục gốc
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Redirect if already authenticated (for login/register pages)
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user && user.isAdmin) {
            // SỬA: Thêm / ở đầu
            window.location.replace('/admin/dashboard.html');
        } else {
            // SỬA: Thêm / ở đầu
            window.location.replace('/index.html');
        }
    }
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

// Require admin role
function requireAdmin() {
    if (!isAuthenticated()) {
        alert('Vui lòng đăng nhập để tiếp tục');
        window.location.href = '/login.html';
        return false;
    }
    
    if (!isAdmin()) {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}