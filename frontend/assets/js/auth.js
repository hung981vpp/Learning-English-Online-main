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
    window.location.href = '/frontend/login.html';
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
        alert('Vui lòng đăng nhập để tiếp tục');
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
            window.location.href = '/admin/dashboard.html';
        } else {
            window.location.href = '/index.html';
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
