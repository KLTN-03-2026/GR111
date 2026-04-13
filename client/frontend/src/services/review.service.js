import api from '../api/axios';

export const reviewService = {
    /**
     * Lấy danh sách đánh giá của một câu lạc bộ
     * @param {string} clubId 
     */
    async getReviewsByClub(clubId) {
        const response = await api.get('/reviews', {
            params: { clubId }
        });
        return response.data;
    },

    /**
     * Gửi đánh giá mới cho một đơn đặt sân đã hoàn thành
     * @param {Object} data - { bookingId, rating, comment, imageUrls }
     */
    async submitReview(data) {
        const response = await api.post('/reviews', data);
        return response.data;
    },

    /**
     * Upload danh sách ảnh đánh giá lên Cloudinary
     * @param {File[]} files - Danh sách các file ảnh
     */
    async uploadImages(files) {
        const urls = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'review-image');
            
            // Gọi endpoint upload chung của hệ thống
            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data && response.data.data && response.data.data.url) {
                urls.push(response.data.data.url);
            }
        }
        return urls;
    }
};
