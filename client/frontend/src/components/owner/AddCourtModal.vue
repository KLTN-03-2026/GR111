<template>
  <div class="modal-overlay" v-if="isOpen" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ initialData ? 'Sửa Thông Tin Sân' : 'Thêm Sân Mới' }}</h2>
        <button class="close-btn" @click="closeModal" title="Đóng"><span class="material-icons">close</span></button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <!-- Court Info -->
          <div class="form-group">
            <label>Tên sân</label>
            <input type="text" v-model="form.name" required placeholder="Nhập tên sân (VD: Sân A1)..." />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Loại sân</label>
              <select v-model="form.type">
                <option value="5x5">Sân 5 người</option>
                <option value="7x7">Sân 7 người</option>
                <option value="11x11">Sân 11 người</option>
              </select>
            </div>
            <div class="form-group">
              <label>Giá mỗi giờ (VNĐ)</label>
              <input type="number" v-model="form.pricePerHour" required min="0" step="1000" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Tiện ích</label>
            <div class="amenities-grid">
              <label v-for="am in availableAmenities" :key="am" class="checkbox-label">
                <input type="checkbox" :value="am" v-model="form.amenities" />
                <span>{{ am }}</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Trạng thái</label>
            <select v-model="form.status">
              <option value="active">Hoạt động (Cho đặt ngay)</option>
              <option value="maintenance">Bảo trì tạm thời</option>
            </select>
          </div>

          <!-- Image Upload -->
          <div class="form-group">
            <label>Hình ảnh sân</label>
            <div 
              class="upload-area" 
              @dragover.prevent="isDragging = true" 
              @dragleave.prevent="isDragging = false" 
              @drop.prevent="handleDrop"
              :class="{ 'dragging': isDragging }"
              @click="triggerFileInput"
            >
              <span class="material-icons upload-icon">cloud_upload</span>
              <p>Kéo thả hình ảnh vào đây hoặc <strong>nhấn để chọn file</strong></p>
              <span class="upload-hint">Hỗ trợ JPG, PNG. Tối đa 5MB mỗi file.</span>
              <input type="file" ref="fileInput" multiple accept="image/png, image/jpeg, image/jpg" class="hidden-input" @change="handleFileSelect" />
            </div>
            
            <div class="image-preview-container" v-if="imagePreviews.length > 0">
              <div class="preview-item" v-for="(img, index) in imagePreviews" :key="index">
                <img :src="img.url" alt="Preview" />
                <button type="button" class="remove-img-btn" @click.stop="removeImage(index)" title="Xóa ảnh">
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>

            <div v-if="isUploading" class="uploading-state">
              <span class="material-icons rotating-icon">sync</span>
              <span>Đang tải ảnh lên Cloudinary...</span>
            </div>
          </div>

        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal" :disabled="isUploading">Hủy bỏ</button>
        <button class="btn-save" @click="submitForm" :disabled="isUploading">
          <span class="material-icons">save</span>
          Lưu sân
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import uploadService from '@/services/upload.service';

export default {
  name: 'AddCourtModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    initialData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isDragging: false,
      isUploading: false,
      availableAmenities: ['Mái che', 'Nước uống', 'Đèn LED', 'Khán đài', 'LiveStream', 'Wifi miễn phí', 'Cỏ chuẩn FIFA', 'Giày/Áo pitch'],
      form: {
        name: '',
        type: '5x5',
        pricePerHour: 300000,
        amenities: [],
        status: 'active'
      },
      files: [],
      imagePreviews: []
    }
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        if (this.initialData) {
          // Edit Mode
          this.form = {
             name: this.initialData.name,
             type: this.initialData.type,
             pricePerHour: this.initialData.pricePerHour,
             status: this.initialData.status,
             amenities: [...(this.initialData.amenities || [])]
          };
          // Map existing images visually as previews
          this.imagePreviews = (this.initialData.images || []).map(url => ({
            name: 'Saved Image',
            url: url,
            publicId: null
          }));
        } else {
          // Create Mode
          this.resetForm();
        }
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
      setTimeout(() => {
        this.resetForm();
      }, 300); // reset after animation
    },
    resetForm() {
      this.form = {
        name: '',
        type: '5x5',
        pricePerHour: 300000,
        amenities: [],
        status: 'active'
      };
      this.files = [];
      this.imagePreviews = [];
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleDrop(e) {
      this.isDragging = false;
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        this.addFiles(Array.from(droppedFiles));
      }
    },
    handleFileSelect(e) {
      const selectedFiles = e.target.files;
      if (selectedFiles.length > 0) {
        this.addFiles(Array.from(selectedFiles));
      }
      this.$refs.fileInput.value = ''; // reset input buffer
    },
    async addFiles(newFiles) {
      const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
      if (validFiles.length === 0) return;

      this.isUploading = true;
      try {
        for (const file of validFiles) {
          // Push file to list
          this.files.push(file);
          // Upload file qua Backend API -> Cloudinary
          const result = await uploadService.uploadFile(file, 'court-image');
          
          const data = result.data || result;
          if (data && data.url) {
            this.imagePreviews.push({ 
              name: file.name, 
              url: data.url, 
              publicId: data.publicId 
            });
          }
        }
      } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        alert("Có lỗi khi tải ảnh lên. Token hết hạn hoặc server lỗi!");
      } finally {
        this.isUploading = false;
      }
    },
    removeImage(index) {
      this.files.splice(index, 1);
      this.imagePreviews.splice(index, 1);
    },
    submitForm() {
      if (!this.form.name || !this.form.pricePerHour) {
        alert("Vui lòng điền đầy đủ tên sân và giá mỗi giờ.");
        return;
      }
      
      const newCourt = {
        id: Date.now(),
        // Mocking parent club id directly via emit mapping
        name: this.form.name,
        type: this.form.type,
        pricePerHour: this.form.pricePerHour,
        status: this.form.status,
        totalBookings: 0,
        amenities: [...this.form.amenities],
        images: this.files 
      };
      
      this.$emit('save', newCourt);
      this.closeModal();
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 22, 35, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
  padding: 20px;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 640px;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 24px 30px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #0f1623;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.close-btn {
  background: white;
  border: 1px solid #eaecf2;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-body {
  padding: 30px;
  overflow-y: auto;
  font-family: 'DM Sans', sans-serif;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}
.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 24px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

input[type="text"], input[type="number"], select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  color: #0f1623;
  background-color: #f8fafc;
  transition: all 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: #16a34a;
  background-color: white;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.1);
}

.amenities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  padding: 10px;
  border: 1px solid #eaecf2;
  border-radius: 10px;
  transition: all 0.2s;
}

.checkbox-label:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.checkbox-label:has(input:checked) {
  background: #f0fdf4;
  border-color: #16a34a;
  color: #15803d;
  font-weight: 600;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  accent-color: #16a34a;
  cursor: pointer;
}

/* Upload Area */
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area.dragging, .upload-area:hover {
  border-color: #16a34a;
  background: #f0fdf4;
}

.upload-icon {
  font-size: 48px;
  color: #94a3b8;
  margin-bottom: 16px;
  transition: color 0.3s;
}

.upload-area.dragging .upload-icon, .upload-area:hover .upload-icon {
  color: #16a34a;
  transform: translateY(-5px);
}

.upload-area p {
  margin: 0 0 6px 0;
  font-size: 16px;
  color: #475569;
}

.upload-area p strong {
  color: #16a34a;
}

.upload-hint {
  font-size: 13px;
  color: #94a3b8;
}

.hidden-input {
  display: none;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 20px;
}

.preview-item {
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 2px solid white;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.preview-item:hover img {
  transform: scale(1.05);
}

.remove-img-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(15, 22, 35, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.remove-img-btn span {
  font-size: 15px;
}

.remove-img-btn:hover {
  background: #ef4444;
  transform: scale(1.1);
}

.modal-footer {
  padding: 24px 30px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background: #f8fafc;
  border-radius: 0 0 24px 24px;
}

.btn-cancel, .btn-save {
  padding: 14px 28px;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.btn-cancel:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #1e293b;
}

.btn-save {
  background: #16a34a;
  border: 1px solid #16a34a;
  color: white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.btn-save:hover {
  background: #15803d;
  border-color: #15803d;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(22, 163, 74, 0.3);
}

.uploading-state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #16a34a;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  margin-top: 14px;
}

.rotating-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
</style>
