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

    /**
     * Tìm kiếm danh sách các sân (venues) với bộ lọc
     * @param {Object} filters 
     */
    searchVenues(filters) {
        return api.get('/clubs', { params: filters });
    },
    
    // Thêm mới câu lạc bộ
    addClub(clubData) {
        return api.post('/owner/clubs', clubData);
    },

    // Chỉnh sửa câu lạc bộ
    editClub(clubId, clubData) {
        return api.put(`/owner/clubs/${clubId}`, clubData);
    },

    // Lấy danh sách câu lạc bộ của chủ sân
    getOwnerClubs() {
        return api.get('/owner/clubs');
    },

    // Lấy thông tin chi tiết một câu lạc bộ (dành cho chủ sân)
    getClubDetails(clubId) {
        return api.get(`/owner/clubs/${clubId}`);
    },
};
