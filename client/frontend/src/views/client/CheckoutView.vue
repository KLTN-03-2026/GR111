<template>
  <div class="checkout-page">

    <!-- HEADER BREADCRUMB -->
    <div class="chk-header">
      <div class="container">
        <div class="d-flex align-items-center gap-2 chk-breadcrumb">
          <button class="chk-back-btn" @click="$router.back()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="text-muted small">Đặt sân</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span class="small fw-bold text-dark">Thanh toán</span>
        </div>
        <div class="chk-progress mt-3">
          <div class="chk-step chk-step--done">
            <div class="chk-step__circle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span>Chọn sân</span>
          </div>
          <div class="chk-step__line chk-step__line--done"></div>
          <div class="chk-step chk-step--active">
            <div class="chk-step__circle">2</div>
            <span>Thanh toán</span>
          </div>
          <div class="chk-step__line"></div>
          <div class="chk-step">
            <div class="chk-step__circle">3</div>
            <span>Xác nhận</span>
          </div>
        </div>
      </div>
    </div>

    <div class="container chk-main">

      <!-- SUCCESS SCREEN -->
      <transition name="fade">
        <div v-if="bookingSuccess" class="chk-success">
          <div class="chk-success__card">
            <div class="chk-success__anim">
              <div class="chk-success__ring"></div>
              <div class="chk-success__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <h2 class="fw-black mt-4 mb-1">Đặt sân thành công! 🎉</h2>
            <p class="text-muted mb-4">Thông tin xác nhận đã được gửi đến <strong>{{ bookingInfo.phone }}</strong></p>
            <div class="chk-success__code">
              <span class="text-muted small">Mã đặt sân</span>
              <strong class="fs-4">{{ bookingCode }}</strong>
            </div>
            <div class="chk-success__summary mt-4 text-start">
              <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted small">Sân</span><span class="fw-bold small">{{ bookingInfo.venue_name }}</span></div>
              <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted small">Loại sân</span><span class="fw-bold small">{{ courtNamesSummary }}</span></div>
              <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted small">Ngày</span><span class="fw-bold small">{{ formattedDate }}</span></div>
              <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted small">Khung giờ</span><span class="fw-bold small" style="text-align:right;max-width:60%">{{ slotsSummary }}</span></div>
              <div class="d-flex justify-content-between py-2"><span class="text-muted small">Tổng tiền</span><span class="fw-black text-success">{{ formatPrice(bookingInfo.total) }} đ</span></div>
            </div>
            <div class="d-flex gap-3 mt-4 flex-wrap justify-content-center">
              <button class="btn btn-success fw-bold px-4" @click="$router.push('/')">Về trang chủ</button>
              <button class="btn btn-outline-secondary fw-bold px-4" @click="printConfirmation">In xác nhận</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- MAIN CHECKOUT -->
      <div v-if="!bookingSuccess" class="row g-4">

        <!-- LEFT -->
        <div class="col-lg-7">

          <!-- THÔNG TIN ĐẶT SÂN -->
          <div class="chk-card mb-4">
            <div class="chk-card__header">
              <div class="chk-card__icon chk-card__icon--green">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span>Thông tin đặt sân</span>
              <!-- Badge số sân -->
              <span v-if="bookingInfo.courts.length > 1" class="ms-auto badge bg-success rounded-pill" style="font-size:11px">{{ bookingInfo.courts.length }} sân</span>
            </div>
            <div class="chk-card__body">
              <div class="chk-booking-banner">
                <div class="chk-booking-banner__left">
                  <div class="chk-booking-banner__venue">{{ bookingInfo.venue_name }}</div>
                  <!-- Hiển thị tất cả sân đã đặt -->
                  <div class="d-flex flex-wrap gap-2 mb-2">
                    <div v-for="court in bookingInfo.courts" :key="court.id" class="chk-booking-banner__court">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                      {{ court.name }}
                    </div>
                  </div>
                  <div class="chk-booking-banner__meta">
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ formattedDate }}
                    </span>
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {{ parsedSlots.length }} khung giờ
                    </span>
                  </div>
                </div>
                <div class="chk-booking-banner__badge">⚽</div>
              </div>

              <!-- Chi tiết khung giờ — group theo từng sân -->
              <div v-if="parsedSlots.length" class="mt-3">
                <div class="chk-slots-title">Chi tiết khung giờ</div>
                <template v-for="court in bookingInfo.courts" :key="court.id">
                  <div v-if="slotsByCourt(court.id).length">
                    <!-- Header tên sân -->
                    <div class="chk-court-label mt-2 mb-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                      {{ court.name }}
                    </div>
                    <div class="chk-slots-list">
                      <div v-for="(slot, i) in slotsByCourt(court.id)" :key="i" class="chk-slot-row">
                        <div class="chk-slot-row__time">{{ slot.time }}</div>
                        <div class="chk-slot-row__price">{{ formatPrice(slot.price) }} đ</div>
                      </div>
                      <!-- Subtotal sân này -->
                      <div class="chk-slot-row chk-slot-row--subtotal">
                        <div class="chk-slot-row__time text-muted" style="font-size:11px">Cộng {{ court.name }}</div>
                        <div class="chk-slot-row__price" style="font-size:12px">{{ formatPrice(courtSubtotal(court.id)) }} đ</div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Dịch vụ thêm -->
              <div v-if="parsedServices.length" class="mt-3">
                <div class="chk-slots-title">Dịch vụ thêm</div>
                <div class="chk-slots-list">
                  <div v-for="svc in parsedServices" :key="svc.id" class="chk-slot-row">
                    <div class="chk-slot-row__time">{{ svc.name }}</div>
                    <div class="chk-slot-row__price">{{ formatPrice(svc.price) }} đ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- THÔNG TIN KHÁCH HÀNG — READ-ONLY -->
          <div class="chk-card mb-4">
            <div class="chk-card__header">
              <div class="chk-card__icon chk-card__icon--blue">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span>Thông tin khách hàng</span>
              <div class="chk-readonly-badge ms-auto">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Không thể chỉnh sửa
              </div>
            </div>
            <div class="chk-card__body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="chk-label">Họ và tên</label>
                  <div class="chk-readonly-field">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>{{ bookingInfo.name || '—' }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="chk-label">Số điện thoại</label>
                  <div class="chk-readonly-field">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.22 6.22l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
                    <span>{{ bookingInfo.phone || '—' }}</span>
                  </div>
                </div>
                <div v-if="bookingInfo.email" class="col-md-6">
                  <label class="chk-label">Email</label>
                  <div class="chk-readonly-field">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span>{{ bookingInfo.email }}</span>
                  </div>
                </div>
                <div v-if="bookingInfo.note" class="col-md-6">
                  <label class="chk-label">Ghi chú</label>
                  <div class="chk-readonly-field">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{{ bookingInfo.note }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- PHƯƠNG THỨC THANH TOÁN -->
          <div class="chk-card mb-4">
            <div class="chk-card__header">
              <div class="chk-card__icon chk-card__icon--purple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <span>Phương thức thanh toán</span>
            </div>
            <div class="chk-card__body">
              <div class="chk-pay-methods">

                <!-- Chuyển khoản ngân hàng -->
                <div :class="['chk-pay-method', {active: payMethod==='bank'}]" @click="payMethod='bank'">
                  <div class="chk-pay-method__radio"><div class="chk-radio-dot" v-if="payMethod==='bank'"></div></div>
                  <div class="chk-pay-method__icon" style="background:#eff6ff">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"/></svg>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-bold small">Chuyển khoản ngân hàng</div>
                    <div class="text-muted" style="font-size:11px">VietcomBank, BIDV, Techcombank...</div>
                  </div>
                  <span class="chk-pay-badge chk-pay-badge--blue">Phổ biến</span>
                </div>
                <transition name="slide-down">
                  <div v-if="payMethod==='bank'" class="chk-pay-detail">
                    <div class="chk-bank-qr-wrap">
                      <div class="chk-bank-qr">
                        <svg viewBox="0 0 200 200" width="128" height="128" xmlns="http://www.w3.org/2000/svg">
                          <rect width="200" height="200" fill="white"/>
                          <rect x="10" y="10" width="60" height="60" rx="4" fill="none" stroke="#0f172a" stroke-width="7"/>
                          <rect x="25" y="25" width="30" height="30" rx="2" fill="#0f172a"/>
                          <rect x="130" y="10" width="60" height="60" rx="4" fill="none" stroke="#0f172a" stroke-width="7"/>
                          <rect x="145" y="25" width="30" height="30" rx="2" fill="#0f172a"/>
                          <rect x="10" y="130" width="60" height="60" rx="4" fill="none" stroke="#0f172a" stroke-width="7"/>
                          <rect x="25" y="145" width="30" height="30" rx="2" fill="#0f172a"/>
                          <rect x="90" y="10" width="10" height="10" fill="#0f172a"/><rect x="105" y="10" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="25" width="10" height="10" fill="#0f172a"/><rect x="105" y="40" width="10" height="10" fill="#0f172a"/>
                          <rect x="10" y="90" width="10" height="10" fill="#0f172a"/><rect x="25" y="90" width="10" height="10" fill="#0f172a"/>
                          <rect x="55" y="90" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="90" width="10" height="10" fill="#0f172a"/><rect x="105" y="90" width="10" height="10" fill="#0f172a"/>
                          <rect x="120" y="90" width="10" height="10" fill="#0f172a"/><rect x="150" y="90" width="10" height="10" fill="#0f172a"/>
                          <rect x="165" y="90" width="10" height="10" fill="#0f172a"/><rect x="180" y="90" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="105" width="10" height="10" fill="#0f172a"/><rect x="120" y="105" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="120" width="10" height="10" fill="#0f172a"/><rect x="105" y="120" width="10" height="10" fill="#0f172a"/>
                          <rect x="135" y="120" width="10" height="10" fill="#0f172a"/><rect x="165" y="120" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="135" width="10" height="10" fill="#0f172a"/><rect x="120" y="135" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="150" width="10" height="10" fill="#0f172a"/><rect x="105" y="150" width="10" height="10" fill="#0f172a"/>
                          <rect x="135" y="150" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="165" width="10" height="10" fill="#0f172a"/><rect x="120" y="165" width="10" height="10" fill="#0f172a"/>
                          <rect x="90" y="180" width="10" height="10" fill="#0f172a"/><rect x="150" y="180" width="10" height="10" fill="#0f172a"/>
                        </svg>
                        <div class="chk-bank-qr__label">Quét để chuyển khoản nhanh</div>
                      </div>
                      <div class="chk-bank-info">
                        <div class="chk-bank-row">
                          <span class="chk-bank-row__label">Ngân hàng</span>
                          <span class="chk-bank-row__value fw-bold">VietcomBank</span>
                        </div>
                        <div class="chk-bank-row">
                          <span class="chk-bank-row__label">Tên TK</span>
                          <span class="chk-bank-row__value fw-bold">CTY TNHH THÀNH PHÁT</span>
                        </div>
                        <div class="chk-bank-row">
                          <span class="chk-bank-row__label">Số TK</span>
                          <div class="d-flex align-items-center gap-2">
                            <span class="chk-bank-row__value fw-black" style="letter-spacing:1px">1023 9876 5432</span>
                            <button class="chk-copy-btn" @click="copyText('102398765432','acc')" :class="{copied: copiedField==='acc'}">
                              <svg v-if="copiedField!=='acc'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                          </div>
                        </div>
                        <div class="chk-bank-row chk-bank-row--highlight">
                          <span class="chk-bank-row__label">Nội dung CK</span>
                          <div class="d-flex align-items-center gap-2">
                            <span class="chk-bank-row__value fw-black text-success">{{ transferContent }}</span>
                            <button class="chk-copy-btn" @click="copyText(transferContent,'content')" :class="{copied: copiedField==='content'}">
                              <svg v-if="copiedField!=='content'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                          </div>
                        </div>
                        <div class="chk-bank-row">
                          <span class="chk-bank-row__label">Số tiền</span>
                          <span class="chk-bank-row__value fw-black text-success fs-6">{{ formatPrice(bookingInfo.total) }} đ</span>
                        </div>
                      </div>
                    </div>
                    <div class="chk-note chk-note--amber mt-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Vui lòng chuyển khoản trong vòng <strong>10 phút</strong>. Sân sẽ được xác nhận sau khi nhận được thanh toán.
                    </div>
                  </div>
                </transition>

                <!-- MoMo -->
                <div :class="['chk-pay-method', {active: payMethod==='momo'}]" @click="payMethod='momo'">
                  <div class="chk-pay-method__radio"><div class="chk-radio-dot" v-if="payMethod==='momo'"></div></div>
                  <div class="chk-pay-method__icon" style="background:#fdf2f8">
                    <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#ae2070"/><text x="12" y="16.5" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">MoMo</text></svg>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-bold small">Ví MoMo</div>
                    <div class="text-muted" style="font-size:11px">Thanh toán qua ứng dụng MoMo</div>
                  </div>
                  <span class="chk-pay-badge chk-pay-badge--pink">Nhanh nhất</span>
                </div>
                <transition name="slide-down">
                  <div v-if="payMethod==='momo'" class="chk-pay-detail chk-pay-detail--momo">
                    <div style="font-size:44px;line-height:1;margin-bottom:10px">📱</div>
                    <p class="text-muted small mb-3">Mở app MoMo → Quét mã → Xác nhận thanh toán</p>
                    <div class="chk-momo-amount">{{ formatPrice(bookingInfo.total) }} đ</div>
                    <p class="text-muted mt-2 mb-0" style="font-size:12px">SĐT nhận: <strong style="color:#ae2070">0901 234 567</strong></p>
                  </div>
                </transition>

                <!-- VNPAY -->
                <div :class="['chk-pay-method', {active: payMethod==='vnpay'}]" @click="payMethod='vnpay'">
                  <div class="chk-pay-method__radio"><div class="chk-radio-dot" v-if="payMethod==='vnpay'"></div></div>
                  <div class="chk-pay-method__icon" style="background:#fff7ed">
                    <svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#e03131"/><text x="12" y="15.5" text-anchor="middle" fill="white" font-size="6.5" font-weight="bold" font-family="sans-serif">VNPay</text></svg>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-bold small">VNPAY-QR</div>
                    <div class="text-muted" style="font-size:11px">Quét mã qua app ngân hàng bất kỳ</div>
                  </div>
                </div>
                <transition name="slide-down">
                  <div v-if="payMethod==='vnpay'" class="chk-pay-detail">
                    <div class="d-flex align-items-center gap-4 flex-wrap">
                      <div class="text-center flex-shrink-0">
                        <svg viewBox="0 0 160 160" width="110" height="110" xmlns="http://www.w3.org/2000/svg">
                          <rect width="160" height="160" fill="white" rx="8"/>
                          <rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="#e03131" stroke-width="6"/>
                          <rect x="20" y="20" width="24" height="24" rx="2" fill="#e03131"/>
                          <rect x="104" y="8" width="48" height="48" rx="4" fill="none" stroke="#e03131" stroke-width="6"/>
                          <rect x="116" y="20" width="24" height="24" rx="2" fill="#e03131"/>
                          <rect x="8" y="104" width="48" height="48" rx="4" fill="none" stroke="#e03131" stroke-width="6"/>
                          <rect x="20" y="116" width="24" height="24" rx="2" fill="#e03131"/>
                          <rect x="72" y="8" width="8" height="8" fill="#e03131"/><rect x="84" y="8" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="20" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="72" width="8" height="8" fill="#e03131"/><rect x="84" y="72" width="8" height="8" fill="#e03131"/>
                          <rect x="96" y="72" width="8" height="8" fill="#e03131"/><rect x="108" y="72" width="8" height="8" fill="#e03131"/>
                          <rect x="120" y="72" width="8" height="8" fill="#e03131"/><rect x="144" y="72" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="84" width="8" height="8" fill="#e03131"/><rect x="96" y="84" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="96" width="8" height="8" fill="#e03131"/><rect x="84" y="96" width="8" height="8" fill="#e03131"/>
                          <rect x="96" y="96" width="8" height="8" fill="#e03131"/><rect x="120" y="96" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="108" width="8" height="8" fill="#e03131"/><rect x="108" y="108" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="120" width="8" height="8" fill="#e03131"/><rect x="120" y="120" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="132" width="8" height="8" fill="#e03131"/><rect x="96" y="132" width="8" height="8" fill="#e03131"/>
                          <rect x="72" y="144" width="8" height="8" fill="#e03131"/><rect x="84" y="144" width="8" height="8" fill="#e03131"/>
                        </svg>
                        <div style="font-size:10px;color:#94a3b8;font-weight:600;margin-top:4px">Quét mã VNPAY-QR</div>
                      </div>
                      <div class="flex-grow-1">
                        <p class="fw-bold small mb-2">Hướng dẫn thanh toán</p>
                        <ol class="text-muted small ps-3 mb-0" style="line-height:2.1">
                          <li>Mở app ngân hàng bất kỳ hỗ trợ VNPAY</li>
                          <li>Chọn <strong>Quét mã QR</strong></li>
                          <li>Quét mã và xác nhận số tiền</li>
                          <li>Nhập mã PIN / xác thực sinh trắc học</li>
                        </ol>
                        <div class="chk-note chk-note--red mt-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          Số tiền: <strong>{{ formatPrice(bookingInfo.total) }} đ</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>

                <!-- Thẻ quốc tế -->
                <div :class="['chk-pay-method', {active: payMethod==='card'}]" @click="payMethod='card'">
                  <div class="chk-pay-method__radio"><div class="chk-radio-dot" v-if="payMethod==='card'"></div></div>
                  <div class="chk-pay-method__icon" style="background:#f5f3ff">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-bold small">Thẻ quốc tế</div>
                    <div class="d-flex align-items-center gap-2 mt-1">
                      <span class="chk-card-logo chk-card-logo--visa">VISA</span>
                      <span class="chk-card-logo chk-card-logo--mc">MC</span>
                      <span class="chk-card-logo chk-card-logo--jcb">JCB</span>
                    </div>
                  </div>
                </div>
                <transition name="slide-down">
                  <div v-if="payMethod==='card'" class="chk-pay-detail">
                    <!-- Card visual preview -->
                    <div class="chk-card-scene">
                      <div class="chk-card-flip" :class="{flipped: cardFlipped}">
                        <div class="chk-card-front">
                          <div class="chk-card-front__chip"></div>
                          <div class="chk-card-front__number">{{ formattedCardNumber }}</div>
                          <div class="chk-card-front__bottom">
                            <div>
                              <div class="chk-card-front__label">Tên chủ thẻ</div>
                              <div class="chk-card-front__holder">{{ cardForm.holder ? cardForm.holder.toUpperCase() : 'TÊN CHỦ THẺ' }}</div>
                            </div>
                            <div class="text-end">
                              <div class="chk-card-front__label">Hết hạn</div>
                              <div class="chk-card-front__exp">{{ cardForm.expiry || 'MM/YY' }}</div>
                            </div>
                          </div>
                          <div class="chk-card-front__brand">
                            <span v-if="detectedCardType" class="chk-card-front__type">{{ detectedCardType }}</span>
                            <span v-else style="font-size:11px;opacity:.5">CREDIT</span>
                          </div>
                        </div>
                        <div class="chk-card-back">
                          <div class="chk-card-back__stripe"></div>
                          <div class="chk-card-back__cvc-area">
                            <span class="chk-card-back__cvc-label">CVC</span>
                            <div class="chk-card-back__cvc-box">{{ cardForm.cvc ? '•'.repeat(cardForm.cvc.length) : '•••' }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- Card inputs -->
                    <div class="chk-card-form mt-4">
                      <div class="mb-3">
                        <label class="chk-label">Số thẻ <span class="text-danger">*</span></label>
                        <div class="chk-input-icon-wrap">
                          <svg class="chk-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                          <input v-model="cardForm.number" type="text" class="chk-input chk-input--pl" placeholder="0000 0000 0000 0000" maxlength="19" @input="formatCardNumber" @focus="cardFlipped=false"/>
                          <span v-if="detectedCardType" class="chk-detected-type">{{ detectedCardType }}</span>
                        </div>
                      </div>
                      <div class="row g-3 mb-3">
                        <div class="col-5">
                          <label class="chk-label">Ngày hết hạn <span class="text-danger">*</span></label>
                          <input v-model="cardForm.expiry" type="text" class="chk-input" placeholder="MM/YY" maxlength="5" @input="formatExpiry" @focus="cardFlipped=false"/>
                        </div>
                        <div class="col-4">
                          <label class="chk-label">CVC <span class="text-danger">*</span></label>
                          <div class="chk-input-icon-wrap">
                            <input v-model="cardForm.cvc" type="password" class="chk-input chk-input--pr" placeholder="•••" maxlength="4" @input="cardForm.cvc=cardForm.cvc.replace(/\D/g,'')" @focus="cardFlipped=true" @blur="cardFlipped=false"/>
                            <svg class="chk-input-icon chk-input-icon--right" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label class="chk-label">Tên chủ sở hữu thẻ <span class="text-danger">*</span></label>
                        <input v-model="cardForm.holder" type="text" class="chk-input" placeholder="NGUYEN VAN A" @focus="cardFlipped=false" style="text-transform:uppercase"/>
                        <p class="text-muted mt-1 mb-0" style="font-size:11px">Nhập đúng tên in trên thẻ, không dấu</p>
                      </div>
                    </div>
                  </div>
                </transition>

                <!-- Tiền mặt -->
                <div :class="['chk-pay-method', {active: payMethod==='cash'}]" @click="payMethod='cash'">
                  <div class="chk-pay-method__radio"><div class="chk-radio-dot" v-if="payMethod==='cash'"></div></div>
                  <div class="chk-pay-method__icon" style="background:#f0fdf4">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 10h2M20 10h2M2 14h2M20 14h2"/></svg>
                  </div>
                  <div class="flex-grow-1">
                    <div class="fw-bold small">Thanh toán tiền mặt tại sân</div>
                    <div class="text-muted" style="font-size:11px">Thanh toán khi đến sân</div>
                  </div>
                  <span class="chk-pay-badge chk-pay-badge--gray">Đơn giản</span>
                </div>
                <transition name="slide-down">
                  <div v-if="payMethod==='cash'" class="chk-pay-detail chk-pay-detail--cash">
                    <div class="d-flex align-items-start gap-3">
                      <div style="font-size:34px;flex-shrink:0">💵</div>
                      <div>
                        <p class="fw-bold small mb-1">Hướng dẫn thanh toán tiền mặt</p>
                        <ul class="text-muted small mb-0 ps-3" style="line-height:2.1">
                          <li>Sân sẽ giữ lịch trong <strong>10 phút</strong></li>
                          <li>Đến sân và báo mã đặt sân cho nhân viên</li>
                          <li>Thanh toán đủ số tiền: <strong class="text-success">{{ formatPrice(bookingInfo.total) }} đ</strong></li>
                          <li>Nhận biên nhận và vào sân thi đấu</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </transition>

              </div>
            </div>
          </div>

          <!-- ĐỒNG Ý -->
          <div class="chk-card mb-4">
            <div class="chk-card__body">
              <label class="chk-checkbox-wrap" @click="agreed=!agreed">
                <div :class="['chk-checkbox', {checked: agreed}]">
                  <svg v-if="agreed" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span class="small text-muted">Tôi đồng ý với <a href="#" class="text-success fw-bold text-decoration-none">Điều khoản dịch vụ</a> và <a href="#" class="text-success fw-bold text-decoration-none">Chính sách hoàn tiền</a> của sân bóng.</span>
              </label>
            </div>
          </div>

        </div>

        <!-- RIGHT: Summary sidebar -->
        <div class="col-lg-5">
          <div class="sticky-top" style="top:20px">

            <div class="chk-card mb-3">
              <div class="chk-card__header">
                <div class="chk-card__icon chk-card__icon--amber">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span>Chi tiết đơn hàng</span>
              </div>
              <div class="chk-card__body">
                <!-- Breakdown từng sân -->
                <template v-for="court in bookingInfo.courts" :key="court.id">
                  <div v-if="slotsByCourt(court.id).length">
                    <div class="chk-sum-court-label">{{ court.name }}</div>
                    <div class="chk-sum-row">
                      <span>{{ slotsByCourt(court.id).length }} khung giờ</span>
                      <span>{{ formatPrice(courtSubtotal(court.id)) }} đ</span>
                    </div>
                  </div>
                </template>

                <div v-if="serviceTotal > 0" class="chk-sum-row mt-1">
                  <span>Dịch vụ thêm ({{ parsedServices.length }})</span>
                  <span>{{ formatPrice(serviceTotal) }} đ</span>
                </div>
                <div class="chk-duration-badge mt-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Thời lượng: <strong>{{ totalDuration }}</strong>
                </div>
                <div class="chk-divider mt-2"></div>
                <div class="chk-sum-row chk-sum-row--total">
                  <span>Tổng thanh toán</span>
                  <span class="text-success">{{ formatPrice(bookingInfo.total) }} đ</span>
                </div>
              </div>
            </div>

            <!-- Timer 10 phút -->
            <div class="chk-timer mb-3" :class="{'chk-timer--urgent': timerSeconds < 120}">
              <div class="chk-timer__icon">⏱</div>
              <div class="flex-grow-1">
                <div class="chk-timer__label">Thời gian giữ sân</div>
                <div class="chk-timer__time">{{ timerDisplay }}</div>
                <div class="chk-timer__sub" :class="timerSeconds < 120 ? 'text-danger' : 'text-muted'">
                  {{ timerSeconds < 120 ? 'Sắp hết hạn!' : 'Hoàn thành trước khi hết giờ' }}
                </div>
              </div>
              <div class="chk-timer__ring">
                <svg viewBox="0 0 36 36" width="48" height="48">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" stroke-width="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    :stroke="timerSeconds < 120 ? '#ef4444' : timerSeconds < 300 ? '#f59e0b' : '#22c55e'"
                    stroke-width="3" stroke-dasharray="100"
                    :stroke-dashoffset="100 - timerPercent"
                    stroke-linecap="round" transform="rotate(-90 18 18)"
                    style="transition:stroke-dashoffset 1s linear,stroke .5s"/>
                </svg>
              </div>
            </div>

            <!-- Error Banner -->
            <div v-if="errorMessage" class="alert alert-danger mb-3 p-2 text-center" style="font-size: 13px; font-weight: 600; border-radius: 8px; color: #b91c1c; background-color: #fef2f2; border: 1px solid #f87171;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="me-1" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ errorMessage }}
            </div>

            <button
              class="chk-cta-btn"
              :class="{'chk-cta-btn--disabled': !canSubmit, 'chk-cta-btn--loading': isProcessing}"
              :disabled="!canSubmit || isProcessing"
              @click="handleCheckout"
            >
              <span v-if="!isProcessing" class="d-flex align-items-center justify-content-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Xác nhận & Thanh toán
              </span>
              <span v-else class="d-flex align-items-center justify-content-center gap-2">
                <span class="chk-spinner"></span>
                Đang xử lý...
              </span>
            </button>
            <p v-if="!agreed" class="text-center text-muted mt-2 mb-0" style="font-size:11px">Vui lòng đồng ý với điều khoản dịch vụ</p>
            <p v-if="payMethod==='card' && !isCardValid" class="text-center text-muted mt-2 mb-0" style="font-size:11px">Vui lòng điền đầy đủ thông tin thẻ</p>
            <p class="text-center text-muted mt-2 mb-0" style="font-size:11px">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Thanh toán được mã hoá SSL 256-bit
            </p>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { bookingService } from '@/services/booking.service.js';

export default {
  name: 'CheckoutView',

  data() {
    return {
      payMethod: 'bank',
      agreed: false,
      isProcessing: false,
      bookingSuccess: false,
      bookingCode: '',
      copiedField: '',
      cardFlipped: false,
      cardForm: { number: '', expiry: '', cvc: '', holder: '' },
      timerSeconds: 600,
      timerInterval: null,
      errorMessage: '',
      bookingInfo: {
        club_id: '',
        club_slug: '',
        venue_name: '',
        courts: [],
        date: new Date().toISOString().split('T')[0],
        slots: '[]',
        time_slot_ids: '[]',
        services: '[]',
        total: 0,
        name: '',
        phone: '',
        email: '',
        note: '',
        voucher_code: '',
      },
    };
  },

  computed: {
    parsedSlots() {
      try { return JSON.parse(this.bookingInfo.slots); } catch { return []; }
    },

    parsedServices() {
      try {
        return JSON.parse(this.bookingInfo.services);
      } catch { return []; }
    },

    // ── FIX: tên tất cả sân gộp lại ──
    courtNamesSummary() {
      if (!this.bookingInfo.courts.length) return '—';
      return this.bookingInfo.courts.map(c => c.name).join(', ');
    },

    formattedDate() {
      if (!this.bookingInfo.date) return '';
      const [y, m, d] = this.bookingInfo.date.split('-');
      return `${d}/${m}/${y}`;
    },

    // ── FIX: slotsSummary group theo từng sân ──
    slotsSummary() {
      if (!this.parsedSlots.length) return '—';
      const byCourtMap = {};
      this.parsedSlots.forEach(s => {
        const key = s.courtName || s.courtId || 'Sân';
        if (!byCourtMap[key]) byCourtMap[key] = [];
        byCourtMap[key].push(s);
      });
      return Object.entries(byCourtMap).map(([courtName, slots]) => {
        const sorted = [...slots].sort((a, b) =>
          this.parseHour(a.time.split(' – ')[0]) - this.parseHour(b.time.split(' – ')[0])
        );
        const start = sorted[0].time.split(' – ')[0];
        const end   = sorted[sorted.length - 1].time.split(' – ')[1];
        return `${courtName}: ${start}–${end}`;
      }).join(' | ');
    },

    courtTotal()   { return this.parsedSlots.reduce((s, sl) => s + sl.price, 0); },
    serviceTotal() { return this.parsedServices.reduce((s, svc) => s + svc.price, 0); },

    totalDuration() {
      const mins = this.parsedSlots.length * 30;
      return mins >= 60
        ? `${Math.floor(mins / 60)} tiếng${mins % 60 ? ' ' + mins % 60 + 'p' : ''}`
        : `${mins} phút`;
    },

    transferContent() {
      return `DATSANH ${(this.bookingInfo.phone || '').replace(/\s/g, '') || 'SOPHONE'}`;
    },

    timerDisplay() {
      return `${String(Math.floor(this.timerSeconds / 60)).padStart(2, '0')}:${String(this.timerSeconds % 60).padStart(2, '0')}`;
    },
    timerPercent() { return Math.round((this.timerSeconds / 600) * 100); },

    formattedCardNumber() {
      if (!this.cardForm.number) return '•••• •••• •••• ••••';
      return this.cardForm.number.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
    },

    detectedCardType() {
      const n = this.cardForm.number.replace(/\s/g, '');
      if (/^4/.test(n))      return 'VISA';
      if (/^5[1-5]/.test(n)) return 'MC';
      if (/^3[47]/.test(n))  return 'AMEX';
      if (/^35/.test(n))     return 'JCB';
      return '';
    },

    isCardValid() {
      return this.cardForm.number.replace(/\s/g, '').length >= 16
        && this.cardForm.expiry.length === 5
        && this.cardForm.cvc.length >= 3
        && this.cardForm.holder.trim().length > 0;
    },

    canSubmit() {
      if (!this.agreed) return false;
      if (this.payMethod === 'card') return this.isCardValid;
      return true;
    },
  },

  created() {
    this.checkAuth();
    
    // Nếu phát hiện URL có mang cờ success (do reload trang ấn F5 sau khi mua)
    const q = this.$route.query;
    if (q.success === '1') {
      const target = q.club_slug ? `/clubs/${q.club_slug}` : '/';
      this.$router.replace(target);
      return;
    }

    // Freeze data từ query vào state cục bộ để ko phụ thuộc quá trình xóa tham số URL
    this.bookingInfo = {
      club_id: q.club_id || '',
      club_slug: q.club_slug || '',
      venue_name: q.venue_name || '',
      courts: (() => { try { return JSON.parse(q.courts || '[]'); } catch { return []; } })(),
      date: q.date || new Date().toISOString().split('T')[0],
      slots: q.slots || '[]',
      time_slot_ids: q.time_slot_ids || '[]',
      services: q.services || '[]',
      total: Number(q.total) || 0,
      name: q.name || '',
      phone: q.phone || '',
      email: q.email || '',
      note: q.note || '',
      voucher_code: q.voucher_code || '',
    };

    this.bookingCode = 'TP' + Date.now().toString(36).toUpperCase().slice(-6);
    this.startTimer();
  },
  beforeUnmount() { clearInterval(this.timerInterval); },

  methods: {
    checkAuth() {
      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to login if not logged in
        this.$router.push(`/auth/login?redirect=${encodeURIComponent(this.$route.fullPath)}`);
      }
    },

    formatPrice(v) { return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v); },
    parseHour(t)   { const [h, m] = t.split(':').map(Number); return h + m / 60; },

    // ── FIX: lọc slots theo courtId ──
    slotsByCourt(courtId) {
      return this.parsedSlots.filter(s => s.courtId === courtId);
    },

    // ── FIX: subtotal từng sân ──
    courtSubtotal(courtId) {
      return this.slotsByCourt(courtId).reduce((s, sl) => s + sl.price, 0);
    },

    copyText(text, field) {
      navigator.clipboard?.writeText(text).catch(() => {});
      this.copiedField = field;
      setTimeout(() => { this.copiedField = ''; }, 2000);
    },

    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.timerSeconds > 0) this.timerSeconds--;
        else clearInterval(this.timerInterval);
      }, 1000);
    },

    formatCardNumber(e) {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      this.cardForm.number = v.replace(/(.{4})/g, '$1 ').trim();
    },

    formatExpiry(e) {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      this.cardForm.expiry = v;
    },

    async handleCheckout() {
      this.isProcessing = true;
      this.errorMessage = '';
      
      try {
        // Map UI method -> API Method enum
        const paymentMap = {
          'bank': 'BANK_TRANSFER',
          'momo': 'MOMO',
          'vnpay': 'VNPAY',
          'card': 'CREDIT_CARD',
          'cash': 'CASH',
        };

        const payload = {
          clubId: this.bookingInfo.club_id,
          timeSlotIds: JSON.parse(this.bookingInfo.time_slot_ids),
          bookerName: this.bookingInfo.name,
          bookerPhone: this.bookingInfo.phone,
          bookerEmail: this.bookingInfo.email || undefined,
          note: this.bookingInfo.note || undefined,
          voucherCode: this.bookingInfo.voucher_code || undefined,
          paymentMethod: paymentMap[this.payMethod] || 'VNPAY'
        };

        const res = await bookingService.createBooking(payload);
        
        if (res && res.data) {
          this.bookingCode = res.data.booking.bookingCode;
          
          // Redirect to payment gateway if applicable
          if (res.data.paymentUrl) {
            window.location.href = res.data.paymentUrl;
          } else {
            // Khóa timer và đổi trạng thái
            this.bookingSuccess = true;
            clearInterval(this.timerInterval);
            
            // Cập nhật lại thanh địa chỉ URL để xóa toàn bộ rác (slots, courts...)
            // Mục đích: Nếu khách F5, tham số success=1 sẽ sút họ về sân.
            this.$router.replace({ 
              path: '/checkout', 
              query: { 
                success: '1', 
                code: this.bookingCode,
                club_slug: this.bookingInfo.club_slug
              } 
            });
          }
        }
      } catch (err) {
        console.error("Checkout error:", err);
        this.errorMessage = err.response?.data?.message || err.message || "Đã xảy ra lỗi khi tạo đơn đặt sân. Vui lòng thử lại.";
      } finally {
        this.isProcessing = false;
      }
    },

    printConfirmation() { window.print(); },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&display=swap');

.checkout-page { font-family:'Lexend',sans-serif; background:#f8fafc; min-height:100vh; }

/* HEADER */
.chk-header { background:#fff; border-bottom:1px solid #e2e8f0; padding:16px 0 20px; position:sticky; top:0; z-index:100; box-shadow:0 2px 8px rgba(0,0,0,.04); }
.chk-back-btn { background:#f1f5f9; border:none; border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s; color:#374151; }
.chk-back-btn:hover { background:#e2e8f0; }

/* Progress */
.chk-progress { display:flex; align-items:center; max-width:320px; }
.chk-step { display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600; color:#94a3b8; }
.chk-step__circle { width:28px; height:28px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; color:#94a3b8; }
.chk-step--done .chk-step__circle { background:#22c55e; color:#fff; }
.chk-step--active .chk-step__circle { background:#16a34a; color:#fff; box-shadow:0 0 0 4px #bbf7d0; }
.chk-step--active { color:#0f172a; }
.chk-step__line { flex:1; height:2px; background:#e2e8f0; min-width:40px; margin:0 8px; }
.chk-step__line--done { background:#22c55e; }

.chk-main { padding:28px 12px 60px; }

/* CARDS */
.chk-card { background:#fff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; transition:box-shadow .2s; }
.chk-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.06); }
.chk-card__header { display:flex; align-items:center; gap:10px; padding:16px 20px; border-bottom:1px solid #f1f5f9; font-size:13.5px; font-weight:800; color:#0f172a; letter-spacing:-.2px; }
.chk-card__icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.chk-card__icon--green  { background:#dcfce7; color:#16a34a; }
.chk-card__icon--blue   { background:#dbeafe; color:#2563eb; }
.chk-card__icon--purple { background:#f3e8ff; color:#9333ea; }
.chk-card__icon--amber  { background:#fef3c7; color:#d97706; }
.chk-card__body { padding:20px; }

/* Read-only */
.chk-readonly-badge { display:inline-flex; align-items:center; gap:5px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:20px; padding:3px 10px; font-size:10px; font-weight:600; color:#94a3b8; }
.chk-readonly-field { display:flex; align-items:center; gap:9px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 13px; font-size:13px; font-weight:600; color:#0f172a; min-height:42px; }

/* Booking banner */
.chk-booking-banner { background:linear-gradient(135deg,#0f172a,#1e3a5f); border-radius:12px; padding:18px 20px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.chk-booking-banner__venue { color:#fff; font-weight:800; font-size:15px; margin-bottom:6px; }
.chk-booking-banner__court { color:#86efac; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:4px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); border-radius:20px; padding:3px 10px; }
.chk-booking-banner__meta { display:flex; flex-wrap:wrap; gap:12px; margin-top:4px; }
.chk-booking-banner__meta span { color:#7dd3fc; font-size:12px; font-weight:600; display:flex; align-items:center; gap:4px; }
.chk-booking-banner__badge { font-size:48px; line-height:1; flex-shrink:0; opacity:.5; }

/* Court label in slots */
.chk-court-label { display:inline-flex; align-items:center; gap:5px; background:#dcfce7; color:#15803d; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:700; }

/* Slots list */
.chk-slots-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; margin-bottom:8px; }
.chk-slots-list { background:#f8fafc; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; margin-bottom:4px; }
.chk-slot-row { display:flex; justify-content:space-between; align-items:center; padding:9px 14px; border-bottom:1px solid #e2e8f0; font-size:12.5px; }
.chk-slot-row:last-child { border-bottom:none; }
.chk-slot-row__time  { font-weight:600; color:#374151; }
.chk-slot-row__price { font-weight:800; color:#16a34a; }
.chk-slot-row--subtotal { background:#f0fdf4; }
.chk-slot-row--subtotal .chk-slot-row__time { color:#94a3b8; }

/* Summary court label */
.chk-sum-court-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#16a34a; margin:8px 0 2px; padding-left:2px; }

/* Form inputs */
.chk-label { display:block; font-size:12px; font-weight:700; color:#374151; margin-bottom:5px; }
.chk-input { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:9px 13px; font-size:13px; font-family:'Lexend',sans-serif; font-weight:500; color:#0f172a; background:#f8fafc; transition:border-color .2s,box-shadow .2s; outline:none; }
.chk-input:focus { border-color:#22c55e; background:#fff; box-shadow:0 0 0 3px #dcfce7; }

/* Pay methods */
.chk-pay-methods { display:flex; flex-direction:column; gap:8px; }
.chk-pay-method { display:flex; align-items:center; gap:12px; padding:13px 15px; border-radius:12px; border:2px solid #e2e8f0; cursor:pointer; transition:all .2s; background:#fff; }
.chk-pay-method:hover { border-color:#86efac; background:#f0fdf4; }
.chk-pay-method.active { border-color:#22c55e; background:#f0fdf4; box-shadow:0 0 0 3px #dcfce7; }
.chk-pay-method__radio { width:18px; height:18px; border-radius:50%; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:border-color .2s; }
.chk-pay-method.active .chk-pay-method__radio { border-color:#22c55e; }
.chk-radio-dot { width:9px; height:9px; border-radius:50%; background:#22c55e; }
.chk-pay-method__icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.chk-pay-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; flex-shrink:0; }
.chk-pay-badge--blue { background:#dbeafe; color:#1d4ed8; }
.chk-pay-badge--pink { background:#fce7f3; color:#be185d; }
.chk-pay-badge--gray { background:#f1f5f9; color:#64748b; }

/* Card type logos */
.chk-card-logo { padding:1px 5px; border-radius:4px; font-size:9px; font-weight:800; letter-spacing:.4px; }
.chk-card-logo--visa { background:#1a1f71; color:#fff; }
.chk-card-logo--mc   { background:#eb001b; color:#fff; }
.chk-card-logo--jcb  { background:#003087; color:#fff; }

/* Pay detail panels */
.chk-pay-detail { background:#f8fafc; border-radius:12px; padding:20px; margin-top:4px; border:1px solid #e2e8f0; }
.chk-pay-detail--momo { background:#fdf2f8; border-color:#fbcfe8; text-align:center; }
.chk-pay-detail--cash { background:#f0fdf4; border-color:#bbf7d0; }

/* Bank info */
.chk-bank-qr-wrap { display:flex; gap:20px; flex-wrap:wrap; align-items:flex-start; }
.chk-bank-qr { text-align:center; flex-shrink:0; }
.chk-bank-qr__label { font-size:10px; color:#94a3b8; font-weight:600; margin-top:6px; }
.chk-bank-info { flex:1; min-width:180px; }
.chk-bank-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0; gap:8px; flex-wrap:wrap; }
.chk-bank-row:last-child { border-bottom:none; }
.chk-bank-row__label { font-size:11px; color:#94a3b8; font-weight:600; flex-shrink:0; }
.chk-bank-row__value { font-size:13px; color:#0f172a; text-align:right; }
.chk-bank-row--highlight { background:#f0fdf4; border-radius:8px; padding:8px 10px; margin:4px 0; border:none; }
.chk-copy-btn { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:6px; padding:3px 6px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; color:#64748b; flex-shrink:0; }
.chk-copy-btn:hover { background:#e2e8f0; }
.chk-copy-btn.copied { background:#dcfce7; border-color:#86efac; color:#16a34a; }
.chk-momo-amount { font-size:28px; font-weight:900; color:#ae2070; letter-spacing:-.5px; }

/* Notes */
.chk-note { display:flex; align-items:flex-start; gap:8px; border-radius:10px; padding:10px 14px; font-size:12px; line-height:1.6; }
.chk-note--amber { background:#fffbeb; border:1px solid #fde68a; color:#92400e; }
.chk-note--red   { background:#fff5f5; border:1px solid #fca5a5; color:#991b1b; }

/* Card visual */
.chk-card-scene { width:100%; max-width:340px; height:200px; perspective:1000px; margin:0 auto; }
.chk-card-flip { width:100%; height:100%; position:relative; transform-style:preserve-3d; transition:transform .6s cubic-bezier(.4,0,.2,1); }
.chk-card-flip.flipped { transform:rotateY(180deg); }
.chk-card-front, .chk-card-back { position:absolute; inset:0; border-radius:18px; backface-visibility:hidden; -webkit-backface-visibility:hidden; }
.chk-card-front { background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#7c3aed 100%); box-shadow:0 12px 40px rgba(37,99,235,.4); padding:22px 24px; display:flex; flex-direction:column; justify-content:space-between; }
.chk-card-front__chip { width:38px; height:28px; border-radius:6px; background:linear-gradient(135deg,#fbbf24,#f59e0b); }
.chk-card-front__number { font-family:'Courier New',monospace; font-size:18px; font-weight:700; color:#fff; letter-spacing:3px; word-spacing:8px; text-shadow:0 1px 3px rgba(0,0,0,.3); }
.chk-card-front__bottom { display:flex; justify-content:space-between; align-items:flex-end; }
.chk-card-front__label  { font-size:9px; font-weight:700; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
.chk-card-front__holder { font-size:13px; font-weight:700; color:#fff; letter-spacing:1px; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.chk-card-front__exp    { font-size:14px; font-weight:700; color:#fff; }
.chk-card-front__brand  { position:absolute; top:20px; right:20px; }
.chk-card-front__type   { font-size:13px; font-weight:900; color:#fff; letter-spacing:1px; text-shadow:0 1px 4px rgba(0,0,0,.4); }
.chk-card-back  { background:linear-gradient(135deg,#374151,#1f2937); transform:rotateY(180deg); overflow:hidden; }
.chk-card-back__stripe { height:44px; background:#111; margin-top:32px; }
.chk-card-back__cvc-area { display:flex; align-items:center; justify-content:flex-end; gap:12px; padding:16px 24px 0; }
.chk-card-back__cvc-label { font-size:11px; font-weight:700; color:rgba(255,255,255,.6); }
.chk-card-back__cvc-box { background:#fff; border-radius:6px; padding:6px 16px; font-family:'Courier New',monospace; font-size:16px; font-weight:700; color:#0f172a; letter-spacing:4px; min-width:70px; text-align:center; }

/* Card form */
.chk-input-icon-wrap { position:relative; display:flex; align-items:center; }
.chk-input-icon { position:absolute; left:12px; pointer-events:none; z-index:1; }
.chk-input-icon--right { left:auto; right:12px; }
.chk-input--pl { padding-left:36px; }
.chk-input--pr { padding-right:36px; }
.chk-detected-type { position:absolute; right:10px; font-size:10px; font-weight:800; background:#f0fdf4; border:1px solid #86efac; border-radius:4px; padding:1px 6px; color:#16a34a; letter-spacing:.4px; }

/* Checkbox */
.chk-checkbox-wrap { display:flex; align-items:flex-start; gap:10px; cursor:pointer; }
.chk-checkbox { width:18px; height:18px; border-radius:5px; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; margin-top:1px; }
.chk-checkbox.checked { background:#22c55e; border-color:#22c55e; }

/* Summary */
.chk-sum-row { display:flex; justify-content:space-between; align-items:center; padding:4px 0; font-size:13px; color:#64748b; font-weight:500; }
.chk-sum-row span:last-child { font-weight:700; color:#0f172a; }
.chk-sum-row--total { padding:10px 0 0; font-size:16px; font-weight:900 !important; }
.chk-sum-row--total span { color:#0f172a !important; }
.chk-sum-row--total span:last-child { font-size:20px; }
.chk-divider { height:1px; background:#e2e8f0; margin:8px 0; }
.chk-duration-badge { display:inline-flex; align-items:center; gap:5px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:20px; padding:4px 12px; font-size:12px; color:#16a34a; font-weight:600; }

/* Timer */
.chk-timer { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:12px; transition:all .3s; }
.chk-timer--urgent { background:#fff5f5; border-color:#fca5a5; animation:pulse-red 1.5s ease-in-out infinite; }
@keyframes pulse-red { 0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,.2); } 50% { box-shadow:0 0 0 6px rgba(239,68,68,.0); } }
.chk-timer__icon  { font-size:22px; }
.chk-timer__label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#94a3b8; }
.chk-timer__time  { font-size:22px; font-weight:900; color:#0f172a; letter-spacing:1px; line-height:1.1; }
.chk-timer--urgent .chk-timer__time { color:#ef4444; }
.chk-timer__sub   { font-size:10px; font-weight:600; margin-top:1px; }

/* CTA */
.chk-cta-btn { width:100%; background:linear-gradient(135deg,#16a34a,#22c55e); color:#fff; border:none; border-radius:14px; padding:16px; font-size:15px; font-weight:800; font-family:'Lexend',sans-serif; cursor:pointer; transition:all .2s; letter-spacing:-.2px; box-shadow:0 4px 20px rgba(34,197,94,.35); }
.chk-cta-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 24px rgba(34,197,94,.45); }
.chk-cta-btn:active:not(:disabled) { transform:translateY(0); }
.chk-cta-btn--disabled { background:linear-gradient(135deg,#94a3b8,#cbd5e1); box-shadow:none; cursor:not-allowed; }
.chk-cta-btn--loading  { opacity:.8; cursor:wait; }
.chk-spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Success */
.chk-success { display:flex; justify-content:center; align-items:flex-start; padding:40px 0; }
.chk-success__card { background:#fff; border-radius:24px; border:1px solid #e2e8f0; padding:40px 36px; max-width:460px; width:100%; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,.08); }
.chk-success__anim { position:relative; width:90px; height:90px; margin:0 auto; }
.chk-success__ring { position:absolute; inset:0; border-radius:50%; border:3px solid #22c55e; animation:expand-ring .8s ease-out forwards; opacity:0; }
@keyframes expand-ring { 0% { transform:scale(.6); opacity:1; } 100% { transform:scale(1.3); opacity:0; } }
.chk-success__icon { width:90px; height:90px; border-radius:50%; background:linear-gradient(135deg,#16a34a,#22c55e); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 30px rgba(34,197,94,.4); animation:pop-in .4s cubic-bezier(.34,1.56,.64,1) forwards; }
@keyframes pop-in { 0% { transform:scale(0); } 100% { transform:scale(1); } }
.chk-success__code { background:#f0fdf4; border:1.5px dashed #86efac; border-radius:12px; padding:14px 20px; display:flex; flex-direction:column; gap:2px; align-items:center; }
.chk-success__summary { width:100%; }

/* Transitions */
.slide-down-enter-active,.slide-down-leave-active { transition:all .3s ease; overflow:hidden; }
.slide-down-enter-from,.slide-down-leave-to { max-height:0; opacity:0; transform:translateY(-8px); }
.slide-down-enter-to,.slide-down-leave-from { max-height:700px; opacity:1; transform:translateY(0); }
.fade-enter-active,.fade-leave-active { transition:opacity .4s; }
.fade-enter-from,.fade-leave-to { opacity:0; }
</style>