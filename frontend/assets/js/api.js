// frontend/assets/js/api.js
// API Base URL
const API_URL = 'http://localhost:3001/api';

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

// API call wrapper with error handling
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(API_URL + endpoint, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// API Methods
const API = {
    // Auth
    auth: {
        login: (email, password) =>
            apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, matKhau: password })
            }),

        register: (userData) =>
            apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            }),

        getProfile: () =>
            apiCall('/auth/profile'),

        changePassword: (oldPassword, newPassword) =>
            apiCall('/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({
                    matKhauCu: oldPassword,
                    matKhauMoi: newPassword
                })
            })
    },


    // Courses
    courses: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiCall(`/courses${queryString ? '?' + queryString : ''}`);
        },

        getById: (id) =>
            apiCall(`/courses/${id}`),

        getMyCourses: () =>
            apiCall('/courses/my/courses'),

        enroll: (courseId) =>
            apiCall('/courses/enroll', {
                method: 'POST',
                body: JSON.stringify({ courseId })
            }),

        rate: (courseId, rating, comment) =>
            apiCall('/courses/rate', {
                method: 'POST',
                body: JSON.stringify({ courseId, rating, comment })
            }),

        getReviews: (courseId) =>
            apiCall(`/courses/${courseId}/reviews`),

        getCategories: () =>
            apiCall('/courses/categories')
    },

    // Lessons
    lessons: {
        getById: (id) =>
            apiCall(`/lessons/${id}`),

        start: (lessonId) =>
            apiCall('/lessons/start', {
                method: 'POST',
                body: JSON.stringify({ lessonId })
            }),

        complete: (lessonId, timeSpent) =>
            apiCall('/lessons/complete', {
                method: 'POST',
                body: JSON.stringify({ lessonId, timeSpent })
            })
    },

    // Quiz
    quiz: {
        getByCourse: (courseId) =>
            apiCall(`/quiz/course/${courseId}`),

        getInfo: (quizId) =>
            apiCall(`/quiz/${quizId}/info`),

        start: (quizId) =>
            apiCall(`/quiz/${quizId}/start`),

        submit: (quizId, answers, timeSpent) =>
            apiCall('/quiz/submit', {
                method: 'POST',
                body: JSON.stringify({ quizId, answers, timeSpent })
            }),

        getResult: (resultId) =>
            apiCall(`/quiz/result/${resultId}`),

        getAnswers: (quizId) =>
            apiCall(`/quiz/${quizId}/answers`)
    },
    // Dashboard
    dashboard: {
        getUserStats: () =>
            apiCall('/dashboard/user/stats'),

        getAdminStats: () =>
            apiCall('/dashboard/admin/stats')
    }
};
