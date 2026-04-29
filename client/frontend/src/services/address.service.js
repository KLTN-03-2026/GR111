import api from '../api/axios';

/**
 * Địa giới hành chính VN (63 tỉnh/TP theo open-api + quận/huyện/phường)
 */
export const addressService = {
    getProvinces() {
        return api.get('/vn/address/provinces');
    },
    getProvinceDetail(slug) {
        return api.get(`/vn/address/provinces/${encodeURIComponent(slug)}`);
    },
};
