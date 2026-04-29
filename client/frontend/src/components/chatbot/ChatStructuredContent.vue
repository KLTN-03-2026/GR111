<template>
  <div v-if="shouldRender" class="component-area">
    <!-- Component: clubList -->
    <div v-if="structuredData.component === 'clubList'" class="club-list-comp">
      <div v-if="structuredData.data?.clubs?.length">
        <div v-for="club in structuredData.data.clubs" :key="club.id" class="club-card">
          <div class="club-card-header">
            <div class="club-card-title">🏟️ {{ club.name }}</div>
            <div class="club-card-price">{{ (club.displayPrice ?? club.minPrice)?.toLocaleString() }}đ</div>
          </div>
          <div v-if="club.priceMatchType" class="price-match-row">
            <span
              class="price-match-badge"
              :class="club.priceMatchType === 'EXACT' ? 'exact' : 'nearest'"
            >
              {{ club.priceMatchType === 'EXACT' ? 'Giá đúng yêu cầu' : 'Giá gần nhất' }}
            </span>
            <span v-if="club.priceDiff > 0" class="price-diff-text">
              lệch {{ club.priceDiff?.toLocaleString() }}đ
            </span>
          </div>
          <p class="club-card-addr">📍 {{ club.address }}</p>
          <div class="club-card-footer">
            <span class="card-tag">🕐 {{ club.openTime }}-{{ club.closeTime }}</span>
            <button type="button" @click="openVenueDetail(club)" class="card-btn">Chi tiết</button>
          </div>
        </div>
      </div>
      <div v-else class="no-results">
        <p class="no-results-title">Rất tiếc, hiện không có CLB phù hợp với bộ lọc.</p>
        <p v-if="structuredData.data?.suggestionHint" class="no-results-hint">{{ structuredData.data.suggestionHint }}</p>
        <p v-else class="no-results-hint">Thử nới địa điểm, đổi môn hoặc nhắn lại khu vực cụ thể hơn nhé.</p>
      </div>
    </div>

    <!-- Component: clubDetail -->
    <div v-if="structuredData.component === 'clubDetail'" class="club-detail-comp">
      <div class="detail-banner">⭐ {{ structuredData.data.name }}</div>
      <div class="detail-info-row">
        <div class="info-item"><span>Giờ mở cửa:</span> <strong>{{ structuredData.data.openTime }} - {{ structuredData.data.closeTime }}</strong></div>
      </div>
      <div class="amenities-wrap">
        <span v-for="a in structuredData.data.amenities" :key="a.name" class="amenity-chip">{{ a.name }}</span>
      </div>
      <div
        v-if="structuredData.data.courts?.length"
        class="court-pricing-wrap"
      >
        <div class="court-pricing-title">Bảng giá theo từng sân</div>
        <div
          v-for="court in structuredData.data.courts"
          :key="court.id"
          class="court-pricing-card"
        >
          <div class="court-pricing-head">
            <span class="court-name">{{ court.name }}</span>
            <span class="court-sport">{{ court.sportLabel }}</span>
          </div>
          <div
            v-for="(price, idx) in (court.pricings || [])"
            :key="`${court.id}-${idx}`"
            class="price-row"
          >
            <span>{{ price.startTime }} - {{ price.endTime }}</span>
            <strong>{{ price.pricePerHour?.toLocaleString() }}đ/giờ</strong>
          </div>
          <div
            v-if="!court.pricings || !court.pricings.length"
            class="price-empty"
          >
            Chưa có bảng giá chi tiết cho sân này.
          </div>
        </div>
      </div>
      <button @click="emitQuickMessage('Tìm giờ trống sân ' + structuredData.data.name)" class="action-full-btn">Xem giờ trống</button>
    </div>

    <!-- Component: slotPicker -->
    <div v-if="structuredData.component === 'slotPicker'" class="slot-picker-comp">
      <div v-for="court in structuredData.data.courts" :key="court.courtId" class="court-block">
        <div class="court-label">📍 {{ court.name }}</div>
        <div class="slots-flex">
          <button
            v-for="slot in court.slots"
            :key="slot.id"
            @click="emitQuickMessage('Tôi muốn đặt sân ' + court.name + ' khung giờ ' + slot.start)"
            class="slot-chip"
          >
            {{ slot.start }}
          </button>
        </div>
      </div>
    </div>

    <!-- Component: bookingConfirm -->
    <div v-if="structuredData.component === 'bookingConfirm'" class="confirm-comp">
      <div class="comp-title">📋 Xác nhận đặt sân</div>
      <div class="confirm-details">
        <div class="detail-line"><span>Sân:</span> <strong>{{ structuredData.data.clubName }}</strong></div>
        <div class="detail-line"><span>Ngày:</span> <strong>{{ structuredData.data.date }}</strong></div>
        <div class="detail-line"><span>Khung giờ:</span>
          <span class="slot-text" v-for="s in structuredData.data.slots" :key="s.startTime">{{ s.courtName }} ({{ s.startTime }})</span>
        </div>
        <div class="total-line"><span>Tổng:</span> <strong>{{ structuredData.data.totalAmount?.toLocaleString() }}đ</strong></div>
      </div>
      <div class="confirm-footer">
        <button @click="emitQuickMessage('Xác nhận đặt sân')" class="btn-confirm">✅ Xác nhận</button>
        <button @click="emitQuickMessage('Tôi muốn thay đổi thông tin')" class="btn-cancel">Hủy</button>
      </div>
    </div>

    <!-- Component: bookingSuccess -->
    <div v-if="structuredData.component === 'bookingSuccess'" class="success-comp">
      <div class="success-icon-big">🎉</div>
      <h3>Đặt sân thành công!</h3>
      <div class="success-info">
        <div class="info-val">Mã: <strong>{{ structuredData.data.bookingCode }}</strong></div>
        <div class="info-val">Tiền: <strong>{{ structuredData.data.amount?.toLocaleString() }}đ</strong></div>
      </div>
      <a
        v-if="structuredData.data.paymentUrl"
        :href="structuredData.data.paymentUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="pay-now-btn"
      >
        Thanh toán ngay
      </a>
    </div>

    <!-- Component: userProfile -->
    <div v-if="structuredData.component === 'userProfile'" class="profile-comp">
      <div class="profile-item"><span>Họ tên:</span> {{ structuredData.data.fullName }}</div>
      <div class="profile-item"><span>Số điện thoại:</span> {{ structuredData.data.phone }}</div>
      <div class="profile-item"><span>Email:</span> {{ structuredData.data.email }}</div>
    </div>

    <!-- Component: bookingHistory -->
    <div v-if="structuredData.component === 'bookingHistory'" class="history-comp">
      <div v-for="b in structuredData.data" :key="b.code" class="history-card">
        <div class="history-main">
          <div class="h-name">{{ b.club }}</div>
          <div class="h-date">{{ b.time }}</div>
        </div>
        <div class="h-status" :class="b.status.toLowerCase()">{{ b.status }}</div>
      </div>
    </div>

    <!-- Component: userInsights -->
    <div v-if="structuredData.component === 'userInsights'" class="insights-comp">
      <div class="insights-title">📊 Thói quen &amp; sở thích của bạn</div>

      <div
        v-if="structuredData.data?.message && !insightsHasAnyBody(structuredData.data)"
        class="insights-empty"
      >
        {{ structuredData.data.message }}
      </div>

      <template v-else>
        <div
          v-if="structuredData.data?.message && insightsHasAnyBody(structuredData.data)"
          class="insights-hint"
        >
          {{ structuredData.data.message }}
        </div>

        <div v-if="structuredData.data.favoriteSports?.length" class="insights-section">
          <div class="insights-label">Môn hay chơi</div>
          <div class="insights-chips">
            <span
              v-for="item in structuredData.data.favoriteSports"
              :key="item.sportType"
              class="insight-chip"
            >
              {{ item.sportLabel }} ({{ item.slotCount }})
            </span>
          </div>
        </div>

        <div v-if="structuredData.data.favoriteHours?.length" class="insights-section">
          <div class="insights-label">Giờ hay đặt</div>
          <div class="insights-chips">
            <span
              v-for="item in structuredData.data.favoriteHours"
              :key="item.hour"
              class="insight-chip"
            >
              {{ String(item.hour).padStart(2, '0') }}:00 ({{ item.slotCount }})
            </span>
          </div>
        </div>

        <div class="insights-section" v-if="structuredData.data.topClubs?.length">
          <div class="insights-label">CLB hay đặt</div>
          <div
            v-for="club in structuredData.data.topClubs"
            :key="club.clubId"
            class="insight-row"
          >
            <span>{{ club.clubName }}</span>
            <strong>{{ club.slotCount }} slot</strong>
          </div>
        </div>

        <div class="insights-section" v-if="structuredData.data.savedClubBookmarks?.length">
          <div class="insights-label">CLB đã lưu</div>
          <div
            v-for="row in structuredData.data.savedClubBookmarks"
            :key="row.clubId"
            class="insight-row insight-row-action"
          >
            <button
              type="button"
              class="insight-link"
              @click="openVenueDetail({ slug: row.slug, name: row.clubName })"
            >
              {{ row.clubName }}
            </button>
            <span class="insight-meta">{{ formatInsightPlace(row.city, row.district) }}</span>
          </div>
        </div>

        <div class="insights-section" v-if="structuredData.data.savedCourtBookmarks?.length">
          <div class="insights-label">Sân đã lưu</div>
          <div
            v-for="row in structuredData.data.savedCourtBookmarks"
            :key="row.courtId"
            class="insight-block"
          >
            <div class="insight-row">
              <span><strong>{{ row.courtName }}</strong> · {{ row.sportLabel }}</span>
              <button
                v-if="row.clubSlug"
                type="button"
                class="insight-link-small"
                @click="openVenueDetail({ slug: row.clubSlug, name: row.clubName })"
              >
                CLB
              </button>
            </div>
            <div class="insight-sub">{{ row.clubName }} · {{ formatInsightPlace(row.city, row.district) }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Component: authRequired -->
    <div v-if="structuredData.component === 'authRequired'" class="auth-comp">
      <p>{{ structuredData.data.error || 'Bạn cần đăng nhập để thực hiện thao tác này.' }}</p>
      <a href="/login" class="auth-btn">Đến trang đăng nhập</a>
    </div>

    <!-- Component: error -->
    <div v-if="structuredData.component === 'error'" class="error-comp">
      <div class="error-box">⚠️ {{ structuredData.data.error || 'Đã có lỗi xảy ra' }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  structuredData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["quick-message"]);

const router = useRouter();

const supportedComponents = new Set([
  'clubList',
  'clubDetail',
  'slotPicker',
  'bookingConfirm',
  'bookingSuccess',
  'userProfile',
  'bookingHistory',
  'userInsights',
  'authRequired',
  'error',
]);

const shouldRender = computed(() =>
  supportedComponents.has(props.structuredData?.component),
);

const emitQuickMessage = (text) => {
  emit("quick-message", text);
};

/** Có ít nhất một khối dữ liệu để hiển thị (không chỉ message). */
function insightsHasAnyBody(data) {
  if (!data || typeof data !== "object") return false;
  return Boolean(
    (data.favoriteSports && data.favoriteSports.length)
      || (data.favoriteHours && data.favoriteHours.length)
      || (data.topClubs && data.topClubs.length)
      || (data.savedClubBookmarks && data.savedClubBookmarks.length)
      || (data.savedCourtBookmarks && data.savedCourtBookmarks.length),
  );
}

function formatInsightPlace(city, district) {
  const d = typeof district === "string" && district.trim() ? district.trim() : "";
  const c = typeof city === "string" && city.trim() ? city.trim() : "";
  if (d && c) return `${d}, ${c}`;
  return d || c || "";
}

/** Trang chi tiết đặt sân: /venue/:id với id = slug CLB (VenueDetailView). */
const openVenueDetail = (club) => {
  const slug = typeof club?.slug === "string" ? club.slug.trim() : "";
  if (slug) {
    router.push({ name: "venue-detail", params: { id: slug } });
    return;
  }
  emitQuickMessage(`Xem chi tiết sân ${club?.name || ""}`);
};
</script>

<style scoped>
.component-area {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.club-card { background: var(--bg-card, #f8f9fa); border-radius: 12px; border: 1px solid var(--border, #e9ecef); padding: 1.15rem; transition: 0.2s; }
.club-card:hover { border-color: var(--primary-light, rgba(0, 140, 255, 0.1)); box-shadow: 0 4px 12px var(--primary-light, rgba(0, 140, 255, 0.1)); }

.club-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  align-items: flex-start;
  gap: 0.5rem;
}
.club-card-title {
  font-weight: 700;
  color: var(--text-hi, #1e293b);
  font-size: 0.95rem;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.club-card-price {
  color: var(--primary, #008cff);
  font-weight: 700;
  font-size: 0.85rem;
  background: var(--primary-light, rgba(0, 140, 255, 0.1));
  padding: 4px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  white-space: nowrap;
}
.price-match-row { margin: 4px 0 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.price-match-badge { font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 999px; }
.price-match-badge.exact { background: #dcfce7; color: #166534; }
.price-match-badge.nearest { background: #dbeafe; color: #1e40af; }
.price-diff-text { font-size: 0.75rem; color: var(--text-mid, #6c757d); font-weight: 600; }
.club-card-addr { font-size: 0.8rem; color: var(--text-mid, #6c757d); margin: 6px 0 12px; line-height: 1.4; overflow-wrap: anywhere; word-break: break-word; }
.club-card-footer { display: flex; justify-content: space-between; align-items: center; }
.card-tag { font-size: 0.75rem; color: var(--text-mid, #6c757d); font-weight: 500; background: #e2e8f0; padding: 4px 8px; border-radius: 6px; }
.card-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--primary, #008cff); background: transparent; color: var(--primary, #008cff); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s; outline: none; }
.card-btn:hover { background: var(--primary, #008cff); color: white; }

.court-block { margin-bottom: 1rem; background: #ffffff; border: 1px solid var(--border, #e9ecef); border-radius: 12px; padding: 1rem; }
.court-label { font-size: 0.9rem; font-weight: 700; color: var(--text-hi, #1e293b); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 6px; }
.slots-flex { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.slot-chip { padding: 6px 12px; border-radius: 8px; background: var(--primary-light, rgba(0, 140, 255, 0.1)); border: 1px solid transparent; color: var(--primary-dark, #0073cc); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s; outline: none;}
.slot-chip:hover { background: var(--primary, #008cff); color: white; transform: translateY(-1px); box-shadow: 0 4px 10px var(--primary-light, rgba(0, 140, 255, 0.1)); }

.confirm-comp { background: #ffffff; border: 2px solid var(--primary, #008cff); border-radius: 16px; padding: 1.5rem; box-shadow: 0 8px 24px var(--primary-light, rgba(0, 140, 255, 0.1)); }
.comp-title { font-size: 1.1rem; font-weight: 700; color: var(--primary, #008cff); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 6px; }
.confirm-details { font-size: 0.95rem; display: flex; flex-direction: column; gap: 0.75rem; color: var(--text-mid, #6c757d); }
.detail-line { display: flex; justify-content: space-between; align-items: flex-start; }
.detail-line strong { color: var(--text-hi, #1e293b); text-align: right; max-width: 60%; }
.slot-text { display: block; text-align: right; margin-bottom: 2px; }
.total-line { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--border, #e9ecef); display: flex; justify-content: space-between; color: var(--text-hi, #1e293b); font-size: 1.15rem; font-weight: 700;}
.confirm-footer { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
.btn-confirm { flex: 1; padding: 10px; border-radius: 10px; border: none; background: var(--primary, #008cff); color: white; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.2s; outline: none;}
.btn-confirm:hover { background: var(--primary-dark, #0073cc); box-shadow: 0 4px 12px var(--primary-light, rgba(0, 140, 255, 0.1)); }
.btn-cancel { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border, #e9ecef); background: var(--bg-card, #f8f9fa); color: var(--text-mid, #6c757d); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: 0.2s; outline: none; }
.btn-cancel:hover { background: #e2e8f0; color: var(--text-hi, #1e293b); }

.success-comp { text-align: center; padding: 2rem 1.5rem; background: #ecfdf5; border: 1px solid #10b981; border-radius: 16px; }
.success-icon-big { font-size: 3.5rem; margin-bottom: 1rem; line-height: 1;}
.success-comp h3 { font-size: 1.25rem; color: #059669; font-weight: 700; margin: 0 0 1rem 0; }
.success-info { display: flex; flex-direction: column; gap: 8px; font-size: 0.95rem; color: #064e3b; }
.info-val { background: rgba(255,255,255,0.6); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; }
.pay-now-btn { margin-top: 1rem; display: inline-block; padding: 10px 18px; border-radius: 10px; background: #059669; color: white; font-weight: 700; text-decoration: none; }
.pay-now-btn:hover { background: #047857; color: white; }

.history-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-base, #ffffff); border-radius: 12px; margin-bottom: 0.75rem; border: 1px solid var(--border, #e9ecef); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.h-name { font-weight: 700; color: var(--text-hi, #1e293b); font-size: 0.95rem; margin-bottom: 4px; }
.h-date { font-size: 0.8rem; color: var(--text-mid, #6c757d); font-weight: 500; }
.h-status { font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.h-status.confirmed { background: #d1fae5; color: #059669; }
.h-status.pending { background: #fef3c7; color: #d97706; }

.profile-comp { display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-base, #ffffff); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border, #e9ecef); }
.profile-item { font-size: 0.95rem; color: var(--text-hi, #1e293b); display: flex; flex-direction: column; gap: 4px; }
.profile-item span { font-size: 0.75rem; font-weight: 600; color: var(--text-mid, #6c757d); text-transform: uppercase; letter-spacing: 0.5px; }

.auth-comp { text-align: center; padding: 1.5rem; background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; }
.auth-comp p { font-size: 0.95rem; color: #92400e; margin: 0 0 1rem 0; font-weight: 500; line-height: 1.5; }
.auth-btn { display: inline-block; padding: 10px 24px; border-radius: 10px; background: var(--primary, #008cff); color: white; font-weight: 700; text-decoration: none; font-size: 0.95rem; transition: 0.2s; }
.auth-btn:hover { background: var(--primary-dark, #0073cc); box-shadow: 0 4px 12px var(--primary-light, rgba(0, 140, 255, 0.1)); color: white; }

.error-comp { padding: 0.5rem 0; }
.error-box { padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; font-size: 0.95rem; font-weight: 500; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; margin:0;}

.insights-comp { background: var(--bg-base, #ffffff); padding: 1rem; border-radius: 12px; border: 1px solid var(--border, #e9ecef); }
.insights-title { font-size: 0.95rem; font-weight: 700; color: var(--text-hi, #1e293b); margin-bottom: 0.85rem; }
.insights-section { margin-bottom: 0.75rem; }
.insights-label { font-size: 0.78rem; color: var(--text-mid, #6c757d); font-weight: 700; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.3px; }
.insights-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.insight-chip { font-size: 0.8rem; background: var(--bg-chat, #f4f6f9); border: 1px solid var(--border, #e9ecef); border-radius: 8px; padding: 4px 8px; color: var(--text-hi, #1e293b); }
.insight-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-size: 0.85rem; padding: 6px 0; border-bottom: 1px dashed var(--border, #e9ecef); min-width: 0; }
.insight-row > span:first-child { min-width: 0; overflow-wrap: anywhere; flex: 1; }
.insight-row:last-child { border-bottom: none; }
.insights-empty { font-size: 0.9rem; color: var(--text-mid, #6c757d); }
.insights-hint {
  font-size: 0.82rem;
  color: var(--text-mid, #6c757d);
  margin-bottom: 0.75rem;
  line-height: 1.45;
  padding: 8px 10px;
  background: var(--bg-chat, #f4f6f9);
  border-radius: 8px;
}
.insight-row-action { align-items: flex-start; gap: 8px; flex-wrap: wrap; }
.insight-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--primary, #008cff);
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.insight-link:hover { color: var(--primary-dark, #0073cc); }
.insight-meta { font-size: 0.78rem; color: var(--text-mid, #6c757d); text-align: right; overflow-wrap: anywhere; flex-shrink: 1; min-width: 0; }
.insight-block { margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px dashed var(--border, #e9ecef); }
.insight-block:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.insight-sub { font-size: 0.78rem; color: var(--text-mid, #6c757d); margin-top: 4px; }
.insight-link-small {
  background: none;
  border: none;
  padding: 2px 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary, #008cff);
  cursor: pointer;
  border-radius: 6px;
}
.insight-link-small:hover { background: var(--primary-light, rgba(0, 140, 255, 0.1)); }

.club-detail-comp { background: var(--bg-base, #ffffff); padding: 1.25rem; border-radius: 16px; border: 1px solid var(--border, #e9ecef); }
.detail-banner {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-hi, #1e293b);
  margin: 0 0 1rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border, #e9ecef);
  overflow-wrap: anywhere;
}
.detail-info-row { margin-bottom: 1rem; }
.info-item { font-size: 0.95rem; color: var(--text-mid, #6c757d); display: flex; justify-content: space-between; }
.info-item strong { color: var(--text-hi, #1e293b); }
.amenities-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
.amenity-chip { padding: 4px 10px; border-radius: 8px; background: var(--bg-chat, #f4f6f9); border: 1px solid var(--border, #e9ecef); color: var(--text-hi, #1e293b); font-size: 0.8rem; font-weight: 500; }
.court-pricing-wrap { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
.court-pricing-title { font-size: 0.78rem; color: var(--text-mid, #6c757d); font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
.court-pricing-card { border: 1px solid var(--border, #e9ecef); border-radius: 10px; background: var(--bg-chat, #f4f6f9); padding: 0.75rem; }
.court-pricing-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 0.5rem; flex-wrap: wrap; }
.court-name { font-size: 0.88rem; font-weight: 700; color: var(--text-hi, #1e293b); overflow-wrap: anywhere; min-width: 0; flex: 1; }
.court-sport { font-size: 0.72rem; font-weight: 700; color: var(--primary-dark, #0073cc); background: var(--primary-light, rgba(0, 140, 255, 0.1)); border-radius: 999px; padding: 3px 8px; }
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--border, #e9ecef);
  font-size: 0.82rem;
  color: var(--text-mid, #6c757d);
  flex-wrap: wrap;
}
.price-row span:first-child { min-width: 0; overflow-wrap: anywhere; }
.price-row:last-child { border-bottom: none; }
.price-row strong { color: var(--text-hi, #1e293b); font-size: 0.83rem; }
.price-empty { font-size: 0.8rem; color: var(--text-mid, #6c757d); font-style: italic; }
.action-full-btn { width: 100%; padding: 12px; border-radius: 10px; background: var(--primary, #008cff); color: white; font-weight: 700; border: none; cursor: pointer; font-size: 0.95rem; transition: 0.2s; outline: none;}
.action-full-btn:hover { background: var(--primary-dark, #0073cc); box-shadow: 0 4px 15px var(--primary-light, rgba(0, 140, 255, 0.1)); }

.no-results { text-align: center; padding: 1.5rem; background: var(--bg-base, #ffffff); border-radius: 12px; border: 1px dashed var(--border, #e9ecef); }
.no-results-title { font-size: 0.95rem; color: var(--text-hi, #1e293b); font-weight: 600; margin: 0 0 0.65rem 0; line-height: 1.45; }
.no-results-hint { font-size: 0.88rem; color: var(--text-mid, #6c757d); font-weight: 500; margin: 0; line-height: 1.5; text-align: left; }
</style>
