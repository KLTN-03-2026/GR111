<template>
  <div class="vdp">

    <!-- HERO -->
    <section class="vdp-hero" :style="{ backgroundImage:`url(${venue.image})` }">
      <div class="vdp-hero__overlay"></div>
      <div class="container position-relative z-2 pb-5">
        <span class="badge bg-success rounded-pill mb-2">⚽ Bóng đá</span>
        <h1 class="fw-black text-white fs-2 mb-2">{{ venue.name }}</h1>
        <p class="text-white opacity-75 d-flex align-items-center gap-2 mb-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ venue.address }}
        </p>
        <div class="d-inline-flex gap-4 px-4 py-2 rounded-3 border border-white border-opacity-25" style="background:rgba(255,255,255,.13);backdrop-filter:blur(8px)">
          <div v-for="(s,i) in [{v:venue.courts.length,l:'Sân'},{v:'5.0 ★',l:'Đánh giá'},{v:'05:00',l:'Mở cửa'}]" :key="i" class="d-flex align-items-center gap-3">
            <div v-if="i" class="vdp-sep"></div>
            <div class="text-center text-white">
              <div class="fw-bold fs-5">{{ s.v }}</div>
              <div class="small opacity-75">{{ s.l }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MAIN -->
    <div class="container vdp-main">

      <!-- TABS -->
      <ul class="nav vdp-tabs mb-0">
        <li v-for="t in tabs" :key="t.id" class="nav-item">
          <button :class="['nav-link vdp-tab', {active: activeTab===t.id}]" @click="activeTab=t.id">
            <span v-html="t.icon"></span>{{ t.label }}
          </button>
        </li>
      </ul>

      <!-- BOOKING TAB -->
      <div v-if="activeTab==='booking'" class="row g-4 bg-white rounded-0 rounded-bottom-3 shadow-sm p-4">
        <div class="col-lg-8">

          <!-- ═══ Step 1: Chọn sân (MULTI-SELECT) ═══ -->
          <div class="vdp-step border-bottom pb-4 mb-4">
            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="vdp-snum">1</div>
              <div>
                <div class="fw-bold fs-6 text-dark">Chọn sân</div>
                <div class="text-muted small">Có thể chọn nhiều sân để đặt cùng lúc</div>
              </div>
              <!-- Badge tổng số sân đang chọn -->
              <div v-if="selectedCourtIds.length" class="ms-auto">
                <span class="badge bg-success rounded-pill">{{ selectedCourtIds.length }} sân đã chọn</span>
              </div>
            </div>
            <div class="d-flex flex-wrap gap-3">
              <div v-for="c in venue.courts" :key="c.id"
                :class="['vdp-court-card d-flex align-items-center gap-3 p-3 rounded-3 border-2 border', isCourtSelected(c.id) ? 'border-success bg-success-subtle' : 'border-light-subtle']"
                @click="toggleCourt(c.id)" style="min-width:175px;cursor:pointer">
                <div :class="['p-2 rounded-2', isCourtSelected(c.id) ? 'bg-success text-white' : 'bg-success-subtle text-success']">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                </div>
                <div class="flex-grow-1">
                  <div class="fw-bold small">{{ c.name }}</div>
                  <div class="text-muted" style="font-size:12px">{{ formatPrice(c.basePrice) }} đ/30 phút</div>
                </div>
                <!-- Checkbox style indicator -->
                <div :class="['rounded-circle border-2 border d-flex align-items-center justify-content-center flex-shrink-0', isCourtSelected(c.id) ? 'bg-success border-success text-white' : 'border-secondary bg-white']" style="width:22px;height:22px;">
                  <svg v-if="isCourtSelected(c.id)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ Step 2: Chọn ngày ═══ -->
          <div class="vdp-step border-bottom pb-4 mb-4">
            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="vdp-snum">2</div>
              <div><div class="fw-bold fs-6 text-dark">Chọn ngày</div><div class="text-muted small">Tất cả sân đã chọn sẽ đặt cùng ngày này</div></div>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <div v-for="(d,i) in nextSevenDays" :key="d.full"
                :class="['vdp-date-card d-flex flex-column align-items-center border-2 rounded-3 border', dateOffset===i ? 'bg-success text-white border-success shadow-sm' : 'border-light-subtle bg-white']"
                style="min-width:70px;padding:10px 14px;cursor:pointer"
                @click="dateOffset=i; clearAllSlots()">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;opacity:.7">{{ d.dayName }}</span>
                <span style="font-size:22px;font-weight:900;line-height:1.1">{{ d.dayNumber }}</span>
                <span style="font-size:11px;font-weight:600;opacity:.7">Th.{{ d.month }}</span>
              </div>
            </div>
          </div>

          <!-- ═══ Step 3: Chọn khung giờ ═══ -->
          <div class="vdp-step border-bottom pb-4 mb-4">
            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="vdp-snum">3</div>
              <div class="flex-grow-1"><div class="fw-bold fs-6 text-dark">Chọn khung giờ</div><div class="text-muted small">Chọn khung giờ cho từng sân đã chọn</div></div>
              <div class="btn-group btn-group-sm" role="group">
                <button :class="['btn', slotView==='grid' ? 'btn-success' : 'btn-outline-secondary']" @click="slotView='grid'">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Lưới
                </button>
                <button :class="['btn', slotView==='timeline' ? 'btn-success' : 'btn-outline-secondary']" @click="slotView='timeline'">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> Timeline
                </button>
              </div>
            </div>

            <!-- Không có sân nào được chọn -->
            <div v-if="selectedCourtIds.length === 0" class="text-center py-4 rounded-3" style="background:#f8fafc;border:2px dashed #e2e8f0">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" class="d-block mx-auto mb-2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
              <p class="text-muted small mb-0">Vui lòng chọn sân ở bước 1 trước</p>
            </div>

            <template v-else>
              <!-- Legend -->
              <div class="d-flex gap-3 mb-3">
                <span class="d-flex align-items-center gap-1 text-muted small"><span class="vdp-lgd" style="background:#fff;border:1.5px solid #d1d5db"></span>Còn trống</span>
                <span class="d-flex align-items-center gap-1 text-muted small"><span class="vdp-lgd bg-success"></span>Đang chọn</span>
                <span class="d-flex align-items-center gap-1 text-muted small"><span class="vdp-lgd" style="background:#fca5a5"></span>Đã đặt</span>
                <span class="d-flex align-items-center gap-1 text-muted small"><span class="vdp-lgd" style="background:#e2e8f0"></span>Không hoạt động</span>
              </div>

              <!-- ── GRID VIEW ── -->
              <div v-if="slotView==='grid'">
                <!-- Tab switcher cho từng sân đã chọn -->
                <div class="d-flex gap-2 mb-3 flex-wrap">
                  <button v-for="cid in selectedCourtIds" :key="cid"
                    :class="['btn btn-sm d-flex align-items-center gap-2', activeEditCourtId===cid ? 'btn-success' : 'btn-outline-success']"
                    @click="activeEditCourtId=cid">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                    {{ getCourtName(cid) }}
                    <!-- Badge số slot đã chọn cho sân này -->
                    <span v-if="(selectedSlotsByCourtId[cid]||[]).length" class="badge rounded-pill ms-1" :class="activeEditCourtId===cid ? 'bg-white text-success' : 'bg-success text-white'" style="font-size:10px">
                      {{ (selectedSlotsByCourtId[cid]||[]).length }}
                    </span>
                  </button>
                </div>

                <!-- Grid slots cho sân đang active -->
                <div class="row g-2">
                  <div v-for="slot in gridSlotsForActiveCourt" :key="slot.id" class="col-6 col-md-4 col-lg-3">
                    <div :class="['vdp-slot-card rounded-3 p-3 h-100',
                      isSlotSelected(activeEditCourtId, slot) ? 'bg-success text-white border-success' :
                      slot.status==='BOOKED' ? 'vdp-slot--booked' : 'bg-white border']"
                      style="border-width:2px!important;cursor:pointer"
                      @click="toggleSlot(activeEditCourtId, slot)">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold" style="font-size:12px">{{ slot.time }}</span>
                        <span v-if="slot.status==='BOOKED'" class="badge" style="background:#fee2e2;color:#dc2626;font-size:9px">Đã đặt</span>
                        <span v-else-if="isSlotSelected(activeEditCourtId, slot)" class="badge bg-white bg-opacity-25 text-white" style="font-size:9px">Chọn</span>
                      </div>
                      <div style="font-size:11px;opacity:.8">{{ formatPrice(slot.price) }} đ</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── TIMELINE VIEW ── -->
              <div v-if="slotView==='timeline'" class="vdp-tl">
                <div class="vdp-tl-scroll">
                  <div class="vdp-tl-head d-flex" style="background:#1e293b;min-width:max-content">
                    <div class="vdp-tl-lbl"></div>
                    <div class="d-flex flex-grow-1">
                      <div v-for="h in tlHours" :key="h" class="vdp-tl-hcell text-white">{{ tlFmtHour(h) }}</div>
                    </div>
                  </div>
                  <!-- Chỉ render các sân đang được chọn -->
                  <div v-for="court in selectedCourts" :key="court.id" class="vdp-tl-row d-flex">
                    <div class="vdp-tl-lbl vdp-tl-clbl fw-bold small">{{ court.name }}</div>
                    <div class="vdp-tl-body position-relative d-flex flex-grow-1">
                      <div v-for="h in tlHours" :key="h"
                        :class="['vdp-tl-cell',
                          isTlHourNoSlot(court.id,h) ? 'vdp-tl-cell--noslot' :
                          isTlHourBooked(court.id,h) ? 'vdp-tl-cell--booked' : 'vdp-tl-cell--free']"
                        @click="toggleTlHour(court.id,h)">
                      </div>
                      <div v-for="seg in getTlBookedSegs(court.id)" :key="`b${seg.start}`"
                        class="vdp-tl-block vdp-tl-block--bk position-absolute"
                        :style="tlBlockStyle(seg.start,seg.end)">Đã đặt</div>
                      <div v-for="seg in getTlSelectedSegs(court.id)" :key="`s${seg.start}`"
                        class="vdp-tl-block vdp-tl-block--sel position-absolute"
                        :style="tlBlockStyle(seg.start,seg.end)"
                        @click.stop="removeTlSegment(court.id,seg)">
                        {{ tlFmtHour(seg.start) }}–{{ tlFmtHour(seg.end) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- ═══ Step 4: Dịch vụ thêm ═══ -->
          <div class="vdp-step">
            <div class="d-flex align-items-start gap-3 mb-0" style="cursor:pointer" @click="svcOpen=!svcOpen">
              <div class="vdp-snum">4</div>
              <div class="flex-grow-1">
                <div class="fw-bold fs-6 text-dark d-flex align-items-center gap-2">Dịch vụ thêm<span class="badge bg-secondary bg-opacity-10 text-muted fw-normal" style="font-size:11px">Tuỳ chọn</span></div>
                <div class="text-muted small">Nhấn để chọn dịch vụ đi kèm</div>
              </div>
              <svg :style="svcOpen?'transform:rotate(180deg)':''" style="transition:.25s;flex-shrink:0;color:#94a3b8" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <div v-if="!svcOpen && selectedServices.length" class="d-flex flex-wrap gap-2 mt-2">
              <span v-for="sid in selectedServices" :key="sid" class="badge rounded-pill d-flex align-items-center gap-1" style="background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;font-size:12px;font-weight:600;padding:4px 12px">
                {{ getServiceName(sid) }}<button @click.stop="toggleService(sid)" class="btn-close btn-close-sm ms-1" style="width:10px;height:10px"></button>
              </span>
            </div>
            <transition name="acc">
              <div v-if="svcOpen" class="mt-3">
                <div class="row g-2">
                  <div v-for="svc in services" :key="svc.id" class="col-12 col-md-6">
                    <div :class="['vdp-svc-card d-flex align-items-center gap-3 p-3 rounded-3 border-2 border', isServiceSelected(svc.id)?'border-success bg-success-subtle':'border-light-subtle bg-white']" style="cursor:pointer" @click="toggleService(svc.id)">
                      <div :class="['p-2 rounded-2 d-flex', isServiceSelected(svc.id)?'bg-success text-white':'bg-success-subtle text-success']" v-html="svc.icon"></div>
                      <div class="flex-grow-1">
                        <div class="fw-bold small text-dark">{{ svc.name }}</div>
                        <div class="text-success fw-bold" style="font-size:12px">+{{ formatPrice(svc.price) }} đ</div>
                      </div>
                      <div :class="['rounded-circle border-2 border d-flex align-items-center justify-content-center', isServiceSelected(svc.id)?'bg-success border-success text-white':'border-secondary']" style="width:20px;height:20px;flex-shrink:0">
                        <svg v-if="isServiceSelected(svc.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-end mt-3">
                  <button class="btn btn-success btn-sm" @click="svcOpen=false">✓ Xong — {{ selectedServices.length }} dịch vụ đã chọn</button>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- ═══ SIDEBAR ═══ -->
        <div class="col-lg-4">
          <div class="vdp-sidebar card border-0 sticky-top" style="top:90px">
            <div class="card-header d-flex justify-content-between align-items-center py-3">
              <span class="fw-bold text-white">Chi tiết đặt sân</span>
              <span v-if="totalSelectedSlotsCount" class="badge bg-success rounded-pill">{{ selectedCourtIds.length }} sân</span>
            </div>

            <!-- Empty state -->
            <div v-if="!totalSelectedSlotsCount" class="text-center py-5 text-muted">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.3" class="d-block mx-auto mb-3"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <small>Vui lòng chọn sân và khung giờ bạn muốn đặt</small>
            </div>

            <div v-else class="card-body p-0">
              <!-- Ngày chọn -->
              <div class="mx-3 mt-3 p-3 rounded-3" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0">
                <div class="d-flex align-items-center gap-2 small fw-semibold">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ selectedDateFormatted }}
                </div>
              </div>

              <!-- Breakdown theo từng sân -->
              <div class="px-3 mt-3">
                <div v-for="cid in selectedCourtIds" :key="cid">
                  <template v-if="(selectedSlotsByCourtId[cid]||[]).length">
                    <!-- Header sân -->
                    <div class="d-flex align-items-center gap-2 mb-1 mt-2">
                      <div class="bg-success-subtle text-success rounded-2 px-2 py-1 d-flex align-items-center gap-1" style="font-size:11px;font-weight:700">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                        {{ getCourtName(cid) }}
                      </div>
                    </div>
                    <!-- Các slot của sân này (merged) -->
                    <div v-for="g in mergedSlotsByCourt(cid)" :key="g.timeLabel" class="d-flex align-items-center gap-2 p-2 rounded-2 mb-1 vdp-slot-row">
                      <span class="flex-grow-1 small fw-semibold">{{ g.timeLabel }}</span>
                      <span class="fw-bold text-success small">{{ formatPrice(g.price) }} đ</span>
                      <button class="vdp-rm-btn" @click="g.slots.forEach(s => toggleSlot(cid, s))">×</button>
                    </div>
                    <!-- Subtotal sân này -->
                    <div class="d-flex justify-content-between px-2 pb-2 border-bottom mb-1">
                      <span class="text-muted" style="font-size:11px">Cộng {{ getCourtName(cid) }}</span>
                      <span class="fw-bold text-dark" style="font-size:11px">{{ formatPrice(courtTotalByCourt(cid)) }} đ</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Dịch vụ thêm -->
              <div v-if="selectedServices.length" class="px-3 mt-2">
                <div class="text-uppercase fw-bold mb-1" style="font-size:10px;letter-spacing:.4px;color:#94a3b8">Dịch vụ thêm</div>
                <div v-for="sid in selectedServices" :key="sid" class="d-flex align-items-center gap-2 p-2 rounded-2 mb-1 vdp-slot-row">
                  <span class="flex-grow-1 small fw-semibold">{{ getServiceName(sid) }}</span>
                  <span class="fw-bold text-success small">{{ formatPrice(getServicePrice(sid)) }} đ</span>
                  <button class="vdp-rm-btn" @click="toggleService(sid)">×</button>
                </div>
              </div>

              <!-- Voucher -->
              <div class="px-3 mt-2">
                <div class="input-group input-group-sm">
                  <span class="input-group-text border-end-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </span>
                  <input v-model="form.voucher" type="text" class="form-control border-start-0" :class="voucherApplied?'is-valid':voucherError?'is-invalid':''" placeholder="Mã voucher giảm giá"/>
                  <button class="btn btn-dark btn-sm" :disabled="!form.voucher" @click="applyVoucher">Áp dụng</button>
                </div>
                <div v-if="voucherApplied" class="text-success small mt-1">✓ Giảm {{ formatPrice(discount) }} đ đã áp dụng!</div>
                <div v-if="voucherError" class="text-danger small mt-1">Mã không hợp lệ hoặc đã hết hạn</div>
              </div>

              <!-- Thông tin khách hàng -->
              <div class="px-3 mt-3">
                <div class="text-uppercase fw-bold mb-2" style="font-size:10px;letter-spacing:.5px;color:#94a3b8">Thông tin khách hàng</div>
                <div class="mb-2"><label class="form-label small fw-bold mb-1">Họ và tên <span class="text-danger">*</span></label><input v-model="form.name" type="text" class="form-control form-control-sm" placeholder="Nguyễn Văn A"/></div>
                <div class="mb-2"><label class="form-label small fw-bold mb-1">Số điện thoại <span class="text-danger">*</span></label><input v-model="form.phone" type="tel" class="form-control form-control-sm" placeholder="0901 234 567"/></div>
                <div class="mb-2"><label class="form-label small fw-bold mb-1">Email</label><input v-model="form.email" type="email" class="form-control form-control-sm" placeholder="email@example.com"/></div>
                <div class="mb-2"><label class="form-label small fw-bold mb-1">Ghi chú</label><textarea v-model="form.note" class="form-control form-control-sm" rows="2" placeholder="Yêu cầu thêm..."></textarea></div>
              </div>

              <!-- Tổng cộng -->
              <div class="px-3 mt-2 pt-2 border-top">
                <div v-if="serviceTotal>0" class="d-flex justify-content-between small text-muted py-1"><span>Tiền sân ({{ selectedCourtIds.length }} sân)</span><span>{{ formatPrice(courtTotal) }} đ</span></div>
                <div v-if="serviceTotal>0" class="d-flex justify-content-between small text-muted py-1"><span>Dịch vụ</span><span>{{ formatPrice(serviceTotal) }} đ</span></div>
                <div v-if="discount>0" class="d-flex justify-content-between small py-1"><span class="text-muted">Giảm giá</span><span class="text-danger fw-bold">– {{ formatPrice(discount) }} đ</span></div>
                <div class="d-flex justify-content-between align-items-center pt-2 mt-1 border-top"><span class="fw-bold">Tổng cộng</span><span class="fw-black text-success fs-5">{{ formatPrice(grandTotal) }} đ</span></div>
              </div>

              <div class="p-3">
                <button class="btn btn-success w-100 fw-bold py-3" :disabled="!form.name||!form.phone" @click="handleBooking">✓ TIẾP TỤC ĐẶT SÂN</button>
                <p v-if="!form.name||!form.phone" class="text-danger text-center mt-1 mb-0" style="font-size:17px; opacity:0.8;">Vui lòng điền họ tên và số điện thoại</p>
                <p class="text-muted text-center mt-1 mb-0" style="font-size:17px; opacity:0.8;">Không áp dụng hoàn tiền sau khi xác nhận</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- INFO TAB -->
      <div v-if="activeTab==='info'" class="row g-4 bg-white rounded-bottom-3 shadow-sm p-4">
        <div class="col-lg-8">
          <h4 class="fw-black mb-3">Giới thiệu về {{ venue.name }}</h4>
          <p class="text-muted" style="line-height:1.8">{{ venue.description }}</p>
          <!-- GALLERY -->
          <div class="vdp-gallery mt-4 mb-2">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h5 class="fw-bold mb-0">Hình ảnh sân</h5>
              <span class="text-muted small fw-semibold">{{ galleryIndex + 1 }} / {{ venueImages.length }}</span>
            </div>
            <div class="vdp-gallery__main position-relative overflow-hidden mb-3" style="height:380px;background:#0f172a;">
              <transition name="gfade" mode="out-in">
                <img :key="galleryIndex" :src="venueImages[galleryIndex]?.url" :alt="venueImages[galleryIndex]?.caption" class="position-absolute w-100 h-100" style="object-fit:cover;top:0;left:0;"/>
              </transition>
              <div class="position-absolute bottom-0 start-0 end-0" style="height:110px;background:linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 100%);pointer-events:none;z-index:2"></div>
              <div class="position-absolute bottom-0 start-0 px-4 pb-3" style="z-index:3">
                <span class="text-white fw-semibold d-flex align-items-center gap-2" style="font-size:14px;text-shadow:0 1px 6px rgba(0,0,0,.6)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {{ venueImages[galleryIndex]?.caption || 'Ảnh không có mô tả' }}
                </span>
              </div>
              <div class="position-absolute bottom-0 start-0 end-0 d-flex justify-content-center gap-1 pb-3" style="z-index:3;pointer-events:none">
                <span v-for="(_,i) in venueImages" :key="i" class="vdp-gal-dot" :class="{'vdp-gal-dot--active':i===galleryIndex}"></span>
              </div>
              <button class="vdp-gal-nav vdp-gal-nav--prev" @click="prevImage"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
              <button class="vdp-gal-nav vdp-gal-nav--next" @click="nextImage"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
            <div class="d-flex gap-2 pb-1" style="overflow-x:auto;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;">
              <div v-for="(img,i) in venueImages" :key="i" class="vdp-gal-thumb flex-shrink-0 overflow-hidden" :class="{'vdp-gal-thumb--active':i===galleryIndex}" @click="galleryIndex=i">
                <img :src="img.url" :alt="img.caption" style="width:100%;height:100%;object-fit:cover;display:block;"/>
              </div>
            </div>
          </div>
          <h5 class="fw-bold mt-4 mb-3">Tiện ích sân</h5>
          <div class="row g-2">
            <div v-for="a in venue.amenities" :key="a.id" class="col-6 d-flex align-items-center gap-2">
              <div class="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style="width:26px;height:26px;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
              <span class="small">{{ a.name }}</span>
            </div>
          </div>
          <h5 class="fw-bold mt-4 mb-3">Giờ mở cửa</h5>
          <div v-for="(d,i) in venue.openingHours" :key="d.day" :class="['d-flex justify-content-between px-3 py-2 rounded-2', i%2===1?'bg-light':'']">
            <span class="fw-semibold small">{{ d.day }}</span>
            <span class="fw-bold small" :class="d.isClosed?'text-danger':'text-success'">{{ d.isClosed?'Đóng cửa':`${d.open} – ${d.close}` }}</span>
          </div>

          <!-- BẢN ĐỒ VỊ TRÍ -->
          <h5 class="fw-bold mt-4 mb-3">Vị trí & Bản đồ</h5>
          <div class="mb-3 d-flex align-items-center gap-2 text-muted small fw-semibold" style="line-height: 1.5">
            <svg style="flex-shrink:0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {{ venue.address }}
          </div>
          <div class="rounded-3 overflow-hidden border shadow-sm" style="height: 320px;">
            <iframe 
              v-if="venue.address"
              width="100%" 
              height="100%" 
              frameborder="0" 
              style="border:0"
              :src="`https://maps.google.com/maps?q=${encodeURIComponent(venue.address)}&hl=vi&z=15&output=embed`" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="vdp-sidebar card border-0">
            <div class="card-header py-3"><span class="fw-bold text-white">Đặt sân ngay</span></div>
            <div class="card-body"><button class="btn btn-success w-100 fw-bold" @click="activeTab='booking'">Chọn khung giờ →</button></div>
          </div>
        </div>
      </div>

      <!-- REVIEW TAB -->
      <div v-if="activeTab==='review'" class="bg-white rounded-bottom-3 shadow-sm">
        <div v-if="reviews.length > 0" class="vdp-rv-summary px-4 pt-4 pb-3 border-bottom">
          <div class="row align-items-center g-4">
            <div class="col-auto">
              <div class="text-center" style="min-width:90px">
                <div class="vdp-rv-score__num">{{ avgRating.toFixed(1) }}</div>
                <div class="d-flex justify-content-center gap-1 my-1">
                  <span v-for="s in 5" :key="s" style="font-size:17px;" :style="{color:s<=Math.round(avgRating)?'#f59e0b':'#e2e8f0'}">★</span>
                </div>
                <div class="text-muted small">{{ reviews.length }} đánh giá</div>
              </div>
            </div>
            <div class="col">
              <div v-for="star in [5,4,3,2,1]" :key="star" class="d-flex align-items-center gap-2 mb-1">
                <span class="text-muted small fw-semibold" style="width:14px;text-align:right;flex-shrink:0">{{ star }}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" style="flex-shrink:0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <div class="vdp-rv-bar flex-grow-1"><div class="vdp-rv-bar__fill" :style="{width:ratingPercent(star)+'%'}"></div></div>
                <span class="text-muted small" style="width:22px;flex-shrink:0;text-align:right">{{ ratingCount(star) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-4 pt-4 pb-4 border-bottom">
          <div v-if="reviewAuthState === 'idle'">
            <h6 class="fw-black mb-1" style="font-size:15px">Viết đánh giá của bạn</h6>
            <p class="text-muted small mb-3">Chỉ khách hàng đã đặt sân tại đây mới có thể đánh giá.</p>
            <div class="vdp-rv-auth-box p-4 rounded-3">
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="vdp-rv-auth-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <div class="fw-bold small">Xác thực lịch sử đặt sân</div>
                  <div class="text-muted" style="font-size:12px">Nhập số điện thoại bạn đã dùng khi đặt sân</div>
                </div>
              </div>
              <div class="d-flex gap-2">
                <input v-model="authPhone" type="tel" class="form-control form-control-sm flex-grow-1" placeholder="Nhập số điện thoại đã đặt sân..." @keyup.enter="checkBookingHistory"/>
                <button class="btn btn-success btn-sm fw-bold px-3" :disabled="!authPhone" @click="checkBookingHistory">Xác nhận</button>
              </div>
            </div>
          </div>

          <div v-else-if="reviewAuthState === 'verified'">
            <div class="d-flex align-items-center justify-content-between mb-4">
              <h6 class="fw-black mb-0" style="font-size:15px">Viết đánh giá của bạn</h6>
              <div class="vdp-rv-verified-badge d-flex align-items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Đã xác thực · {{ authPhone }}
                <button class="vdp-rv-verified-reset" @click="resetAuth" title="Đổi số khác">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold mb-2">Chất lượng sân <span class="text-danger">*</span></label>
              <div class="d-flex align-items-center gap-1">
                <button v-for="s in 5" :key="s" class="vdp-star-btn" :class="{'vdp-star-btn--filled':s<=(reviewHover||reviewForm.rating)}" @mouseenter="reviewHover=s" @mouseleave="reviewHover=0" @click="reviewForm.rating=s">★</button>
                <span class="ms-2 small fw-bold" :style="{color:reviewForm.rating?'#f59e0b':'#94a3b8'}">{{ ['','Tệ','Không tốt','Bình thường','Tốt','Xuất sắc 🎉'][reviewForm.rating||0]||'Chọn số sao' }}</span>
              </div>
            </div>
            <div class="row g-2 mb-2">
              <div class="col-md-6">
                <label class="form-label small fw-bold mb-1">Họ tên <span class="text-danger">*</span></label>
                <input v-model="reviewForm.author" type="text" class="form-control form-control-sm" placeholder="Nguyễn Văn A"/>
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold mb-1">Tiêu đề <span class="text-muted fw-normal">(tuỳ chọn)</span></label>
                <input v-model="reviewForm.title" type="text" class="form-control form-control-sm" placeholder="Sân đẹp, dịch vụ tốt..."/>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold mb-1">Nội dung <span class="text-danger">*</span></label>
              <textarea v-model="reviewForm.content" class="form-control form-control-sm" rows="3" placeholder="Chia sẻ trải nghiệm về chất lượng sân, dịch vụ, mặt cỏ..."></textarea>
            </div>
            <div class="mb-4">
              <label class="form-label small fw-bold mb-2">Đính kèm hình ảnh <span class="text-muted fw-normal">(tối đa 5 ảnh)</span></label>
              <div class="d-flex flex-wrap gap-2 align-items-center">
                <div v-for="(img,i) in reviewForm.images" :key="i" class="vdp-rv-imgprev position-relative rounded-3 overflow-hidden flex-shrink-0" style="width:76px;height:76px;">
                  <img :src="img" style="width:100%;height:100%;object-fit:cover;display:block;"/>
                  <button class="vdp-rv-imgprev__rm" @click="removeReviewImage(i)">×</button>
                </div>
                <label v-if="reviewForm.images.length<5" class="vdp-rv-addimg d-flex flex-column align-items-center justify-content-center rounded-3 flex-shrink-0" style="width:76px;height:76px;cursor:pointer;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/><line x1="14" y1="8" x2="14" y2="14"/><line x1="11" y1="11" x2="17" y2="11"/></svg>
                  <span style="font-size:10px;color:#94a3b8;margin-top:4px;font-weight:600">Thêm ảnh</span>
                  <input type="file" accept="image/*" multiple class="d-none" @change="handleReviewImages"/>
                </label>
              </div>
            </div>
            <div class="d-flex justify-content-end">
              <button class="btn btn-success fw-bold px-5" :disabled="!reviewForm.rating||!reviewForm.author||!reviewForm.content" @click="submitReview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="me-2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Gửi đánh giá
              </button>
            </div>
          </div>

          <div v-else-if="reviewAuthState === 'denied'">
            <div class="vdp-rv-locked-box p-4 rounded-3 text-center">
              <div class="vdp-rv-locked-icon mx-auto mb-3">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
              </div>
              <h6 class="fw-black mb-1">Bạn chưa có lịch sử đặt sân</h6>
              <p class="text-muted small mb-3">Số điện thoại <strong>{{ authPhone }}</strong> chưa từng đặt sân tại đây.<br>Chỉ khách hàng đã đặt sân mới được để lại đánh giá.</p>
              <div class="d-flex gap-2 justify-content-center flex-wrap">
                <button class="btn btn-success btn-sm fw-bold px-4" @click="activeTab='booking'">Đặt sân ngay →</button>
                <button class="btn btn-outline-secondary btn-sm" @click="resetAuth">Thử số khác</button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-4 py-4">
          <div v-if="reviews.length===0" class="text-center py-5 text-muted">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" class="d-block mx-auto mb-3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <p class="mb-0 fw-semibold">Chưa có đánh giá nào.</p>
            <p class="small mt-1">Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
          </div>
          <div v-else>
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h6 class="fw-black mb-0">{{ reviews.length }} đánh giá</h6>
              <select class="form-select form-select-sm w-auto" v-model="reviewSort" style="font-size:12px;border-radius:8px;border-color:#e2e8f0;font-weight:600">
                <option value="newest">Mới nhất</option>
                <option value="highest">Điểm cao nhất</option>
                <option value="lowest">Điểm thấp nhất</option>
              </select>
            </div>
            <div v-for="rv in sortedReviews" :key="rv.id" class="vdp-rv-card mb-3 p-4 rounded-3">
              <div class="d-flex align-items-start gap-3">
                <div class="vdp-rv-avatar flex-shrink-0">{{ rv.author.charAt(0).toUpperCase() }}</div>
                <div class="flex-grow-1" style="min-width:0">
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <span class="fw-bold small">{{ rv.author }}</span>
                      <span class="vdp-rv-verified-tag">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Đã đặt sân
                      </span>
                      <span class="text-muted small">· {{ rv.date }}</span>
                    </div>
                    <div class="d-flex gap-1">
                      <span v-for="s in 5" :key="s" style="font-size:15px;" :style="{color:s<=rv.rating?'#f59e0b':'#e2e8f0'}">★</span>
                    </div>
                  </div>
                  <div v-if="rv.title" class="fw-semibold mb-1" style="font-size:13.5px;color:#0f172a">{{ rv.title }}</div>
                  <p class="text-muted mb-2" style="font-size:13px;line-height:1.7">{{ rv.content }}</p>
                  <div v-if="rv.images&&rv.images.length" class="d-flex flex-wrap gap-2 mt-2 mb-2">
                    <div v-for="(img,i) in rv.images" :key="i" class="vdp-rv-photo rounded-3 overflow-hidden" @click="openLightbox(rv.images,i)">
                      <img :src="img" style="width:100%;height:100%;object-fit:cover;display:block;"/>
                    </div>
                  </div>
                  <button class="vdp-rv-like-btn" @click="likeReview(rv)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    Hữu ích{{ rv.likes>0?` (${rv.likes})`:'' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- LIGHTBOX -->
    <transition name="fade">
      <div v-if="lightbox.show" class="vdp-lightbox" @click.self="lightbox.show=false">
        <button class="vdp-lightbox__close" @click="lightbox.show=false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <button class="vdp-lightbox__nav vdp-lightbox__nav--prev" @click="lightbox.index=(lightbox.index-1+lightbox.images.length)%lightbox.images.length"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
        <transition name="gfade" mode="out-in"><img :key="lightbox.index" :src="lightbox.images[lightbox.index]" class="vdp-lightbox__img"/></transition>
        <button class="vdp-lightbox__nav vdp-lightbox__nav--next" @click="lightbox.index=(lightbox.index+1)%lightbox.images.length"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
        <div class="vdp-lightbox__counter">{{ lightbox.index+1 }} / {{ lightbox.images.length }}</div>
      </div>
    </transition>
  </div>
</template>

<script>
import '@/assets/vdp.css'
import { clubService } from '@/services/club.service.js';
export default {
  name: 'VenueDetailView',

  data() {
    return {
      activeTab: 'booking',
      dateOffset: 0,

      // ── MULTI-COURT SELECTION ────────────────────────────────────
      // Danh sách id các sân đang được chọn (thay cho selectedCourtId đơn)
      selectedCourtIds: [],
      // Map { courtId: [slot, slot, ...] } — slot đã chọn theo từng sân
      selectedSlotsByCourtId: {},
      // Sân đang được hiển thị/edit trong Grid view
      activeEditCourtId: null,

      selectedServices: [],
      svcOpen: false,
      slotView: 'grid',

      // ── Gallery ──────────────────────────────────────────────────
      galleryIndex: 0,
      venueImages: [],

      // ── Loading state ─────────────────────────────────────────────
      venueLoading: true,
      slotsLoading: false,

      // ── Review Auth ──────────────────────────────────────────────
      reviewAuthState: 'idle',
      authPhone: '',
      bookedPhones: [],

      // ── Review Form ──────────────────────────────────────────────
      reviewHover: 0,
      reviewSort: 'newest',
      reviewForm: { rating: 0, author: '', title: '', content: '', images: [] },
      reviews: [],

      lightbox: { show: false, images: [], index: 0 },      tlHours: [5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12,12.5,13,13.5,14,14.5,15,15.5,16,16.5,17,17.5,18,18.5,19,19.5,20,20.5,21],

      voucherApplied: false,
      voucherError: false,
      discount: 0,
      form: { name:'', phone:'', email:'', note:'', voucher:'' },

      tabs: [
        { id:'booking', label:'Đặt sân',   icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
        { id:'info',    label:'Thông tin', icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
        { id:'review',  label:'Đánh giá',  icon:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
      ],

      services: [
        { id:'s1', name:'Thuê đồ thi đấu',      price:100000, icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>' },
        { id:'s2', name:'Quay video/Livestream', price:200000, icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>' },
        { id:'s3', name:'Thuê giày bóng đá',     price: 50000, icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>' },
        { id:'s4', name:'Nước uống (12 chai)',    price: 80000, icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>' },
        { id:'s5', name:'Thuê trọng tài',         price:150000, icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>' },
        { id:'s6', name:'Thuê bóng đá',           price: 30000, icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 00-6.88 17.19L12 12l6.88 7.19A10 10 0 0012 2z"/></svg>' },
      ],

      // ── Venue data (fetched from API) ──────────────────────────
      clubId: '',
      venueSlug: '',
      venue: {
        name: '',
        address: '',
        image: '',
        description: '',
        amenities: [],
        courts: [],
        openingHours: [],
      },

      // ── Slots (fetched from API per date) ─────────────────────
      allSlots: {},

      validVouchers: { 'GIAM50K':50000,'WELCOME':100000,'VIP2026':200000 },
    };
  },

  watch: {
    dateOffset() {
      // Khi đổi ngày → fetch lại slots + reset selection
      const resetSlots = {};
      this.selectedCourtIds.forEach(id => { resetSlots[id] = []; });
      this.selectedSlotsByCourtId = { ...resetSlots };
      this.fetchSlots();
    },
  },

  async mounted() {
    this.venueSlug = this.$route.params.id;
    if (this.venueSlug) {
      await this.fetchVenueData();
      await this.fetchSlots();
    }
  },

  computed: {
    nextSevenDays() {
      const days=['CN','T2','T3','T4','T5','T6','T7'],now=new Date();
      return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(now.getDate()+i);return{full:d.toISOString().split('T')[0],dayName:i===0?'HÔM NAY':days[d.getDay()],dayNumber:d.getDate(),month:d.getMonth()+1};});
    },
    selectedDate()          { return this.nextSevenDays[this.dateOffset]?.full||''; },
    selectedDateFormatted() { if(!this.selectedDate)return''; const[y,m,d]=this.selectedDate.split('-'); return`${d}/${m}/${y}`; },

    // Các court object đang được chọn
    selectedCourts() {
      return this.venue.courts.filter(c => this.selectedCourtIds.includes(c.id));
    },

    // Slots hiển thị trong grid cho sân đang active
    gridSlotsForActiveCourt() {
      return this.allSlots[this.activeEditCourtId] || [];
    },

    // Tổng số slot đã chọn trên tất cả sân
    totalSelectedSlotsCount() {
      return Object.values(this.selectedSlotsByCourtId).reduce((sum, slots) => sum + slots.length, 0);
    },

    // Tổng tiền sân (tất cả sân)
    courtTotal() {
      return Object.entries(this.selectedSlotsByCourtId).reduce((sum, [, slots]) => {
        return sum + slots.reduce((s, sl) => s + sl.price, 0);
      }, 0);
    },

    serviceTotal() { return this.selectedServices.reduce((s,id)=>s+this.getServicePrice(id),0); },
    grandTotal()   { return Math.max(0, this.courtTotal + this.serviceTotal - this.discount); },

    avgRating() { return this.reviews.length?this.reviews.reduce((s,r)=>s+r.rating,0)/this.reviews.length:0; },
    sortedReviews() {
      const r=[...this.reviews];
      if(this.reviewSort==='highest')r.sort((a,b)=>b.rating-a.rating);
      else if(this.reviewSort==='lowest')r.sort((a,b)=>a.rating-b.rating);
      else r.sort((a,b)=>b.id-a.id);
      return r;
    },
  },

  methods: {
    async fetchVenueData() {
      try {
        this.venueLoading = true;
        const res = await clubService.getClubBySlug(this.venueSlug);
        if (res.data && res.data.data) {
          const apiClub = res.data.data;
          this.clubId = apiClub.id;
          
          this.venue = {
            name: apiClub.name || '',
            address: `${apiClub.address}, ${apiClub.ward ? apiClub.ward + ', ' : ''}${apiClub.district}, ${apiClub.city}`,
            image: apiClub.coverImageUrl || '',
            description: apiClub.description || '',
            amenities: apiClub.amenities?.map(a => ({
              id: a.amenity.id, name: a.amenity.name, icon: a.amenity.icon
            })) || [],
            courts: apiClub.courts?.map(c => ({
              id: c.id, 
              name: c.name, 
              basePrice: c.pricings?.[0]?.pricePerHour ? Number(c.pricings[0].pricePerHour) : 0
            })) || [],
            openingHours: apiClub.openingHours?.map(h => {
              const days = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
              const open = new Date(h.openTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
              const close = new Date(h.closeTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
              return {
                day: days[h.dayOfWeek],
                open,
                close,
                isClosed: h.isClosed
              }
            }) || []
          };
          
          // Set venueImages if empty
          if (this.venueImages.length === 0 && apiClub.images) {
            this.venueImages = apiClub.images.map(img => ({
              url: img.url,
              caption: img.caption || 'Hình ảnh sân'
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching venue:", err);
      } finally {
        this.venueLoading = false;
      }
    },

    async fetchSlots() {
      if (!this.venueSlug || !this.selectedDate) return;
      try {
        this.slotsLoading = true;
        const res = await clubService.getSlotsByClub(this.venueSlug, this.selectedDate);
        if (res.data && res.data.data) {
          const courtsData = res.data.data.courts || [];
          const newAllSlots = {};
          
          courtsData.forEach(court => {
            newAllSlots[court.id] = court.slots.map(slot => ({
              id: slot.id,
              time: slot.time,
              price: slot.price,
              status: slot.status
            }));
          });
          
          this.allSlots = newAllSlots;
          
          // Cập nhật selectedCourtIds nếu chưa có (chọn sân đầu tiên làm default)
          if (this.venue.courts && this.venue.courts.length > 0 && this.selectedCourtIds.length === 0) {
              const defaultCourtId = this.venue.courts[0].id;
              this.toggleCourt(defaultCourtId);
          }
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        this.slotsLoading = false;
      }
    },

    formatPrice(v)      { return new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(v); },
    getCourtName(id)    { return this.venue.courts.find(c=>c.id===id)?.name||''; },
    getServiceName(id)  { return this.services.find(s=>s.id===id)?.name||''; },
    getServicePrice(id) { return this.services.find(s=>s.id===id)?.price||0; },
    parseHour(t)        { const[h,m]=t.split(':').map(Number);return h+m/60; },
    slotStart(slot)     { return this.parseHour(slot.time.split(' – ')[0]); },
    slotEnd(slot)       { return this.parseHour(slot.time.split(' – ')[1]); },
    tlFmtHour(h)        { return`${String(Math.floor(h)).padStart(2,'0')}:${h%1===0.5?'30':'00'}`; },

    // ── MULTI-COURT SELECTION ────────────────────────────────────
    isCourtSelected(id) { return this.selectedCourtIds.includes(id); },

    toggleCourt(id) {
      const i = this.selectedCourtIds.indexOf(id);
      if (i > -1) {
        // Bỏ chọn sân → xoá slot của sân đó
        this.selectedCourtIds.splice(i, 1);
        const newSlots = { ...this.selectedSlotsByCourtId };
        delete newSlots[id];
        this.selectedSlotsByCourtId = newSlots;
        
        // Nếu activeEditCourtId bị xoá → chuyển sang sân đầu tiên còn lại
        if (this.activeEditCourtId === id) {
          this.activeEditCourtId = this.selectedCourtIds[0] || null;
        }
      } else {
        // Thêm sân
        this.selectedCourtIds.push(id);
        if (!this.selectedSlotsByCourtId[id]) {
          this.selectedSlotsByCourtId = { ...this.selectedSlotsByCourtId, [id]: [] };
        }
        // Auto-focus vào sân mới chọn
        this.activeEditCourtId = id;
      }
    },

    clearAllSlots() {
      const reset = {};
      this.selectedCourtIds.forEach(id => { reset[id] = []; });
      this.selectedSlotsByCourtId = reset;
    },

    // ── SLOT SELECTION (theo courtId) ────────────────────────────
    isSlotSelected(courtId, slot) {
      return (this.selectedSlotsByCourtId[courtId] || []).some(x => x.id === slot.id);
    },

    toggleSlot(courtId, slot) {
      if (slot.status === 'BOOKED' || slot.status === 'LOCKED') return;
      
      const currentSlots = this.selectedSlotsByCourtId[courtId] || [];
      const slots = [...currentSlots];
      
      const i = slots.findIndex(x => x.id === slot.id);
      if (i > -1) slots.splice(i, 1);
      else slots.push(slot);
      
      // Force UI reactivity via new object reference
      this.selectedSlotsByCourtId = { 
        ...this.selectedSlotsByCourtId, 
        [courtId]: slots 
      };
    },

    // Tổng tiền cho 1 sân cụ thể
    courtTotalByCourt(courtId) {
      return (this.selectedSlotsByCourtId[courtId] || []).reduce((s, sl) => s + sl.price, 0);
    },

    // Merge các slot liên tiếp của 1 sân thành các segment (giống mergedSlots cũ)
    mergedSlotsByCourt(courtId) {
      const slots = this.selectedSlotsByCourtId[courtId] || [];
      if (!slots.length) return [];
      const sorted = [...slots].sort((a, b) => this.slotStart(a) - this.slotStart(b));
      const groups = []; let cur = null;
      sorted.forEach(slot => {
        const start = this.slotStart(slot), end = this.slotEnd(slot);
        if (cur && Math.abs(cur.end - start) < 0.01) { cur.end = end; cur.price += slot.price; cur.slots.push(slot); }
        else { if (cur) groups.push(cur); cur = { start, end, price: slot.price, slots: [slot] }; }
      });
      if (cur) groups.push(cur);
      return groups.map(g => ({ timeLabel: `${this.tlFmtHour(g.start)} – ${this.tlFmtHour(g.end)}`, price: g.price, slots: g.slots }));
    },

    isServiceSelected(id){ return this.selectedServices.includes(id); },
    toggleService(id)    { const i=this.selectedServices.indexOf(id);if(i>-1)this.selectedServices.splice(i,1);else this.selectedServices.push(id); },

    applyVoucher() {
      const code=this.form.voucher.trim().toUpperCase();
      if(this.validVouchers[code]){this.discount=this.validVouchers[code];this.voucherApplied=true;this.voucherError=false;}
      else{this.discount=0;this.voucherApplied=false;this.voucherError=true;}
    },

    // ── Gallery ──────────────────────────────────────────────────
    prevImage() { this.galleryIndex=(this.galleryIndex-1+this.venueImages.length)%this.venueImages.length; },
    nextImage()  { this.galleryIndex=(this.galleryIndex+1)%this.venueImages.length; },

    // ── Review Auth ───────────────────────────────────────────────
    checkBookingHistory() {
      const phone = this.authPhone.trim().replace(/\s/g,'');
      if(!phone) return;
      const normalize = p => p.replace(/[\s\-\.]/g,'');
      const matched = this.bookedPhones.some(p => normalize(p) === normalize(phone));
      this.reviewAuthState = matched ? 'verified' : 'denied';
    },
    resetAuth() { this.reviewAuthState='idle'; this.authPhone=''; },

    // ── Review ───────────────────────────────────────────────────
    ratingCount(star)   { return this.reviews.filter(r=>r.rating===star).length; },
    ratingPercent(star) { return this.reviews.length?Math.round((this.ratingCount(star)/this.reviews.length)*100):0; },
    handleReviewImages(e) {
      const files=Array.from(e.target.files).slice(0,5-this.reviewForm.images.length);
      files.forEach(f=>{const reader=new FileReader();reader.onload=ev=>{if(this.reviewForm.images.length<5)this.reviewForm.images.push(ev.target.result);};reader.readAsDataURL(f);});
      e.target.value='';
    },
    removeReviewImage(i) { this.reviewForm.images.splice(i,1); },
    submitReview() {
      if(!this.reviewForm.rating||!this.reviewForm.author||!this.reviewForm.content)return;
      const now=new Date();
      this.reviews.unshift({id:Date.now(),author:this.reviewForm.author,rating:this.reviewForm.rating,title:this.reviewForm.title||null,content:this.reviewForm.content,images:[...this.reviewForm.images],date:`${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`,likes:0});
      this.reviewForm={rating:0,author:'',title:'',content:'',images:[]};
      this.reviewAuthState='idle';
      this.authPhone='';
    },
    likeReview(rv) { rv.likes++; },
    openLightbox(images,index) { this.lightbox={show:true,images,index}; },

    // ── Timeline ─────────────────────────────────────────────────
    tlBlockStyle(start,end) { const total=this.tlHours.length,iStart=this.tlHours.indexOf(start),iEnd=this.tlHours.indexOf(end),colEnd=iEnd===-1?total:iEnd;return{left:`calc(${(iStart/total)*100}% + 1px)`,width:`calc(${((colEnd-iStart)/total)*100}% - 3px)`}; },
    getTlBookedSegs(cid) { return(this.allSlots[cid]||[]).filter(s=>s.status==='BOOKED').map(s=>({start:this.slotStart(s),end:this.slotEnd(s)})); },
    getTlSelectedSegs(cid) {
      const sel = this.selectedSlotsByCourtId[cid] || [];
      const segs = []; let cur = null;
      [...sel].sort((a,b)=>this.slotStart(a)-this.slotStart(b)).forEach(s=>{
        const a=this.slotStart(s),b=this.slotEnd(s);
        if(cur&&cur.end===a){cur.end=b;}else{if(cur)segs.push(cur);cur={start:a,end:b};}
      });
      if(cur)segs.push(cur);
      return segs;
    },
    isTlHourBooked(cid,h) { return(this.allSlots[cid]||[]).some(s=>s.status==='BOOKED'&&h>=this.slotStart(s)&&h<this.slotEnd(s)); },
    isTlHourNoSlot(cid,h) { return!(this.allSlots[cid]||[]).some(s=>h>=this.slotStart(s)&&h<this.slotEnd(s)); },
    toggleTlHour(cid,h) {
      if(this.isTlHourNoSlot(cid,h)||this.isTlHourBooked(cid,h))return;
      const slot=(this.allSlots[cid]||[]).find(s=>h>=this.slotStart(s)&&h<this.slotEnd(s));
      if(slot) this.toggleSlot(cid, slot);
    },
    removeTlSegment(cid,seg) {
      (this.allSlots[cid]||[]).filter(s=>this.slotStart(s)>=seg.start&&this.slotStart(s)<seg.end).forEach(s=>this.toggleSlot(cid, s));
    },

    // ── Booking ──────────────────────────────────────────────────
    handleBooking() {
      if (!this.totalSelectedSlotsCount) {
        alert("Vui lòng chọn ít nhất 1 khung giờ!");
        return;
      }
      // Gom tất cả slot của các sân thành 1 array flat để truyền sang checkout
      const allSelectedSlots = Object.entries(this.selectedSlotsByCourtId).flatMap(([courtId, slots]) =>
        slots.map(s => ({ ...s, courtId, courtName: this.getCourtName(courtId) }))
      );
      // Gom timeSlotIds thật (cuid) để gửi lên API booking
      const timeSlotIds = allSelectedSlots.map(s => s.id);
      // Gom services đầy đủ (id, name, price) thay vì chỉ gửi IDs
      const selectedServicesData = this.selectedServices.map(sid => {
        const svc = this.services.find(s => s.id === sid);
        return svc ? { id: svc.id, name: svc.name, price: svc.price } : null;
      }).filter(Boolean);
      this.$router.push({
        path: "/checkout",
        query: {
          club_id: this.clubId,
          club_slug: this.$route.params.slug,
          venue_name: this.venue.name,
          courts: JSON.stringify(this.selectedCourtIds.map(id => ({ id, name: this.getCourtName(id) }))),
          date: this.selectedDate,
          slots: JSON.stringify(allSelectedSlots),
          time_slot_ids: JSON.stringify(timeSlotIds),
          services: JSON.stringify(selectedServicesData),
          total: this.grandTotal,
          name: this.form.name,
          phone: this.form.phone,
          email: this.form.email,
          note: this.form.note,
          voucher_code: this.voucherApplied ? this.form.voucher.trim().toUpperCase() : '',
        }
      });
    },
  },
};
</script>