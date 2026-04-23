<template>
  <div class="card activity-card">
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-title-dot"></div>
        <h3 class="card-title">Đơn đặt sân mới nhất</h3>
      </div>
      <router-link to="/owner/bookings" class="card-action">
        Xem tất cả
        <span class="material-icons action-icon">chevron_right</span>
      </router-link>
    </div>

    <!-- Mobile: thẻ từng đơn -->
    <div class="bookings-mobile" v-if="bookings.length">
      <article
        v-for="booking in bookings"
        :key="'m-' + booking.id"
        class="booking-card-mobile"
      >
        <div class="bcm-top">
          <div class="client-cell">
            <div class="avatar-ring">
              <img :src="`https://ui-avatars.com/api/?name=${booking.name}&background=0d9488&color=fff&bold=true`" class="client-avatar" alt="" />
            </div>
            <div>
              <p class="client-name">{{ booking.name }}</p>
              <p class="client-phone">{{ booking.phone }}</p>
            </div>
          </div>
          <div class="bcm-actions">
            <button type="button" class="btn-icon" title="Xem chi tiết" @click="$emit('view-booking', booking)">
              <span class="material-icons btn-svg">visibility</span>
            </button>
            <button
              v-if="booking.canConfirmPayment"
              type="button"
              class="btn-icon confirm"
              title="Xác nhận thanh toán"
              @click="$emit('confirm-payment', booking)"
            >
              <span class="material-icons btn-svg">check_circle</span>
            </button>
          </div>
        </div>
        <div class="bcm-meta">
          <div class="bcm-chip">
            <span class="material-icons bcm-chip-icon">layers</span>
            {{ booking.court }}
          </div>
          <span :class="['status-pill', booking.statusClass]">
            <span class="status-dot"></span>
            {{ booking.statusText }}
          </span>
        </div>
        <div class="bcm-row">
          <span class="material-icons bcm-row-icon">schedule</span>
          <div>
            <p class="time-main">{{ booking.time }}</p>
            <p class="time-sub">{{ booking.date }}</p>
          </div>
        </div>
        <div class="bcm-footer">
          <span class="price-value">{{ booking.amount }}</span>
          <span class="method-tag">
            <span class="material-icons method-icon">payments</span>
            {{ booking.method }}
          </span>
        </div>
      </article>
    </div>
    <p v-else class="bookings-mobile-empty">Chưa có đơn đặt sân gần đây.</p>

    <div class="table-wrap table-desktop">
      <table class="data-table">
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Sân</th>
            <th>Khung giờ</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking.id" class="table-row">
            <td>
              <div class="client-cell">
                <div class="avatar-ring">
                  <img :src="`https://ui-avatars.com/api/?name=${booking.name}&background=0d9488&color=fff&bold=true`" class="client-avatar" />
                </div>
                <div>
                  <p class="client-name">{{ booking.name }}</p>
                  <p class="client-phone">{{ booking.phone }}</p>
                </div>
              </div>
            </td>
            <td>
              <span class="court-badge">
                <span class="material-icons badge-court-icon">layers</span>
                {{ booking.court }}
              </span>
            </td>
            <td>
              <div class="time-cell">
                <span class="material-icons time-icon">schedule</span>
                <div>
                  <p class="time-main">{{ booking.time }}</p>
                  <p class="time-sub">{{ booking.date }}</p>
                </div>
              </div>
            </td>
            <td>
              <p class="price-value">{{ booking.amount }}</p>
              <span class="method-tag">
                <span class="material-icons method-icon">payments</span>
                {{ booking.method }}
              </span>
            </td>
            <td>
              <span :class="['status-pill', booking.statusClass]">
                <span class="status-dot"></span>
                {{ booking.statusText }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="btn-icon" title="Xem chi tiết" @click="$emit('view-booking', booking)">
                <span class="material-icons btn-svg">visibility</span>
              </button>
              <button v-if="booking.canConfirmPayment" class="btn-icon confirm" title="Xác nhận thanh toán" @click="$emit('confirm-payment', booking)">
                <span class="material-icons btn-svg">check_circle</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecentBookings',
  props: {
    bookings: { type: Array, required: true }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500;700&display=swap');

.card {
  background: #ffffff;
  border: 1px solid #eaecf2;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 16px rgba(15,22,35,0.06);
}

.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}

.card-title-group {
  display: flex; align-items: center; gap: 10px;
}
.card-title-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #059669;
}
.card-title {
  font-family: 'Syne', sans-serif;
  font-size: 16px; font-weight: 700; color: #0f1623;
  margin: 0;
}

.card-action {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 13px; font-weight: 600; color: #059669;
  text-decoration: none;
  transition: gap 0.2s;
}
.card-action:hover { gap: 8px; }
.action-icon { width: 14px; height: 14px; font-size: 14px; }

.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }

.data-table th {
  text-align: left; padding: 10px 14px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: #9aa3bc;
  border-bottom: 1px solid #eaecf2;
}

.table-row {
  transition: background 0.15s;
}
.table-row:hover { background: #f8fafb; }

.data-table td {
  padding: 14px;
  border-bottom: 1px solid #eaecf2;
  vertical-align: middle;
}

.data-table tr:last-child td { border-bottom: none; }

.client-cell { display: flex; align-items: center; gap: 12px; }
.avatar-ring {
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, #059669, #0d9488);
  flex-shrink: 0;
}
.client-avatar { width: 34px; height: 34px; border-radius: 50%; display: block; }
.client-name   { font-size: 14px; font-weight: 700; color: #0f1623; margin: 0; }
.client-phone  { font-size: 12px; color: #9aa3bc; margin: 0; }

.court-badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: #f1f5f9; color: #475569;
  padding: 5px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 600;
}
.badge-court-icon { width: 12px; height: 12px; font-size: 12px; }

.time-cell { display: flex; align-items: flex-start; gap: 8px; }
.time-icon { width: 14px; height: 14px; font-size: 14px; color: #9aa3bc; margin-top: 2px; flex-shrink: 0; }
.time-main { font-size: 13px; font-weight: 700; color: #0f1623; margin: 0; }
.time-sub  { font-size: 11px; color: #9aa3bc; margin: 0; }

.price-value { font-size: 14px; font-weight: 700; color: #0f1623; margin: 0 0 4px; }
.method-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: #4b5672;
  background: #f8fafc; padding: 2px 8px; border-radius: 4px;
  font-weight: 500;
}
.method-icon { width: 10px; height: 10px; font-size: 10px; }

.status-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 100px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status-pill.warning { background: #fffbeb; color: #d97706; }
.status-pill.success { background: #ecfdf5; color: #059669; }
.status-pill.info    { background: #eff6ff; color: #2563eb; }
.status-pill.danger  { background: #fef2f2; color: #dc2626; }

.actions-cell { display: flex; gap: 6px; justify-content: flex-end; }
.btn-icon {
  width: 32px; height: 32px;
  border: 1px solid #eaecf2;
  border-radius: 8px;
  background: #ffffff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #9aa3bc; transition: all 0.2s;
}
.btn-icon:hover { border-color: #059669; color: #059669; background: #ecfdf5; }
.btn-icon.confirm:hover { border-color: #059669; color: #ffffff; background: #059669; }
.btn-svg { width: 14px; height: 14px; font-size: 14px; }

/* ── Mobile cards ─────────────────────────── */
.bookings-mobile,
.bookings-mobile-empty {
  display: none;
}

.bookings-mobile {
  flex-direction: column;
  gap: 12px;
}

.booking-card-mobile {
  background: #f8fafc;
  border: 1px solid #eaecf2;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bcm-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.bcm-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.bcm-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.bcm-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #fff;
  border: 1px solid #eaecf2;
  color: #475569;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  max-width: 100%;
}

.bcm-chip-icon {
  font-size: 14px !important;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.bcm-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.bcm-row-icon {
  font-size: 16px !important;
  color: #9aa3bc;
  margin-top: 2px;
}

.bcm-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #eaecf2;
}

.bookings-mobile-empty {
  text-align: center;
  color: #9aa3bc;
  font-size: 14px;
  padding: 28px 16px;
  margin: 0;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px dashed #eaecf2;
}

@media (max-width: 768px) {
  .card {
    padding: 16px;
    border-radius: 16px;
  }

  .card-header {
    margin-bottom: 14px;
  }

  .card-title {
    font-size: 15px;
  }

  .table-desktop {
    display: none;
  }

  .bookings-mobile {
    display: flex;
  }

  .bookings-mobile-empty {
    display: block;
  }

  .btn-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
