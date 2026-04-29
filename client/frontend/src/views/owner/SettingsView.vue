<template>
  <div class="settings-view">
    <!-- Header Section -->
    <div class="view-header">
      <div class="header-info">
        <h1 class="view-title">Thiết lập Tài khoản</h1>
        <p class="view-subtitle">Quản lý hồ sơ cá nhân, bảo mật và các thiết lập hệ thống.</p>
      </div>
      <div class="header-actions">
        <!-- KYC status badge -->
        <div class="kyc-status-badge" :class="kycStatusClass">
          <span class="material-icons">{{ kycStatusIcon }}</span>
          <span>{{ kycStatusLabel }}</span>
        </div>
        <button v-if="currentTab !== 'billing'" class="save-btn" @click="saveChanges">
          <span class="material-icons">save</span>
          <span>Lưu thay đổi</span>
        </button>
      </div>
    </div>

    <!-- Main Layout: Sidebar Navigation + Content Area -->
    <div class="settings-layout">
      <!-- Left Sidebar: Menu -->
      <div class="settings-menu card">
        <ul class="menu-list">
          <li>
            <button class="menu-item" :class="{ active: currentTab === 'profile' }" @click="currentTab = 'profile'">
              <span class="material-icons">account_circle</span>
              <span>Thông tin cá nhân</span>
            </button>
          </li>
          <li>
            <!-- KYC tab nổi bật khi chưa xác minh -->
            <button class="menu-item" :class="{ active: currentTab === 'kyc', 'urgent': !isVerified }" @click="currentTab = 'kyc'">
              <span class="material-icons">badge</span>
              <span>Xác minh hồ sơ KYC</span>
              <span v-if="!isVerified" class="urgent-dot"></span>
            </button>
          </li>
          <li>
            <button class="menu-item" :class="{ active: currentTab === 'security' }" @click="currentTab = 'security'">
              <span class="material-icons">security</span>
              <span>Bảo mật đổi mật khẩu</span>
            </button>
          </li>
          <li>
            <button class="menu-item" :class="{ active: currentTab === 'payment' }" @click="currentTab = 'payment'">
              <span class="material-icons">account_balance_wallet</span>
              <span>Ngân hàng &amp; CK khách</span>
            </button>
          </li>
          <li>
            <button class="menu-item" :class="{ active: currentTab === 'billing' }" @click="currentTab = 'billing'">
              <span class="material-icons">card_membership</span>
              <span>Gói đăng ký &amp; phí duy trì</span>
            </button>
          </li>
          <li>
            <button class="menu-item" :class="{ active: currentTab === 'notifications' }" @click="currentTab = 'notifications'">
              <span class="material-icons">notifications</span>
              <span>Thông báo</span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Right Content: Dynamic Forms -->
      <div class="settings-content">
        
        <!-- Tab: KYC - Xác minh hồ sơ -->
        <div v-if="currentTab === 'kyc'" class="tab-pane fade-in card">
          <div class="pane-header">
            <div class="pane-header-row">
              <div>
                <h3>Xác minh Hồ sơ KYC</h3>
                <p>Cung cấp giấy tờ và thông tin pháp lý để mở khóa toàn bộ tính năng.</p>
              </div>
              <div class="kyc-progress-badge" :class="isVerified ? 'done' : 'todo'">
                <span class="material-icons">{{ isVerified ? 'check_circle' : 'hourglass_top' }}</span>
                <span>{{ isVerified ? 'Hồ sơ đã nộp' : 'Chưa hoàn thiện' }}</span>
              </div>
            </div>
          </div>

          <!-- Section 1: Định danh cá nhân -->
          <div class="kyc-section">
            <h4 class="kyc-section-title">
              <span class="material-icons">badge</span> Thông tin Định danh
            </h4>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Số CCCD / CMND <span class="required">*</span></label>
                <input type="text" v-model="kyc.idCardNumber" placeholder="Nhập số thẻ căn cước công dân" />
              </div>
            </div>
            <div class="upload-grid">
              <!-- CCCD Mặt trước -->
              <div class="upload-box" :class="{ 'uploading': uploading.kycFront }" @click="$refs.kycFrontInput.click()">
                <img v-if="kyc.idCardFrontUrl" :src="kyc.idCardFrontUrl" class="upload-preview" />
                <template v-else>
                  <span class="material-icons ub-icon">{{ uploading.kycFront ? 'hourglass_top' : 'badge' }}</span>
                  <h4>Ảnh CCCD Mặt trước</h4>
                  <p>{{ uploading.kycFront ? 'Đang tải lên...' : 'Chưa tải lên. Nhấn để chọn ảnh.' }}</p>
                </template>
                <div v-if="kyc.idCardFrontUrl" class="preview-overlay">
                  <span class="material-icons">edit</span> Thay ảnh
                </div>
                <input ref="kycFrontInput" type="file" accept="image/*" style="display:none" @change="e => uploadKycImage(e, 'front')" />
              </div>
              <!-- CCCD Mặt sau -->
              <div class="upload-box" :class="{ 'uploading': uploading.kycBack }" @click="$refs.kycBackInput.click()">
                <img v-if="kyc.idCardBackUrl" :src="kyc.idCardBackUrl" class="upload-preview" />
                <template v-else>
                  <span class="material-icons ub-icon">{{ uploading.kycBack ? 'hourglass_top' : 'badge' }}</span>
                  <h4>Ảnh CCCD Mặt sau</h4>
                  <p>{{ uploading.kycBack ? 'Đang tải lên...' : 'Chưa tải lên. Nhấn để chọn ảnh.' }}</p>
                </template>
                <div v-if="kyc.idCardBackUrl" class="preview-overlay">
                  <span class="material-icons">edit</span> Thay ảnh
                </div>
                <input ref="kycBackInput" type="file" accept="image/*" style="display:none" @change="e => uploadKycImage(e, 'back')" />
              </div>
            </div>
          </div>

          <!-- Section 2: Tài khoản nhận tiền -->
          <div class="kyc-section">
            <h4 class="kyc-section-title">
              <span class="material-icons">account_balance</span> Tài khoản nhận tiền (Payout)
            </h4>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Ngân hàng <span class="required">*</span></label>
                <select v-model="kyc.bankName">
                  <option value="" disabled>-- Chọn ngân hàng --</option>
                  <option>Vietcombank</option>
                  <option>Techcombank</option>
                  <option>MB Bank</option>
                  <option>BIDV</option>
                  <option>Agribank</option>
                  <option>TPBank</option>
                  <option>VPBank</option>
                  <option>ACB</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tên chủ tài khoản <span class="required">*</span></label>
                <input type="text" v-model="kyc.bankAccountName" placeholder="NGUYEN VAN A" style="text-transform: uppercase" />
                <span class="hint">Viết chữ HOA, khớp tên pháp lý trên CCCD</span>
              </div>
              <div class="form-group">
                <label>Số tài khoản <span class="required">*</span></label>
                <input type="text" v-model="kyc.bankAccountNumber" placeholder="Nhập số tài khoản" />
              </div>
            </div>
          </div>

          <!-- Section 3: Giấy tờ kinh doanh -->
          <div class="kyc-section">
            <h4 class="kyc-section-title">
              <span class="material-icons">assignment</span> Giấy tờ Kinh doanh <span style="color:#94a3b8;font-weight:400">(Không bắt buộc)</span>
            </h4>
            <div class="form-grid">
              <div class="form-group">
                <label>Mã số thuế</label>
                <input type="text" v-model="kyc.taxCode" placeholder="Nhập mã số thuế doanh nghiệp" />
              </div>
              <div class="form-group">
                <label>Quy định hủy sân</label>
                <input type="text" v-model="kyc.cancellationPolicy" placeholder="VD: Hủy trước 24h hoàn 100%" />
              </div>
            </div>
            <div class="upload-grid">
              <div class="upload-box full-width" :class="{ 'uploading': uploading.license }" @click="$refs.licenseInput.click()">
                <img v-if="kyc.businessLicenseUrl" :src="kyc.businessLicenseUrl" class="upload-preview" />
                <template v-else>
                  <span class="material-icons ub-icon">{{ uploading.license ? 'hourglass_top' : 'receipt_long' }}</span>
                  <h4>Giấy phép Kinh doanh</h4>
                  <p>{{ uploading.license ? 'Đang tải lên...' : 'Tăng độ uy tín hiển thị cho người đặt sân. Nhấn để chọn ảnh.' }}</p>
                </template>
                <div v-if="kyc.businessLicenseUrl" class="preview-overlay">
                  <span class="material-icons">edit</span> Thay ảnh
                </div>
                <input ref="licenseInput" type="file" accept="image/*,application/pdf" style="display:none" @change="e => uploadFile(e, 'business-license', 'license')" />
              </div>
            </div>
          </div>

          <!-- Submit KYC -->
          <div class="action-row">
            <button class="btn-kyc-submit" :disabled="isKycSubmitting" @click="submitKYC">
              <span class="material-icons">{{ isKycSubmitting ? 'hourglass_top' : 'send' }}</span>
              {{ isKycSubmitting ? 'Đang gửi...' : 'Nộp Hồ sơ KYC' }}
            </button>
          </div>
        </div>

        <!-- Tab: Thông tin cá nhân -->
        <div v-if="currentTab === 'profile'" class="tab-pane fade-in card">
          <div class="pane-header">
            <h3>Hồ sơ Cá nhân</h3>
            <p>Thông tin cơ bản của bạn trên hệ thống.</p>
          </div>
          
          <div class="profile-avatar-section">
            <div class="avatar-wrapper">
              <img :src="profile.avatar" alt="Avatar" class="avatar-img" />
              <button class="upload-badge" :class="{ loading: uploadingAvatar }" @click="$refs.avatarInput.click()">
                <span class="material-icons">{{ uploadingAvatar ? 'hourglass_top' : 'photo_camera' }}</span>
              </button>
              <!-- Hidden file input cho avatar -->
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                style="display:none"
                @change="uploadAvatar"
              />
            </div>
            <div class="avatar-info">
              <h4>Ảnh đại diện</h4>
              <p>Ảnh định dạng JPG, PNG hoặc GIF. Tối đa 5MB.</p>
              <button class="btn-outline" @click="$refs.avatarInput.click()" :disabled="uploadingAvatar">
                {{ uploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh mới' }}
              </button>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label>Họ và tên</label>
              <input type="text" v-model="profile.fullName" placeholder="Nhập họ và tên" />
            </div>
            <div class="form-group">
              <label>Số điện thoại</label>
              <input type="text" v-model="profile.phone" placeholder="Số điện thoại cá nhân" />
            </div>
            <div class="form-group">
              <label>Email cá nhân</label>
              <input type="email" v-model="profile.email" placeholder="Email liên hệ" />
            </div>
            <div class="form-group full-width">
              <label>Giới thiệu ngắn (Tiểu sử)</label>
              <textarea v-model="profile.bio" rows="4" placeholder="Một vài điều về bạn..."></textarea>
            </div>
          </div>
        </div>

        <!-- Tab: Security (Mật khẩu) -->
        <div v-if="currentTab === 'security'" class="tab-pane fade-in card">
          <div class="pane-header">
            <h3>Mật khẩu & Bảo mật</h3>
            <p>Cập nhật mật khẩu để tài khoản của bạn luôn được an toàn.</p>
          </div>
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Mật khẩu hiện tại</label>
              <input type="password" v-model="security.oldPassword" placeholder="Nhập mật khẩu hiện tại" />
            </div>
            <div class="form-group full-width">
              <label>Mật khẩu mới</label>
              <input type="password" v-model="security.newPassword" placeholder="Nhập mật khẩu mới" />
              <span class="hint">Phải có ít nhất 8 ký tự, bao gồm chữ cái và số.</span>
            </div>
            <div class="form-group full-width">
              <label>Xác nhận mật khẩu mới</label>
              <input type="password" v-model="security.confirmPassword" placeholder="Nhập lại mật khẩu mới" />
            </div>
          </div>
          <div class="action-row">
            <button class="btn-primary" @click="changePassword">Đổi mật khẩu</button>
          </div>
        </div>

        <!-- Tab: Payment (Ngân hàng + CK hiển thị cho khách theo CLB) -->
        <div v-if="currentTab === 'payment'" class="tab-pane fade-in card">
          <div class="pane-header">
            <h3>Tài khoản &amp; chuyển khoản</h3>
            <p>Tài khoản nhận tiền trong hồ sơ; và thông tin CK ngân hàng hiển thị cho khách khi thanh toán từng câu lạc bộ.</p>
          </div>

          <h4 class="payment-section-title">
            <span class="material-icons">savings</span> Tài khoản thụ hưởng (hệ thống)
          </h4>
          
          <div class="linked-bank card-alt">
            <div class="bank-icon">
              <span class="material-icons">account_balance</span>
            </div>
            <div class="bank-details">
              <h4>{{ payment.bankName }}</h4>
              <p class="account-num">{{ payment.accountNumber }}</p>
              <p class="account-name">{{ payment.accountName }}</p>
            </div>
            <div class="bank-status">
              <span class="status-badge verified"><span class="material-icons">verified</span> Đã xác minh</span>
            </div>
          </div>

          <div class="form-grid mt-24">
            <div class="form-group full-width">
              <label>Ngân hàng hưởng thụ</label>
              <select v-model="payment.bankName">
                <option value="Vietcombank">Vietcombank</option>
                <option value="Techcombank">Techcombank</option>
                <option value="MB Bank">MB Bank</option>
                <option value="BIDV">BIDV</option>
              </select>
            </div>
            <div class="form-group">
              <label>Số tài khoản</label>
              <input type="text" v-model="payment.accountNumber" />
            </div>
            <div class="form-group">
              <label>Tên chủ tài khoản</label>
              <input type="text" v-model="payment.accountName" />
            </div>
          </div>

          <div class="transfer-divider"></div>

          <h4 class="payment-section-title">
            <span class="material-icons">payments</span> Chuyển khoản hiển thị cho khách
          </h4>
          <p class="transfer-intro">
            Thông tin này xuất hiện trên trang thanh toán khi khách chọn thanh toán chuyển khoản (theo từng câu lạc bộ). Nội dung CK trên đơn luôn là mã đặt sân.
          </p>

          <div v-if="!ownerClubs.length" class="transfer-empty card-alt">
            <span class="material-icons">domain_disabled</span>
            <p>Bạn chưa có câu lạc bộ. Tạo câu lạc bộ trước, sau đó cấu hình CK tại đây.</p>
          </div>

          <template v-else>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Câu lạc bộ</label>
                <select v-model="transferClubId" @change="syncClubTransferFromList">
                  <option v-for="c in ownerClubs" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>

            <div v-if="ownerClubs.length > 1" class="form-group full-width transfer-apply-all-wrap">
              <label class="transfer-apply-all-label">
                <input type="checkbox" v-model="applyTransferToAllClubs" />
                <span>Áp dụng thông tin CK này cho <strong>tất cả</strong> câu lạc bộ khi lưu</span>
              </label>
              <p v-if="applyTransferToAllClubs" class="transfer-hint">
                Mọi CLB sẽ dùng chung ngân hàng, STK, chủ TK và ảnh QR như ô bên dưới (ghi đè cấu hình hiện có).
              </p>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Ngân hàng</label>
                <input type="text" v-model="clubTransfer.transferBankName" placeholder="Ví dụ: Vietcombank" />
              </div>
              <div class="form-group">
                <label>Số tài khoản</label>
                <input type="text" v-model="clubTransfer.transferAccountNumber" placeholder="Số TK nhận tiền" />
              </div>
              <div class="form-group full-width">
                <label>Chủ tài khoản</label>
                <input type="text" v-model="clubTransfer.transferBeneficiaryName" placeholder="Họ tên chủ TK" />
              </div>
            </div>

            <div class="form-group full-width transfer-qr-block">
              <label>Ảnh mã QR (tuỳ chọn)</label>
              <input
                type="url"
                v-model="clubTransfer.transferQrImageUrl"
                class="transfer-qr-url"
                placeholder="https://... hoặc tải ảnh bên dưới"
              />
              <div class="transfer-qr-row">
                <div
                  class="transfer-qr-preview"
                  :class="{ uploading: uploadingTransferQr }"
                  @click="$refs.transferQrInput.click()"
                >
                  <img
                    v-if="clubTransfer.transferQrImageUrl"
                    :src="clubTransfer.transferQrImageUrl"
                    alt="QR"
                  />
                  <template v-else>
                    <span class="material-icons">qr_code_2</span>
                    <span>Nhấn để tải ảnh QR</span>
                  </template>
                </div>
                <button type="button" class="btn-outline transfer-qr-btn" @click="$refs.transferQrInput.click()" :disabled="uploadingTransferQr || !transferClubId">
                  <span class="material-icons">upload</span>
                  {{ uploadingTransferQr ? 'Đang tải...' : 'Tải ảnh QR' }}
                </button>
                <input
                  ref="transferQrInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style="display:none"
                  @change="onTransferQrFile"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- Tab: Gói Subscription & phí duy trì -->
        <div v-if="currentTab === 'billing'" class="tab-pane fade-in card billing-tab">
          <div class="pane-header">
            <h3>Gói đăng ký &amp; phí duy trì hệ thống</h3>
            <p>
              Xem lại gói và add-on đã chọn; thanh toán định kỳ hiện qua chuyển khoản / xác nhận với vận hành cho đến khi có cổng thanh toán.
            </p>
          </div>

          <div class="billing-summary card-alt">
            <div class="billing-summary-row">
              <span class="billing-label">Gói Subscription hiện tại</span>
              <strong class="billing-value">{{ billingPlanSummary }}</strong>
            </div>
            <div v-if="billing.subscriptionPlanKey" class="billing-summary-row">
              <span class="billing-label">Add-on</span>
              <span class="billing-value muted">{{ billingAddonsSummary }}</span>
            </div>
            <div v-if="billing.billingIntroDismissedAt && !billing.subscriptionPlanKey" class="billing-note warn">
              <span class="material-icons">info</span>
              Bạn đã đóng thông báo lần đầu mà chưa chọn gói. Hãy chọn gói để chúng tôi ghi nhận cho kỳ thanh toán.
            </div>
          </div>

          <div class="billing-box">
            <h4><span class="material-icons">payments</span> Thanh toán gói Subscription</h4>
            <ol class="billing-steps">
              <li>Nhấn <strong>Chọn hoặc đổi gói</strong> bên dưới để cập nhật gói / add-on trong hệ thống.</li>
              <li>
                Chuyển khoản ngân hàng theo <strong>STK và nội dung</strong> do đội ngũ vận hành gửi qua email / tin nhắn sau khi bạn xác nhận gói
                (hoặc liên hệ hotline hỗ trợ trên website).
              </li>
              <li>Sau khi tích hợp cổng thanh toán, bạn có thể thanh toán tự động theo tháng / năm trong cùng mục này.</li>
            </ol>
            <p class="billing-muted">
              Hoa hồng theo đơn đặt sân (pilot ~8–10%) được minh bạch trong báo cáo tài chính khi tính năng được bật — không thay thế hoàn toàn phí gói nếu bạn đang dùng mô hình Hybrid.
            </p>
          </div>

          <div class="billing-actions">
            <button type="button" class="btn-primary billing-open-btn" @click="showBillingModal = true">
              <span class="material-icons">tune</span>
              Chọn hoặc đổi gói Subscription
            </button>
          </div>
        </div>

        <!-- Tab: Notifications -->
        <div v-if="currentTab === 'notifications'" class="tab-pane fade-in card">
          <div class="pane-header">
            <h3>Tùy chọn Thông báo</h3>
            <p>Chọn các thông báo bạn muốn nhận qua Email hoặc Trình duyệt.</p>
          </div>
          
          <div class="notification-list">
            <div class="notif-item">
              <div class="notif-text">
                <h4>Có đơn đặt sân mới</h4>
                <p>Nhận thông báo ngay khi có khách Đặt sân & Đặt cọc thành công.</p>
              </div>
              <div class="toggle-switch">
                <input type="checkbox" id="n1" class="switch-input" v-model="notifications.newBooking" />
                <label for="n1" class="switch-label"></label>
              </div>
            </div>
            
             <div class="notif-item">
              <div class="notif-text">
                <h4>Yêu cầu hủy sân</h4>
                <p>Khi khách hàng gởi yêu cầu hoặc hệ thống tự động hủy đơn do quá hạn.</p>
              </div>
              <div class="toggle-switch">
                <input type="checkbox" id="n2" class="switch-input" v-model="notifications.cancelBooking" />
                <label for="n2" class="switch-label"></label>
              </div>
            </div>

             <div class="notif-item">
              <div class="notif-text">
                <h4>Báo cáo doanh thu hàng tuần</h4>
                <p>Nhận báo cáo tổng hợp doanh thu gửi qua Email mỗi tối Chủ Nhật.</p>
              </div>
              <div class="toggle-switch">
                <input type="checkbox" id="n3" class="switch-input" v-model="notifications.weeklyReport" />
                <label for="n3" class="switch-label"></label>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <OwnerBillingIntroModal
      :show="showBillingModal"
      exit-without-saving
      :initial-plan-key="billing.subscriptionPlanKey"
      :initial-addons="billingAddonsArray"
      @completed="onBillingModalCompleted"
    />
  </div>
</template>

<script>
import axios from 'axios';
import { useOwnerTrial } from '@/composables/useOwnerTrial.js';
import { clubService } from '@/services/club.service';
import OwnerBillingIntroModal from '@/components/owner/OwnerBillingIntroModal.vue';
import { toast } from 'vue3-toastify';

const TRANSFER_QR_MAX = 5 * 1024 * 1024;
const TRANSFER_QR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default {
  name: 'OwnerSettingsView',
  components: { OwnerBillingIntroModal },
  setup() {
    const { isVerified, kycStatus, isPendingReview, isKycApproved, isKycRejected, refreshStatus, syncUser } = useOwnerTrial();
    return { isVerified, kycStatus, isPendingReview, isKycApproved, isKycRejected, refreshStatus, syncUser };
  },
  computed: {
    kycStatusClass() {
      if (this.isKycApproved) return 'verified';
      if (this.isPendingReview) return 'pending';
      if (this.isKycRejected) return 'rejected';
      return 'pending'; 
    },
    kycStatusIcon() {
      if (this.isKycApproved) return 'verified_user';
      if (this.isPendingReview) return 'pending_actions';
      if (this.isKycRejected) return 'cancel';
      return 'help_outline';
    },
    kycStatusLabel() {
      if (this.isKycApproved) return 'Hồ sơ đã xác minh';
      if (this.isPendingReview) return 'Đang chờ xét duyệt';
      if (this.isKycRejected) return 'Hồ sơ bị từ chối';
      if (!this.isVerified) return 'Hồ sơ chưa hoàn thiện';
      return 'Hồ sơ đã nộp';
    },
    billingAddonsArray() {
      const a = this.billing.subscriptionAddons;
      if (Array.isArray(a)) return a;
      if (a && typeof a === 'object' && Array.isArray(a.data)) return a.data;
      return [];
    },
    billingPlanSummary() {
      const k = this.billing.subscriptionPlanKey;
      const map = {
        starter: 'Starter — 299.000đ/tháng',
        growth: 'Growth — 599.000đ/tháng',
        pro: 'Pro — 1.299.000đ/tháng',
      };
      if (k && map[k]) return map[k];
      return 'Chưa chọn gói Subscription';
    },
    billingAddonsSummary() {
      const ids = this.billingAddonsArray;
      if (!ids.length) return 'Không có';
      const labels = {
        advanced_reports: 'Báo cáo nâng cao',
        priority_support: 'Hỗ trợ ưu tiên',
        sms_reminders: 'Nhắc SMS',
      };
      return ids.map((id) => labels[id] || id).join(', ');
    },
  },
  data() {
    const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
    return {
      currentTab: 'profile',
      isKycSubmitting: false,
      profile: {
        // Ưu tiên avatarUrl đã lưu trong localStorage (sau lần upload), fallback về ui-avatars
        avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name||'Owner')}&background=16a34a&color=fff`,
        fullName: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        bio: ''
      },
      kyc: {
        idCardNumber: '',
        idCardFrontUrl: '',
        idCardBackUrl: '',
        taxCode: '',
        cancellationPolicy: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
      },
      security: { oldPassword: '', newPassword: '', confirmPassword: '' },
      payment: { bankName: 'Vietcombank', accountName: user.name || '', accountNumber: '' },
      ownerClubs: [],
      transferClubId: null,
      clubTransfer: {
        transferBankName: '',
        transferAccountNumber: '',
        transferBeneficiaryName: '',
        transferQrImageUrl: '',
      },
      uploadingTransferQr: false,
      applyTransferToAllClubs: false,
      notifications: { newBooking: true, cancelBooking: true, weeklyReport: false },
      uploadingAvatar: false,
      billing: {
        subscriptionPlanKey: null,
        subscriptionAddons: [],
        billingIntroDismissedAt: null,
      },
      showBillingModal: false,
      uploading: {
        kycFront: false,
        kycBack: false,
        license: false,
      },
    }
  },
  mounted() {
    if (this.$route.query.tab === 'billing') {
      this.currentTab = 'billing';
    }
    this.loadProfile();
    this.loadOwnerClubs();
  },
  methods: {
    // Load dữ liệu đầy đủ từ API khi vào trang
    async loadProfile() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/owner/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data?.data || {};
        this.profile.fullName = data.name || data.fullName || this.profile.fullName;
        this.profile.phone = data.phone || '';
        this.profile.email = data.email || this.profile.email;
        this.profile.bio = data.bio || '';
        if (data.avatarUrl) this.profile.avatar = data.avatarUrl;
        // Load thông tin ngân hàng nếu có
        if (data.ownerProfile) {
          this.payment.bankName = data.ownerProfile.bankName || '';
          this.payment.accountName = data.ownerProfile.bankAccountName || '';
          this.payment.accountNumber = data.ownerProfile.bankAccountNumber || '';
          this.kyc.idCardNumber = data.ownerProfile.idCardNumber || '';
          this.kyc.idCardFrontUrl = data.ownerProfile.idCardFrontUrl || '';
          this.kyc.idCardBackUrl = data.ownerProfile.idCardBackUrl || '';
          this.kyc.businessLicenseUrl = data.ownerProfile.businessLicenseUrl || '';
          this.kyc.bankName = data.ownerProfile.bankName || '';
          this.kyc.bankAccountName = data.ownerProfile.bankAccountName || '';
          this.kyc.bankAccountNumber = data.ownerProfile.bankAccountNumber || '';
          this.kyc.taxCode = data.ownerProfile.taxCode || '';
          this.kyc.cancellationPolicy = data.ownerProfile.cancellationPolicy || '';
          this.billing.subscriptionPlanKey = data.ownerProfile.subscriptionPlanKey || null;
          this.billing.billingIntroDismissedAt = data.ownerProfile.billingIntroDismissedAt || null;
          const rawAddons = data.ownerProfile.subscriptionAddons;
          if (Array.isArray(rawAddons)) this.billing.subscriptionAddons = rawAddons;
          else if (rawAddons && typeof rawAddons === 'string') {
            try {
              const p = JSON.parse(rawAddons);
              this.billing.subscriptionAddons = Array.isArray(p) ? p : [];
            } catch {
              this.billing.subscriptionAddons = [];
            }
          } else this.billing.subscriptionAddons = [];
        }

        // Cập nhật localStorage để đồng bộ Layout & Badge
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          isVerified: data.isVerified,
          kycStatus: data.ownerProfile?.kycStatus || null
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.syncUser(); // Gọi từ useOwnerTrial()

      } catch (e) {
        // Nếu lỗi (chưa có profile) thì bỏ qua, dùng dữ liệu từ localStorage
        console.warn('Không load được profile từ API:', e?.response?.status);
      }
    },

    async onBillingModalCompleted(payload) {
      this.showBillingModal = false;
      if (payload?.type === 'cancel') return;
      await this.loadProfile();
      if (payload?.type === 'subscribe') {
        toast.success('Đã cập nhật gói Subscription và add-on trong hệ thống.');
      }
    },

    async loadOwnerClubs() {
      try {
        const r = await clubService.getOwnerClubs();
        const list = r.data?.data || r.data?.clubs || [];
        this.ownerClubs = Array.isArray(list) ? list : [];
        if (!this.transferClubId && this.ownerClubs.length) {
          this.transferClubId = this.ownerClubs[0].id;
        }
        this.syncClubTransferFromList();
      } catch (e) {
        console.warn('Không load được danh sách CLB:', e?.response?.status);
      }
    },

    syncClubTransferFromList() {
      const id = this.transferClubId;
      const c = this.ownerClubs.find((x) => String(x.id) === String(id));
      if (!c) {
        this.clubTransfer = {
          transferBankName: '',
          transferAccountNumber: '',
          transferBeneficiaryName: '',
          transferQrImageUrl: '',
        };
        return;
      }
      this.clubTransfer = {
        transferBankName: c.transferBankName || '',
        transferAccountNumber: c.transferAccountNumber || '',
        transferBeneficiaryName: c.transferBeneficiaryName || '',
        transferQrImageUrl: c.transferQrImageUrl || '',
      };
    },

    async onTransferQrFile(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !this.transferClubId) return;
      if (!TRANSFER_QR_TYPES.includes(file.type)) {
        alert('Chỉ chấp nhận JPG, PNG, WEBP.');
        return;
      }
      if (file.size > TRANSFER_QR_MAX) {
        alert('File vượt quá 5MB.');
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'club-transfer-qr');
      fd.append('entityId', String(this.transferClubId));
      this.uploadingTransferQr = true;
      try {
        const res = await clubService.uploadImage(fd);
        if (res.data?.success && res.data?.data?.url) {
          this.clubTransfer.transferQrImageUrl = res.data.data.url;
          const idx = this.ownerClubs.findIndex((x) => String(x.id) === String(this.transferClubId));
          if (idx !== -1) {
            this.ownerClubs[idx] = { ...this.ownerClubs[idx], transferQrImageUrl: res.data.data.url };
          }
        } else {
          alert(res.data?.message || 'Upload thất bại.');
        }
      } catch (e) {
        alert(e.response?.data?.message || e.message || 'Upload thất bại.');
      } finally {
        this.uploadingTransferQr = false;
      }
    },

    transferPayloadForClub() {
      const f = this.clubTransfer;
      const p = {};
      ['transferBankName', 'transferAccountNumber', 'transferBeneficiaryName', 'transferQrImageUrl'].forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(f, k)) p[k] = f[k] ? f[k] : null;
      });
      return p;
    },

    // Lưu thông tin cá nhân (tab profile) hoặc ngân hàng (tab payment)
    async saveChanges() {
      try {
        const token = localStorage.getItem('token');
        let payload = {};

        if (this.currentTab === 'profile') {
          payload = {
            fullName: this.profile.fullName,
            phone: this.profile.phone,
            bio: this.profile.bio,
          };
        } else if (this.currentTab === 'payment') {
          payload = {
            bankName: this.payment.bankName,
            bankAccountNumber: this.payment.accountNumber,
            bankAccountName: this.payment.accountName,
          };
        } else {
          alert('Thay đổi đã được lưu!');
          return;
        }

        await axios.patch('/api/owner/profile', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (this.currentTab === 'payment' && this.ownerClubs.length) {
          const tp = this.transferPayloadForClub();
          if (this.applyTransferToAllClubs && this.ownerClubs.length > 1) {
            await Promise.all(this.ownerClubs.map((c) => clubService.editClub(c.id, tp)));
            this.applyTransferToAllClubs = false;
          } else if (this.transferClubId) {
            await clubService.editClub(this.transferClubId, tp);
          }
          const r = await clubService.getOwnerClubs();
          const list = r.data?.data || r.data?.clubs || [];
          this.ownerClubs = Array.isArray(list) ? list : [];
          this.syncClubTransferFromList();
        }

        if (this.currentTab === 'payment' && this.applyTransferToAllClubs && this.ownerClubs.length > 1) {
          alert(`✅ Đã lưu và áp dụng thông tin chuyển khoản cho ${this.ownerClubs.length} câu lạc bộ.`);
        } else {
          alert('✅ Đã lưu thay đổi thành công!');
        }
      } catch (err) {
        alert('Lỗi: ' + (err.response?.data?.message || 'Không thể lưu lúc này.'));
      }
    },

    // Đổi mật khẩu (tab security)
    async changePassword() {
      if (this.security.newPassword !== this.security.confirmPassword) {
        alert('Mật khẩu mới và xác nhận không khớp!');
        return;
      }
      try {
        const token = localStorage.getItem('token');
        await axios.patch('/api/auth/change-password', {
          oldPassword: this.security.oldPassword,
          newPassword: this.security.newPassword,
          confirmPassword: this.security.confirmPassword,
        }, { headers: { Authorization: `Bearer ${token}` } });
        alert('✅ Đổi mật khẩu thành công!');
        this.security = { oldPassword: '', newPassword: '', confirmPassword: '' };
      } catch (err) {
        alert('Lỗi: ' + (err.response?.data?.message || 'Không thể đổi mật khẩu lúc này.'));
      }
    },

    async submitKYC() {
      if (!this.kyc.idCardNumber || !this.kyc.bankName || !this.kyc.bankAccountNumber || !this.kyc.bankAccountName) {
        alert('Vui lòng điền đầy đủ các trường bắt buộc (*)');
        return;
      }
      this.isKycSubmitting = true;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post('/api/owner/onboarding', {
          idCardNumber: this.kyc.idCardNumber,
          idCardFrontUrl: this.kyc.idCardFrontUrl || null,
          idCardBackUrl: this.kyc.idCardBackUrl || null,
          bankName: this.kyc.bankName,
          bankAccountNumber: this.kyc.bankAccountNumber,
          bankAccountName: this.kyc.bankAccountName,
          taxCode: this.kyc.taxCode || null,
          cancellationPolicy: this.kyc.cancellationPolicy || null,
        }, { headers: { Authorization: `Bearer ${token}` } });

        // Cập nhật user trong localStorage
        const updatedUser = res.data?.data?.user;
        if (updatedUser) localStorage.setItem('user', JSON.stringify(updatedUser));
        
        alert('Đã nộp hồ sơ KYC thành công! Admin sẽ xét duyệt trong 24-48h.');
        // Reload lại trang để cập nhật trạng thái isVerified
        window.location.reload();
      } catch (err) {
        alert('Lỗi: ' + (err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.'));
      } finally {
        this.isKycSubmitting = false;
      }
    },

    // Upload avatar của chủ sân
    async uploadAvatar(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.uploadingAvatar = true;
      try {
        const url = await this._doUpload(file, 'user-avatar', null);
        this.profile.avatar = url; // Cập nhật preview ngay lập tức

        // Cập nhật localStorage để avatar không bị mất sau khi reload
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          stored.avatarUrl = url;
          localStorage.setItem('user', JSON.stringify(stored));
        } catch {}
      } catch (err) {
        alert('Upload avatar thất bại: ' + err.message);
      } finally {
        this.uploadingAvatar = false;
        event.target.value = ''; // Reset input để upload lại cùng file được
      }
    },

    // Upload ảnh CCCD (front/back)
    async uploadKycImage(event, side) {
      const file = event.target.files[0];
      if (!file) return;
      const loadingKey = side === 'front' ? 'kycFront' : 'kycBack';
      this.uploading[loadingKey] = true;
      try {
        const url = await this._doUpload(file, 'user-kyc', side);
        if (side === 'front') this.kyc.idCardFrontUrl = url;
        else this.kyc.idCardBackUrl = url;
      } catch (err) {
        alert('Upload ảnh CCCD thất bại: ' + err.message);
      } finally {
        this.uploading[loadingKey] = false;
        event.target.value = '';
      }
    },

    // Upload giấy phép kinh doanh (hoặc bất kỳ loại ảnh nào)
    async uploadFile(event, type, loadingKey) {
      const file = event.target.files[0];
      if (!file) return;
      this.uploading[loadingKey] = true;
      try {
        const url = await this._doUpload(file, type, null);
        if (type === 'business-license') this.kyc.businessLicenseUrl = url;
      } catch (err) {
        alert('Upload thất bại: ' + err.message);
      } finally {
        this.uploading[loadingKey] = false;
        event.target.value = '';
      }
    },

    // Hàm dùng chung: gọi API /api/upload và trả về URL
    async _doUpload(file, type, entityId) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (entityId) formData.append('entityId', entityId);

      const token = localStorage.getItem('token');
      const res = await axios.post('/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data?.data?.url;
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

.settings-view {
  font-family: 'Barlow Condensed', sans-serif;
  color: #0f1623;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  background: white;
  border-radius: 20px;
  border: 1px solid #eaecf2;
  box-shadow: 0 4px 20px rgba(15,22,35,0.03);
}

.card-alt {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
}

/* Header */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 4px 0;
  text-transform: uppercase;
}

.view-subtitle {
  color: #64748b;
  font-size: 15px;
  margin: 0;
}

.save-btn {
  display: flex; align-items: center; gap: 8px;
  background: #16a34a; color: white;
  border: none; padding: 12px 24px; border-radius: 12px;
  font-weight: 700; font-size: 15px; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
}

.save-btn:hover { background: #15803d; transform: translateY(-2px); }

/* KYC Status Badge in Header */
.kyc-status-badge {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 100px;
  font-size: 13px; font-weight: 700;
}
.kyc-status-badge.verified { background: #ecfdf5; color: #059669; }
.kyc-status-badge.pending { background: #fffbeb; color: #d97706; }
.kyc-status-badge .material-icons { font-size: 18px; }

/* Urgent dot on menu item */
.menu-item.urgent { color: #d97706 !important; }
.urgent-dot {
  width: 8px; height: 8px;
  background: #ef4444; border-radius: 50%; margin-left: auto;
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }

/* KYC pane styles */
.pane-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
.kyc-progress-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 700;
}
.kyc-progress-badge.done { background: #ecfdf5; color: #059669; }
.kyc-progress-badge.todo { background: #fffbeb; color: #d97706; }
.kyc-progress-badge .material-icons { font-size: 18px; }

.kyc-section {
  background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 20px;
}
.kyc-section-title {
  display: flex; align-items: center; gap: 8px;
  font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700;
  color: #1e293b; margin: 0 0 20px;
}
.kyc-section-title .material-icons { font-size: 20px; color: #16a34a; }

.upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.upload-box {
  background: white; border: 2px dashed #cbd5e1; border-radius: 14px;
  padding: 24px 16px; text-align: center; transition: all 0.2s;
}
.upload-box:hover { border-color: #16a34a; background: #f0fdf4; cursor: pointer; }
.upload-box.uploading { opacity: 0.7; pointer-events: none; }

/* Preview ảnh sau khi upload */
.upload-preview {
  width: 100%; height: 140px; object-fit: cover;
  border-radius: 10px; margin-bottom: 0;
}
.upload-box.full-width .upload-preview { height: 180px; }

/* Overlay "Thay ảnh" hover trên preview */
.upload-box { position: relative; overflow: hidden; }
.preview-overlay {
  position: absolute; inset: 0;
  background: rgba(15, 22, 35, 0.5);
  display: flex; align-items: center; justify-content: center;
  gap: 6px; color: white; font-weight: 700; font-size: 14px;
  opacity: 0; transition: opacity 0.2s;
  border-radius: inherit;
}
.upload-box:hover .preview-overlay { opacity: 1; }
.preview-overlay .material-icons { font-size: 18px; }

/* Avatar loading state */
.upload-badge.loading { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.upload-box.full-width { grid-column: span 2; }
.ub-icon { font-size: 32px; color: #94a3b8; margin-bottom: 8px; display: block; }
.upload-box h4 { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
.upload-box p { font-size: 12px; color: #64748b; margin: 0 0 12px; }
.uploaded-label { color: #16a34a !important; font-weight: 700; display: flex; align-items: center; gap: 4px; justify-content: center; }
.btn-upload {
  background: white; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 7px 16px; font-size: 12px; font-weight: 700; color: #475569;
  cursor: pointer; transition: all 0.2s;
}
.btn-upload:hover { border-color: #16a34a; color: #16a34a; }
.required { color: #ef4444; }

.btn-kyc-submit {
  display: inline-flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white; border: none; padding: 14px 32px;
  border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.2);
}
.btn-kyc-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22, 163, 74, 0.3); }
.btn-kyc-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* Layout */
.settings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

/* Sidebar Menu */
.settings-menu {
  padding: 16px 0;
  align-self: flex-start;
}

.menu-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 4px;
}

.menu-item {
  width: 100%; text-align: left;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 24px; background: transparent; border: none;
  font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700; color: #64748b;
  cursor: pointer; transition: all 0.2s; position: relative;
}

.menu-item:hover { background: #f8fafc; color: #1e293b; }

.menu-item.active {
  background: #f0fdf4; color: #16a34a;
}
.menu-item.active::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0;
  width: 4px; background: #16a34a; border-radius: 0 4px 4px 0;
}

.menu-item .material-icons { font-size: 20px; }

/* Right Content Area */
.tab-pane { padding: 32px; min-height: 500px; }
.fade-in { animation: fadeIn 0.3s ease; }

.pane-header { margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; }
.pane-header h3 { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 800; margin: 0 0 6px 0; color: #1e293b; }
.pane-header p { font-size: 14px; color: #64748b; margin: 0; }

/* Profile Avatar */
.profile-avatar-section {
  display: flex; align-items: center; gap: 24px; margin-bottom: 32px;
}
.avatar-wrapper { position: relative; width: 80px; height: 80px; }
.avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #eaecf2; }
.upload-badge {
  position: absolute; bottom: -4px; right: -4px;
  background: white; border: 1px solid #e2e8f0; border-radius: 50%;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  color: #475569; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}
.upload-badge:hover { color: #16a34a; border-color: #16a34a; }
.upload-badge .material-icons { font-size: 16px; }

.avatar-info h4 { font-size: 15px; font-weight: 700; margin: 0 0 4px; color: #1e293b; }
.avatar-info p { font-size: 12px; color: #94a3b8; margin: 0 0 10px; }

.btn-outline {
  background: white; border: 1px solid #cbd5e1; border-radius: 8px;
  padding: 6px 14px; font-size: 12px; font-weight: 700; color: #475569; cursor: pointer; transition: all 0.2s;
}
.btn-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #1e293b; }

/* Form Elements */
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
}
.form-group.full-width { grid-column: span 2; }
.form-group label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-family: 'DM Sans', sans-serif; font-size: 14px; background: #f8fafc; transition: all 0.2s;
}
.form-group textarea { resize: vertical; }
.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  outline: none; border-color: #16a34a; background: white; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}
.hint { display: block; font-size: 12px; color: #94a3b8; margin-top: 6px; }

/* Actions Info */
.action-row { margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }
.btn-primary {
  background: #1e293b; color: white; border: none; border-radius: 10px;
  padding: 12px 24px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-primary:hover { background: #0f172a; }
.mt-24 { margin-top: 24px; }

/* Linked Bank Info */
.payment-section-title {
  display: flex; align-items: center; gap: 8px;
  font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700;
  color: #1e293b; margin: 28px 0 12px;
}
.payment-section-title:first-of-type { margin-top: 0; }
.payment-section-title .material-icons { font-size: 20px; color: #16a34a; }

.transfer-divider {
  height: 1px; background: #f1f5f9; margin: 28px 0;
}

.transfer-intro {
  font-size: 13px; color: #64748b; margin: 0 0 16px; line-height: 1.5;
}

.transfer-apply-all-wrap {
  margin: 0 0 16px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.transfer-apply-all-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin: 0;
}
.transfer-apply-all-label input {
  margin-top: 3px;
  width: 18px;
  height: 18px;
  accent-color: #16a34a;
  flex-shrink: 0;
}
.transfer-hint {
  font-size: 12px;
  color: #64748b;
  margin: 10px 0 0;
  line-height: 1.45;
  padding-left: 28px;
}

.transfer-empty {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 20px; border-radius: 14px;
}
.transfer-empty .material-icons { font-size: 28px; color: #94a3b8; flex-shrink: 0; }
.transfer-empty p { margin: 0; font-size: 14px; color: #64748b; line-height: 1.5; }

.transfer-qr-block {
  margin-top: 8px;
}

.transfer-qr-url {
  margin-bottom: 12px;
}

.transfer-qr-row {
  display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px;
}

.transfer-qr-preview {
  width: 140px; height: 140px;
  border: 2px dashed #cbd5e1; border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; cursor: pointer; overflow: hidden;
  background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600;
  transition: border-color 0.2s, background 0.2s;
}
.transfer-qr-preview:hover:not(.uploading) {
  border-color: #16a34a; background: #f0fdf4;
}
.transfer-qr-preview.uploading { opacity: 0.65; pointer-events: none; }
.transfer-qr-preview img {
  width: 100%; height: 100%; object-fit: contain;
}
.transfer-qr-preview .material-icons { font-size: 36px; color: #94a3b8; }

.transfer-qr-btn {
  align-self: center;
}

.linked-bank { display: flex; align-items: center; gap: 20px; }
.bank-icon { width: 56px; height: 56px; background: #16a34a; color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.bank-icon span { font-size: 28px; }
.bank-details { flex: 1; }
.bank-details h4 { margin: 0 0 4px 0; font-size: 16px; font-weight: 800; color: #1e293b; }
.account-num { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; color: #475569; margin: 0 0 2px 0; letter-spacing: 1px;}
.account-name { font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin: 0; }
.status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; }
.status-badge.verified { background: #ecfdf5; color: #059669; }
.status-badge span { font-size: 14px; }

/* Notification Switch List */
.notification-list { display: flex; flex-direction: column; gap: 20px; }
.notif-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #f1f5f9; border-radius: 14px; }
.notif-text h4 { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 6px 0; }
.notif-text p { font-size: 13px; color: #64748b; margin: 0; }

.toggle-switch { position: relative; width: 44px; height: 24px; }
.switch-input { opacity: 0; width: 0; height: 0; }
.switch-label {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #cbd5e1; border-radius: 34px; transition: .4s;
}
.switch-label:before {
  position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
  background-color: white; border-radius: 50%; transition: .4s;
}
.switch-input:checked + .switch-label { background-color: #16a34a; }
.switch-input:checked + .switch-label:before { transform: translateX(20px); }

/* Billing / Subscription tab */
.billing-tab .billing-summary {
  padding: 18px 20px;
  margin-bottom: 18px;
}
.billing-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.billing-summary-row:last-child { margin-bottom: 0; }
.billing-label { font-size: 13px; color: #64748b; font-weight: 600; }
.billing-value { font-size: 15px; color: #0f172a; }
.billing-value.muted { font-weight: 500; font-size: 14px; color: #475569; }
.billing-note.warn {
  display: flex; align-items: flex-start; gap: 10px;
  margin-top: 14px; padding: 12px 14px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
  font-size: 13px; color: #92400e; line-height: 1.45;
}
.billing-note.warn .material-icons { font-size: 20px; flex-shrink: 0; color: #d97706; }

.billing-box {
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  margin-bottom: 18px;
}
.billing-box h4 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}
.billing-box h4 .material-icons { font-size: 20px; color: #059669; }
.billing-steps {
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 13px;
  color: #475569;
  line-height: 1.55;
}
.billing-steps li { margin-bottom: 6px; }
.billing-muted {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}
.billing-actions .billing-open-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 1024px) {
  .settings-layout { grid-template-columns: 1fr; }
  .settings-menu { display: flex; overflow-x: auto; padding-bottom: 8px; }
  .menu-list { flex-direction: row; }
  .menu-item { white-space: nowrap; border-radius: 12px; }
  .menu-item.active::before { display: none; }
}

@media (max-width: 640px) {
  .view-header { flex-direction: column; align-items: stretch; gap: 16px; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.full-width { grid-column: span 1; }
  .tab-pane { padding: 20px; }
  .linked-bank { flex-direction: column; align-items: flex-start; }
}
</style>
