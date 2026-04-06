import api from "@/api/axios";

export const customerService = {
    /**
     * Lấy danh sách khách hàng của một CLB
     */
    getClubCustomers(clubId) {
        return api.get(`/owner/clubs/${clubId}/customers`);
    },

    /**
     * Thêm khách hàng thủ công vào CLB bằng số điện thoại
     * @param {string} clubId
     * @param {string} phone - Số điện thoại cần tìm kiếm
     */
    addCustomerByPhone(clubId, phone) {
        return api.post(`/owner/clubs/${clubId}/customers`, { phone });
    },

    /**
     * Xóa khách hàng khỏi danh sách CLB (không xóa tài khoản)
     * @param {string} clubId
     * @param {string} userId
     */
    removeCustomer(clubId, userId) {
        return api.delete(`/owner/clubs/${clubId}/customers/${userId}`);
    },

    /**
     * Cập nhật thông tin phân hạng và ghi chú khách hàng
     */
    updateCustomerTier(clubId, userId, data) {
        return api.patch(`/owner/clubs/${clubId}/customers/${userId}`, data);
    },

    /**
     * Lấy lịch sử đặt sân của một khách hàng tại CLB
     */
    getCustomerHistory(userId, clubId) {
        return api.get(`/owner/customers/${userId}/history?clubId=${clubId}`);
    },
};