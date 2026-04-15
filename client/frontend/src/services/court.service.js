import api from '../api/axios';

export const courtService = {
    /**
     * Lấy danh sách sân của một câu lạc bộ
     * GET /api/owner/clubs/[clubId]/courts
     */
    getCourts(clubId) {
        return api.get(`/owner/clubs/${clubId}/courts`);
    },

    /**
     * Tạo sân mới cho câu lạc bộ
     * POST /api/owner/clubs/[clubId]/courts
     * Body: { name, sportType, surface, indoorOutdoor, capacity, description }
     */
    createCourt(clubId, courtData) {
        return api.post(`/owner/clubs/${clubId}/courts`, courtData);
    },

    /**
     * Cập nhật thông tin sân
     * PUT /api/owner/courts/[id]
     * Body: { name, sportType, surface, indoorOutdoor, capacity, description }
     */
    updateCourt(courtId, courtData) {
        return api.put(`/owner/courts/${courtId}`, courtData);
    },

    /**
     * Xoá sân (soft delete → INACTIVE)
     * DELETE /api/owner/courts/[id]
     */
    deleteCourt(courtId) {
        return api.delete(`/owner/courts/${courtId}`);
    },

    /**
     * Upload ảnh sân bóng
     */
    uploadImage(formData, onProgress = null) {
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: onProgress
                ? (e) => {
                      const pct = Math.round((e.loaded * 100) / (e.total || 1));
                      onProgress(pct);
                  }
                : undefined,
        });
    },
    // ── Pricing ────────────────────────────────────────────────
    updatePricing(courtId, pricings) {
        return api.put(`/owner/courts/${courtId}/pricing`, pricings);
    },

    // ── Slots ───────────────────────────────────────────────────
    /**
     * Lấy danh sách khung giờ ảo + thực tế theo sân và ngày
     * GET /api/owner/slots?courtId=...&date=YYYY-MM-DD
     */
    getSlots(courtId, date) {
        return api.get(`/owner/slots`, { params: { courtId, date } });
    },

    /**
     * Khóa hoặc mở khung giờ cho chủ sân
     * POST /api/owner/slots/lock
     * Body: { courtId, startTime, endTime, status: 'LOCKED' | 'AVAILABLE' }
     */
    toggleSlotLock(courtId, startTime, endTime, status) {
        return api.post(`/owner/slots/lock`, { courtId, startTime, endTime, status });
    },
};
