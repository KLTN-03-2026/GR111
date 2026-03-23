import api from '@/api/axios';

class UploadService {
  /**
   * Upload file trực tiếp lên Cloudinary qua REST API (Frontend Upload).
   * Yêu cầu bạn cấu hình VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET trong file .env
   * @param {File} file File cần upload
   */
  async uploadFile(file) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Thiếu cấu hình VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET trong .env");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      // Upload trực tiếp từ Frontend lên Cloudinary API
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Lỗi khi upload lên Cloudinary");
      }

      const data = await response.json();
      
      // Trả về chung Format để AddCourtModal.vue tiếp nhận
      return {
        status: "success",
        data: {
          url: data.secure_url,
          publicId: data.public_id
        }
      };
    } catch (error) {
      console.error('Lỗi khi gọi Cloudinary API trực tiếp: ', error);
      throw error;
    }
  }
}

export default new UploadService();
