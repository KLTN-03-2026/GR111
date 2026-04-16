import api from '../api/axios';

export const postService = {
    // 1. Lấy danh sách bài đăng (Dành cho chủ sân)
    getOwnerPosts: async (clubId) => {
        const response = await api.get('/owner/posts', {
            params: { clubId }
        });
        return response.data;
    },

    // 2. Đăng bài mới
    createPost: async (postData) => {
        const response = await api.post('/owner/posts', postData);
        return response.data;
    },

    // 3. Xóa bài đăng
    deletePost: async (postId) => {
        const response = await api.delete('/owner/posts', {
            params: { id: postId }
        });
        return response.data;
    },

    // 4. Lấy danh sách bài đăng cho người chơi (Feed công khai)
    getPublicFeed: async (params = {}) => {
        const response = await api.get('/posts', { params });
        return response.data;
    }
};
