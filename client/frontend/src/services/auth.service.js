import api from '../api/axios';

export const authService = {
    login(email, password) {
        return api.post('/auth/login', { email, password });
    },

    register(userData) {
        // userData bao gồm: fullName, email, password, phone, role
        return api.post('/auth/register', userData);
    },

    forgotPassword(email) {
        return api.post('/auth/forgot-password', { email });
    },

    resetPassword(token, newPassword, confirmPassword) {
        return api.post('/auth/reset-password', { token, newPassword, confirmPassword });
    },

    loginWithFacebook(accessToken, role) {
        return api.post('/auth/facebook', { accessToken, role });
    },

    loginWithGoogle(idToken, role) {
        return api.post('/auth/google', { idToken, role });
    },

    getMe() {
        return api.get('/users/me');
    },

    /**
     * Lấy thông tin người dùng đang đăng nhập từ localStorage
     */
    getCurrentUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("Lỗi khi lấy thông tin user từ localStorage:", e);
            return null;
        }
    }
};
