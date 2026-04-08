import api from "../api/axios";

export const userService = {
    /**
     * Lấy profile đầy đủ của người dùng hiện tại
     */
    getProfile() {
        return api.get("/users/me");
    },

    /**
     * Cập nhật thông tin profile cơ bản
     */
    updateProfile(data) {
        return api.put("/users/me", data);
    },

    /**
     * Cập nhật Avatar
     */
    updateAvatar(formData) {
        return api.post("/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },

    /**
     * Thay đổi mật khẩu
     */
    changePassword(data) {
        return api.post("/users/change-password", data);
    }
};
