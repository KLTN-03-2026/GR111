import api from '../api/axios';

export const clubService = {
    /**
     * Lấy danh sách các sân bóng (club) gần vị trí hiện tại của người dùng
     * @param {number} lat - Vĩ độ
     * @param {number} lng - Kinh độ
     * @param {number} [radius=20] - Bán kính (mặc định 20km)
     */
    getNearbyClubs(lat, lng, radius = 20) {
        return api.get('/clubs/nearby', {
            params: { lat, lng, radius }
        });
    },

    /**
     * Lấy thông tin chi tiết một câu lạc bộ thông qua slug
     * @param {string} slug 
     */
    getClubBySlug(slug) {
        return api.get(`/clubs/${slug}`);
    },

    // Tìm kiếm danh sách các sân (venues) với bộ lọc
    searchVenues(filters) {
        return api.get('/clubs', { params: filters });
    },

    // Lấy danh sách CLB của Owner đang đăng nhập
    getMyClubs() {
        return api.get('/owner/clubs');
    },

    // Thêm mới câu lạc bộ
    createClub(clubData) {
        return api.post('/owner/clubs', clubData);
    },

    // Chỉnh sửa câu lạc bộ
    updateClub(clubId, clubData) {
        return api.put(`/owner/clubs/${clubId}`, clubData);
    },

    // Lấy chi tiết câu lạc bộ (Owner)
    getClubById(clubId) {
        return api.get(`/owner/clubs/${clubId}`);
    },

    // Tiện ích / Dịch vụ
    getClubAmenities(clubId) {
        return api.get(`/owner/clubs/${clubId}/amenities`);
    },

    updateClubAmenities(clubId, amenities) {
        return api.post(`/owner/clubs/${clubId}/amenities`, { amenities });
    },

    // Lấy danh sách time slots của tất cả sân trong CLB theo ngày
    getSlotsByClub(slug, date) {
        return api.get(`/clubs/${slug}/slots`, { params: { date } });
    },
};
