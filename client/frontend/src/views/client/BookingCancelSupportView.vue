<template>
  <div class="cancel-support-page">
    <div class="container py-5">
      <div class="support-card">
        <div class="header-block">
          <h1>Yeu cau huy don dat san</h1>
          <p>
            Vui long lien he truc tiep chu san de yeu cau huy hoac dieu chinh lich dat.
          </p>
        </div>

        <div v-if="isLoading" class="state-block">
          Dang tai thong tin lien he...
        </div>

        <div v-else-if="errorMessage" class="state-block error">
          {{ errorMessage }}
        </div>

        <div v-else-if="supportInfo" class="content-block">
          <div class="booking-chip">
            Ma don: <strong>#{{ supportInfo.bookingCode }}</strong>
          </div>

          <div class="info-section">
            <h2>Thong tin club</h2>
            <div class="info-row">
              <span class="label">Ten club</span>
              <span>{{ supportInfo.club?.name || "Khong co" }}</span>
            </div>
            <div class="info-row">
              <span class="label">Dia chi</span>
              <span>{{ supportInfo.club?.address || "Khong co" }}</span>
            </div>
            <div class="info-row">
              <span class="label">So dien thoai club</span>
              <a
                v-if="supportInfo.club?.phone"
                :href="`tel:${supportInfo.club.phone}`"
              >
                {{ supportInfo.club.phone }}
              </a>
              <span v-else>Khong co</span>
            </div>
            <div class="info-row">
              <span class="label">Email club</span>
              <a
                v-if="supportInfo.club?.email"
                :href="`mailto:${supportInfo.club.email}`"
              >
                {{ supportInfo.club.email }}
              </a>
              <span v-else>Khong co</span>
            </div>
          </div>

          <div class="info-section">
            <h2>Thong tin chu san</h2>
            <div class="info-row">
              <span class="label">Ho ten</span>
              <span>{{ supportInfo.owner?.fullName || "Khong co" }}</span>
            </div>
            <div class="info-row">
              <span class="label">So dien thoai</span>
              <a
                v-if="supportInfo.owner?.phone"
                :href="`tel:${supportInfo.owner.phone}`"
              >
                {{ supportInfo.owner.phone }}
              </a>
              <span v-else>Khong co</span>
            </div>
            <div class="info-row">
              <span class="label">Email</span>
              <a
                v-if="supportInfo.owner?.email"
                :href="`mailto:${supportInfo.owner.email}`"
              >
                {{ supportInfo.owner.email }}
              </a>
              <span v-else>Khong co</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn-back" @click="$router.push('/order')">
              Ve trang don hang
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { bookingService } from "@/services/booking.service";

export default {
  name: "BookingCancelSupportView",
  data() {
    return {
      isLoading: true,
      errorMessage: "",
      supportInfo: null,
    };
  },
  async mounted() {
    await this.loadSupportInfo();
  },
  methods: {
    async loadSupportInfo() {
      const token = this.$route.query.token;
      if (!token || typeof token !== "string") {
        this.errorMessage = "Lien ket khong hop le.";
        this.isLoading = false;
        return;
      }

      try {
        const res = await bookingService.getCancelSupportInfo(token);
        this.supportInfo = res?.data || null;
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.message ||
          "Khong the tai thong tin lien he. Vui long thu lai sau.";
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.cancel-support-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}

.support-card {
  max-width: 760px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 25px rgba(2, 6, 23, 0.05);
}

.header-block h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
}

.header-block p {
  margin: 10px 0 0;
  color: #475569;
}

.state-block {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #f1f5f9;
}

.state-block.error {
  background: #fff1f2;
  color: #be123c;
}

.booking-chip {
  margin-top: 18px;
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #065f46;
  font-weight: 600;
}

.info-section {
  margin-top: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.info-section h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 0;
  border-bottom: 1px dashed #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #64748b;
  min-width: 150px;
}

.info-row a {
  color: #0f766e;
  font-weight: 600;
  text-decoration: none;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.btn-back {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  background: #0f766e;
  color: white;
  font-weight: 600;
}
</style>
