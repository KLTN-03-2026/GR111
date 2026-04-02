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
    
    //thêm mới câu lạc bộ
    addClub(clubData) {
        return api.post(`/owner/clubs`, clubData);
    },

    //chỉnh sửa câu lạc bộ
    editClub(clubId, clubData) {
        return api.patch(`/owner/clubs/${clubId}`, clubData);
    },

    //lấy toàn bộ thông tin câu lạc bộ
    Getallthedetails() {
        return api.get(`/owner/clubs`);
        
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
