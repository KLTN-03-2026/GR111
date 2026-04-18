import api from '../api/axios';

export const slotService = {
    /**
     * Chủ sân chủ động đóng/mở khung giờ
     * POST /api/owner/slots/lock
     * Body: { courtId, startTime, endTime, status: "LOCKED" | "AVAILABLE" }
     */
    toggleSlotStatus(payload) {
        return api.post('/owner/slots/lock', payload);
    },

    /**
     * Lấy danh sách slots (bao gồm ảo và thực) cho một sân vào một ngày
     * API này chưa có route cụ thể, nhưng ta có thể dùng route /api/owner/clubs/[id]/slots?date=...
     * Để FE hiển thị được cả slot trống và slot đã khóa.
     */
    getSlotsByClub(clubId, date) {
        return api.get(`/owner/clubs/${clubId}/slots`, {
            params: { date }
        });
    }
};
