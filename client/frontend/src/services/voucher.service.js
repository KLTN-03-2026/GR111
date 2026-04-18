import api from '../api/axios';

export const voucherService = {
  // ── CLIENT APIs ────────────────────────────────────────────

  /**
   * Kiểm tra tính hợp lệ của mã giảm giá
   */
  validateVoucher: async (code, clubId, orderAmount) => {
    const response = await api.post("/vouchers/validate", { code, clubId, orderAmount });
    return response.data;
  },

  /**
   * Lấy danh sách voucher khả dụng của CLB (dành cho người dùng khi đặt sân)
   */
  getAvailableVouchers: async (clubId) => {
    const response = await api.get("/vouchers/available", { params: { clubId } });
    return response.data;
  },

  // ── OWNER APIs ─────────────────────────────────────────────

  /**
   * Lấy danh sách voucher do chủ sân tạo ra
   */
  getClubVouchers: async (clubId) => {
    const response = await api.get(`/owner/clubs/${clubId}/vouchers`);
    return response.data;
  },

  /**
   * Tạo mã giảm giá mới
   */
  createVoucher: async (clubId, data) => {
    const response = await api.post(`/owner/clubs/${clubId}/vouchers`, data);
    return response.data;
  },

  /**
   * Cập nhật thông tin voucher
   */
  updateVoucher: async (clubId, voucherId, data) => {
    const response = await api.patch(`/owner/clubs/${clubId}/vouchers/${voucherId}`, data);
    return response.data;
  },

  /**
   * Bật / tắt voucher (toggle isActive)
   */
  toggleVoucher: async (clubId, voucherId, isActive) => {
    const response = await api.patch(`/owner/clubs/${clubId}/vouchers/${voucherId}`, { isActive });
    return response.data;
  },

  /**
   * Xóa voucher (soft delete)
   */
  deleteVoucher: async (clubId, voucherId) => {
    const response = await api.delete(`/owner/clubs/${clubId}/vouchers/${voucherId}`);
    return response.data;
  },
};
