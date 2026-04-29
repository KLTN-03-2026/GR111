<template>
  <div class="courts-view">

    <!-- Header -->
    <div class="vheader">
      <div class="h-left">
        <h1 class="vtitle">Sân đấu & Cơ sở vật chất</h1>
        <p class="vsub">{{ selectedClubName || 'Vui lòng chọn câu lạc bộ để quản lý sân' }}</p>
      </div>
      <button class="btn-primary" @click="openAddDrawer" :disabled="!selectedClubId">
        <span class="material-icons">add_circle</span> Thêm sân mới
      </button>
    </div>

    <!-- Stats Row -->
    <div v-if="selectedClubId" class="stats-row">
      <div class="stat-card blue">
        <div class="sc-icon"><span class="material-icons">layers</span></div>
        <div class="sc-info">
          <span class="sc-label">Tổng số sân</span>
          <span class="sc-val">{{ courts.length }}</span>
        </div>
      </div>
      <div class="stat-card green">
        <div class="sc-icon"><span class="material-icons">check_circle</span></div>
        <div class="sc-info">
          <span class="sc-label">Đang hoạt động</span>
          <span class="sc-val">{{ courts.filter(c => c.status === 'ACTIVE').length }}</span>
        </div>
      </div>
      <div class="stat-card yellow">
        <div class="sc-icon"><span class="material-icons">sports_soccer</span></div>
        <div class="sc-info">
          <span class="sc-label">Bóng đá</span>
          <span class="sc-val">{{ courts.filter(c => c.sportType === 'FOOTBALL').length }}</span>
        </div>
      </div>
      <div class="stat-card purple">
        <div class="sc-icon"><span class="material-icons">hotel_class</span></div>
        <div class="sc-info">
          <span class="sc-label">Loại khác</span>
          <span class="sc-val">{{ courts.filter(c => c.sportType !== 'FOOTBALL').length }}</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="search-bar-wrap">
      <div class="search-bar">
        <div class="f-item club-sel">
          <span class="material-icons f-icon">business</span>
          <select v-model="selectedClubId" @change="fetchCourts">
            <option value="" disabled>Chọn câu lạc bộ...</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">{{ club.name }}</option>
          </select>
        </div>
        <div class="f-item s-wrap">
          <span class="material-icons f-icon">search</span>
          <input v-model="searchQuery" placeholder="Tìm tên sân..." />
        </div>
        <div class="f-item sport-sel">
          <select v-model="sportFilter">
            <option value="all">Tất cả môn thể thao</option>
            <option v-for="s in SPORT_TYPES" :key="s.value" :value="s.value">{{ s.emoji }} {{ s.label }}</option>
          </select>
        </div>
        <div class="f-item status-sel">
          <select v-model="statusFilter">
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="MAINTENANCE">Bảo trì</option>
            <option value="INACTIVE">Tạm dừng</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid">
      <div v-for="n in 3" :key="n" class="card loading-card">
        <div class="sk-img"></div>
        <div class="sk-body"><div class="sk-l w60"></div><div class="sk-l w40"></div></div>
      </div>
    </div>

    <!-- No Club -->
    <div v-else-if="!selectedClubId" class="empty-glass">
      <div class="empty-icon"><span class="material-icons">location_city</span></div>
      <h3>Chưa chọn câu lạc bộ</h3>
      <p>Vui lòng lựa chọn cơ sở thể thao để quản lý hệ thống sân công cộng hoặc tư nhân.</p>
    </div>

    <!-- Content -->
    <div v-else-if="filteredCourts.length" class="grid">
      <div v-for="(c, i) in filteredCourts" :key="c.id" class="card premium-card" :style="`--d:${i*70}ms`">
        <div class="c-header-sport" :class="c.sportType">
          <span class="s-emoji">{{ getSportEmoji(c.sportType) }}</span>
          <div class="s-info">
            <div class="s-label">{{ getSportLabel(c.sportType) }}</div>
            <div class="s-status" :class="c.status">
              <span class="dot"></span> {{ getStatusLabel(c.status) }}
            </div>
          </div>
        </div>
        <div class="c-cover">
          <img :src="(c.images && c.images.length > 0) ? c.images[0].url : 'https://images.unsplash.com/photo-1554062614-6da3d3b7625e?w=800&q=80'" alt="Court cover" />
        </div>
        <div class="cbody">
          <h3 class="c-title">{{ c.name }}</h3>
          <div class="c-meta-row">
            <div class="cm-item" v-if="c.indoorOutdoor">
              <span class="material-icons">{{ c.indoorOutdoor === 'INDOOR' ? 'roofing' : 'wb_sunny' }}</span>
              {{ c.indoorOutdoor === 'INDOOR' ? 'Trong nhà' : 'Ngoài trời' }}
            </div>
            <div class="cm-item" v-if="c.surface">
              <span class="material-icons">grass</span> {{ c.surface }}
            </div>
            <div class="cm-item" v-if="c.capacity">
              <span class="material-icons">people</span> {{ c.capacity }} người
            </div>
          </div>
          <p class="c-desc" v-if="c.description">{{ c.description }}</p>
          
          <div class="actions">
            <button class="abtn edit" @click="openEditDrawer(c)">
              <span class="material-icons">edit</span> <span>Sửa</span>
            </button>
            <button class="abtn del" @click="openDeleteModal(c)">
              <span class="material-icons">delete_outline</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="empty-glass">
      <div class="empty-icon"><span class="material-icons">sports_score</span></div>
      <h3>Chưa có sân đấu</h3>
      <p>Câu lạc bộ này hiện chưa đăng ký sân đấu nào trên hệ thống.</p>
      <button class="btn-primary" @click="openAddDrawer">
        <span class="material-icons">add_circle</span> Thêm ngay
      </button>
    </div>

    <!-- ══════════════════════════ DRAWER – THÊM SÂN ══════════════════════════ -->
    <transition name="drawer">
      <div class="drawer-overlay" v-if="showAddDrawer" @click.self="closeAddDrawer">
        <div class="drawer">
          <div class="drawer-header">
            <div class="drawer-title-row">
              <div class="drawer-icon add-icon"><span class="material-icons">add_home_work</span></div>
              <div>
                <h2 class="drawer-title">Thêm sân mới</h2>
                <p class="drawer-sub">{{ selectedClubName }}</p>
              </div>
            </div>
            <button class="drawer-close" @click="closeAddDrawer"><span class="material-icons">close</span></button>
          </div>

          <div class="drawer-body">
            <div v-if="addErrors.length > 0" class="form-alert error">
              <span class="material-icons">error_outline</span>
              <ul><li v-for="e in addErrors" :key="e">{{ e }}</li></ul>
            </div>

            <!-- Upload zone (multi-image) -->
            <div class="f-upload-sec">
                <div class="flabel"><span class="material-icons">collections</span>Bộ sưu tập ảnh sân ({{ addForm.images?.length || 0 }})</div>
                
                <div class="img-grid-edit">
                    <div v-for="(img, idx) in addForm.images" :key="idx" class="img-th">
                        <img :src="img" />
                        <button class="th-del" @click="addForm.images.splice(idx,1)"><span class="material-icons">close</span></button>
                    </div>

                    <!-- Upload Button -->
                    <div class="uz-small" 
                        :class="{over:addOver, loading:addUploading}"
                        @dragover.prevent="addOver=true" @dragleave.prevent="addOver=false"
                        @drop.prevent="e=>doUpload(e.dataTransfer.files[0],'add')"
                        @click="$refs.addFile.click()">
                        <input ref="addFile" type="file" accept="image/*" hidden @change="e=>doUpload(e.target.files[0],'add')" />
                        
                        <template v-if="addUploading">
                            <div class="uz-spin"></div>
                            <span>{{ addPct }}%</span>
                        </template>
                        <template v-else>
                            <span class="material-icons">add_a_photo</span>
                            <span class="uz-txt">Thêm ảnh</span>
                        </template>
                    </div>
                </div>

                <div class="url-input-mini">
                    <input v-model="addForm.newUrl" type="url" placeholder="Hoặc dán URL..." @keyup.enter="if(addForm.newUrl){addForm.images.push(addForm.newUrl);addForm.newUrl=''}" />
                    <button @click="if(addForm.newUrl){addForm.images.push(addForm.newUrl);addForm.newUrl=''}"><span class="material-icons">add</span></button>
                </div>
                <p v-if="addUpErr" class="err-msg">{{ addUpErr }}</p>
            </div>

            <div class="form-grid">
              <div class="field full">
                <label>Tên sân <span class="req">*</span></label>
                <input v-model="addForm.name" type="text" placeholder="Sân A1 (Trong nhà)..."
                  :class="{ invalid: addSubmitted && !addForm.name }" />
                <span class="field-error" v-if="addSubmitted && !addForm.name">Vui lòng nhập tên sân.</span>
              </div>

              <div class="field full">
                <label>Loại thể thao <span class="req">*</span></label>
                <select v-model="addForm.sportType" :class="{ invalid: addSubmitted && !addForm.sportType }">
                  <option value="" disabled>-- Chọn loại thể thao --</option>
                  <option v-for="s in SPORT_TYPES" :key="s.value" :value="s.value">{{ s.emoji }} {{ s.label }}</option>
                </select>
                <span class="field-error" v-if="addSubmitted && !addForm.sportType">Vui lòng chọn loại thể thao.</span>
              </div>

              <div class="field">
                <label>Vị trí</label>
                <select v-model="addForm.indoorOutdoor">
                  <option value="">-- Không rõ --</option>
                  <option value="INDOOR">🏠 Trong nhà</option>
                  <option value="OUTDOOR">☀️ Ngoài trời</option>
                </select>
              </div>

              <div class="field">
                <label>Sức chứa (người)</label>
                <input v-model.number="addForm.capacity" type="number" min="1" placeholder="VD: 10" />
              </div>

              <div class="field full">
                <label>Mặt sân</label>
                <input v-model="addForm.surface" type="text" placeholder="Cỏ nhân tạo, Sàn gỗ, Bê tông..." />
              </div>

              <div class="field full">
                <label>Mô tả</label>
                <textarea v-model="addForm.description" rows="3" placeholder="Thêm thông tin về sân..."></textarea>
              </div>
            </div>

            <!-- PRICING IN ADD DRAWER -->
            <div class="f-upload-sec" style="margin-top:32px;">
              <div class="flabel"><span class="material-icons">payments</span>Cài đặt bảng giá ban đầu</div>
              <p class="small text-muted mb-3" style="font-size:12px; margin-top:-10px">Hệ thống tự động gợi ý giá dựa trên các sân cùng loại thể thao của bạn.</p>
              
              <div class="pricing-rules">
                <div v-for="(p, idx) in addForm.pricings" :key="idx" class="price-rule-card">
                  <div class="pr-head">
                    <div class="pr-name">Khung giờ {{ idx + 1 }}</div>
                    <button class="pr-del" v-if="addForm.pricings.length > 1" @click="addForm.pricings.splice(idx,1)">
                      <span class="material-icons">delete</span>
                    </button>
                  </div>
                  <div class="pr-body">
                    <div class="pr-row">
                      <div class="pr-field">
                        <label>Thứ</label>
                        <select v-model.number="p.dayOfWeek">
                          <option :value="undefined">Mọi ngày</option>
                          <option :value="1">Thứ 2</option>
                          <option :value="2">Thứ 3</option>
                          <option :value="3">Thứ 4</option>
                          <option :value="4">Thứ 5</option>
                          <option :value="5">Thứ 6</option>
                          <option :value="6">Thứ 7</option>
                          <option :value="0">Chủ Nhật</option>
                        </select>
                      </div>
                      <div class="pr-field">
                        <label>Giá / Giờ</label>
                        <div class="price-input">
                          <input v-model.number="p.pricePerHour" type="number" step="1000" />
                          <span>đ</span>
                        </div>
                      </div>
                    </div>
                    <div class="pr-row">
                      <div class="pr-field">
                        <label>Từ</label>
                        <input type="time" v-model="p.startTime" />
                      </div>
                      <div class="pr-field">
                        <label>Đến</label>
                        <input type="time" v-model="p.endTime" />
                      </div>
                    </div>
                  </div>
                </div>
                <button class="btn-add-price" @click="addForm.pricings.push({ dayOfWeek: undefined, startTime:'05:00', endTime:'23:00', pricePerHour: 100000 })">
                  <span class="material-icons">add</span> Thêm khung giờ
                </button>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <button class="btn-cancel" @click="closeAddDrawer">Hủy</button>
            <button class="btn-save" :disabled="addLoading" @click="submitAdd">
              <span v-if="addLoading" class="spinner"></span>
              <span class="material-icons" v-else>save</span>
              {{ addLoading ? 'Đang lưu...' : 'Thêm sân' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══════════════════════════ DRAWER – SỬA SÂN ═══════════════════════════ -->
    <transition name="drawer">
      <div class="drawer-overlay" v-if="showEditDrawer" @click.self="closeEditDrawer">
        <div class="drawer">
          <div class="drawer-header">
            <div class="drawer-title-row">
              <div class="drawer-icon edit-icon"><span class="material-icons">edit_note</span></div>
              <div>
                <h2 class="drawer-title">Chỉnh sửa sân</h2>
                <p class="drawer-sub">{{ editForm.name }}</p>
              </div>
            </div>
            <button class="drawer-close" @click="closeEditDrawer"><span class="material-icons">close</span></button>
          </div>

          <div class="drawer-body">
            <div v-if="editErrors.length > 0" class="form-alert error">
              <span class="material-icons">error_outline</span>
              <ul><li v-for="e in editErrors" :key="e">{{ e }}</li></ul>
            </div>
            <div v-if="editSuccess" class="form-alert success">
              <span class="material-icons">check_circle</span>
              <span>Cập nhật sân thành công!</span>
            </div>

            <!-- Upload zone Edit (multi-image) -->
            <div class="f-upload-sec">
                <div class="flabel"><span class="material-icons">collections</span>Bộ sưu tập ảnh sân ({{ editForm.images?.length || 0 }})</div>
                
                <div class="img-grid-edit">
                    <div v-for="(img, idx) in editForm.images" :key="idx" class="img-th">
                        <img :src="img" />
                        <button class="th-del" @click="editForm.images.splice(idx,1)"><span class="material-icons">close</span></button>
                    </div>

                    <!-- Upload Button Edit -->
                    <div class="uz-small" 
                        :class="{over:editOver, loading:editUploading}"
                        @dragover.prevent="editOver=true" @dragleave.prevent="editOver=false"
                        @drop.prevent="e=>doUpload(e.dataTransfer.files[0],'edit')"
                        @click="$refs.editFile.click()">
                        <input ref="editFile" type="file" accept="image/*" hidden @change="e=>doUpload(e.target.files[0],'edit')" />
                        
                        <template v-if="editUploading">
                            <div class="uz-spin"></div>
                            <span>{{ editPct }}%</span>
                        </template>
                        <template v-else>
                            <span class="material-icons">add_a_photo</span>
                            <span class="uz-txt">Thêm ảnh</span>
                        </template>
                    </div>
                </div>

                <div class="url-input-mini">
                    <input v-model="editForm.newUrl" type="url" placeholder="Hoặc dán URL..." @keyup.enter="if(editForm.newUrl){editForm.images.push(editForm.newUrl);editForm.newUrl=''}" />
                    <button @click="if(editForm.newUrl){editForm.images.push(editForm.newUrl);editForm.newUrl=''}"><span class="material-icons">add</span></button>
                </div>
                <p v-if="editUpErr" class="err-msg">{{ editUpErr }}</p>
            </div>

            <div class="form-grid">
              <div class="field full">
                <label>Tên sân <span class="req">*</span></label>
                <input v-model="editForm.name" type="text" :class="{ invalid: editSubmitted && !editForm.name }" />
                <span class="field-error" v-if="editSubmitted && !editForm.name">Vui lòng nhập tên sân.</span>
              </div>

              <div class="field full">
                <label>Loại thể thao <span class="req">*</span></label>
                <select v-model="editForm.sportType" :class="{ invalid: editSubmitted && !editForm.sportType }">
                  <option value="" disabled>-- Chọn loại thể thao --</option>
                  <option v-for="s in SPORT_TYPES" :key="s.value" :value="s.value">{{ s.emoji }} {{ s.label }}</option>
                </select>
              </div>

              <div class="field full">
                <label>Trạng thái vận hành</label>
                <select v-model="editForm.status">
                  <option value="ACTIVE">✅ Hoạt động</option>
                  <option value="MAINTENANCE">🛠️ Đang bảo trì</option>
                  <option value="INACTIVE">🚫 Tạm nghỉ</option>
                </select>
              </div>

              <div class="field">
                <label>Vị trí</label>
                <select v-model="editForm.indoorOutdoor">
                  <option value="">-- Không rõ --</option>
                  <option value="INDOOR">🏠 Trong nhà</option>
                  <option value="OUTDOOR">☀️ Ngoài trời</option>
                </select>
              </div>

              <div class="field">
                <label>Sức chứa (người)</label>
                <input v-model.number="editForm.capacity" type="number" min="1" />
              </div>

              <div class="field full">
                <label>Mặt sân</label>
                <input v-model="editForm.surface" type="text" />
              </div>

              <div class="field full">
                <label>Mô tả</label>
                <textarea v-model="editForm.description" rows="3"></textarea>
              </div>
            </div>

            <!-- Pricing section -->
            <div class="f-upload-sec" style="margin-top:32px;">
              <div class="flabel-row">
                <div class="flabel"><span class="material-icons">payments</span>Bảng giá theo khung giờ</div>
                <div class="pricing-actions" v-if="courts.length > 1">
                   <select v-model="pricingSourceId" class="pricing-copy-select">
                      <option value="">Sao chép giá từ...</option>
                      <option v-for="oc in otherCourts" :key="oc.id" :value="oc.id">{{ oc.name }}</option>
                   </select>
                   <button class="btn-copy-price" @click="copyPricing" :disabled="!pricingSourceId" title="Sao chép giá">
                      <span class="material-icons">content_copy</span>
                   </button>
                </div>
              </div>
              <div class="pricing-rules">
                <div v-for="(p, idx) in editForm.pricings" :key="idx" class="price-rule-card">
                  <div class="pr-head">
                    <div class="pr-name">Khung giờ {{ idx + 1 }}</div>
                    <button class="pr-del" @click="editForm.pricings.splice(idx,1)"><span class="material-icons">delete</span></button>
                  </div>
                  <div class="pr-body">
                    <div class="pr-row">
                      <div class="pr-field">
                        <label>Từ ngày</label>
                        <select v-model.number="p.dayOfWeek">
                          <option :value="undefined">Tất cả các ngày</option>
                          <option :value="1">Thứ 2</option>
                          <option :value="2">Thứ 3</option>
                          <option :value="3">Thứ 4</option>
                          <option :value="4">Thứ 5</option>
                          <option :value="5">Thứ 6</option>
                          <option :value="6">Thứ 7</option>
                          <option :value="0">Chủ Nhật</option>
                        </select>
                      </div>
                      <div class="pr-field">
                        <label>Giá / Giờ</label>
                        <div class="price-input">
                          <input v-model.number="p.pricePerHour" type="number" step="1000" />
                          <span>đ</span>
                        </div>
                      </div>
                    </div>
                    <div class="pr-row">
                      <div class="pr-field">
                        <label>Từ lúc</label>
                        <input type="time" v-model="p.startTime" />
                      </div>
                      <div class="pr-field">
                        <label>Đến lúc</label>
                        <input type="time" v-model="p.endTime" />
                      </div>
                    </div>
                  </div>
                </div>
                <button class="btn-add-price" @click="editForm.pricings.push({ dayOfWeek: undefined, startTime:'05:00', endTime:'23:00', pricePerHour: 100000 })">
                  <span class="material-icons">add</span> Thêm khung giá mới
                </button>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <button class="btn-cancel" @click="closeEditDrawer">Hủy</button>
            <button class="btn-save" :disabled="editLoading" @click="submitEdit">
              <span v-if="editLoading" class="spinner"></span>
              <span class="material-icons" v-else>save</span>
              {{ editLoading ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ══════════════════════════ MODAL XÓA ═══════════════════════════════════ -->
    <transition name="fade">
      <div class="modal-overlay" v-if="showDeleteModal" @click.self="showDeleteModal = false">
        <div class="delete-modal">
          <div class="del-icon"><span class="material-icons">warning_amber</span></div>
          <h3>Xác nhận xoá</h3>
          <p>Bạn có chắc muốn xoá sân <strong>{{ deleteTarget.name }}</strong>?<br>Sân sẽ chuyển sang trạng thái không hoạt động.</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showDeleteModal = false">Hủy</button>
            <button class="btn-delete" :disabled="deleteLoading" @click="submitDelete">
              <span v-if="deleteLoading" class="spinner"></span>
              <span class="material-icons" v-else>delete_forever</span>
              {{ deleteLoading ? 'Đang xoá...' : 'Xoá sân' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import { courtService } from '@/services/court.service';
import { clubService }  from '@/services/club.service';

const SPORT_TYPES = [
  { value: 'FOOTBALL',   label: 'Bóng đá',     emoji: '⚽' },
  { value: 'BADMINTON',  label: 'Cầu lông',    emoji: '🏸' },
  { value: 'TENNIS',     label: 'Tennis',       emoji: '🎾' },
  { value: 'PICKLEBALL', label: 'Pickleball',   emoji: '🏓' },
  { value: 'BASKETBALL', label: 'Bóng rổ',     emoji: '🏀' },
  { value: 'VOLLEYBALL', label: 'Bóng chuyền',  emoji: '🏐' },
  { value: 'OTHER',      label: 'Khác',         emoji: '🏅' },
];

function freshAdd() {
  return { 
    name: '', 
    sportType: '', 
    indoorOutdoor: '', 
    capacity: '', 
    surface: '', 
    description: '', 
    images: [], 
    newUrl: '',
    pricings: [{ dayOfWeek: undefined, startTime: '05:00', endTime: '23:00', pricePerHour: 100000 }]
  };
}

export default {
  name: 'OwnerCourtsView',

  data() {
    return {
      SPORT_TYPES,
      clubs: [],
      courts: [],
      selectedClubId: '',
      searchQuery: '',
      sportFilter: 'all',
      loading: false,

      // Add
      showAddDrawer: false,
      addForm: freshAdd(),
      addSubmitted: false,
      addLoading: false,
      addErrors: [],
      addMode: 'upload',
      addOver: false,
      addPreview: null,
      addUploading: false,
      addPct: 0,
      addUpErr: '',

      // Edit
      showEditDrawer: false,
      editForm: {},
      editSubmitted: false,
      editLoading: false,
      editErrors: [],
      editSuccess: false,
      pricingSourceId: '',
      statusFilter: 'all',
      editMode: 'upload',
      editOver: false,
      editPreview: null,
      editUploading: false,
      editPct: 0,
      editUpErr: '',

      // Delete
      showDeleteModal: false,
      deleteTarget: { id: null, name: '' },
      deleteLoading: false,
    };
  },

  computed: {
    selectedClubName() {
      return this.clubs.find(c => c.id === this.selectedClubId)?.name ?? '';
    },
    otherCourts() {
      return this.courts.filter(c => c.id !== this.editForm.id);
    },
    filteredCourts() {
      return this.courts.filter(c => {
        const q = this.searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) &&
          (this.sportFilter === 'all' || c.sportType === this.sportFilter) &&
          (this.statusFilter === 'all' || c.status === this.statusFilter)
        );
      });
    },
  },

  watch: {
    'addForm.sportType'(newVal) {
      if (newVal && this.addForm.pricings && this.addForm.pricings.length <= 1) {
        // Only auto-fill if the user hasn't added multiple pricing rules yet
        this.suggestPricingFromSimilarCourt(newVal);
      }
    },
    /** Từ ClubsView: `/owner/courts?clubId=...` — cùng component, đổi query cần đổi CLB + tải sân */
    '$route.query.clubId': {
      async handler(clubId) {
        if (!this.clubs.length) return;
        if (clubId === undefined || clubId === null || clubId === '') return;
        const found = this.clubs.find((c) => String(c.id) === String(clubId));
        if (found && String(this.selectedClubId) !== String(found.id)) {
          this.selectedClubId = found.id;
          await this.fetchCourts();
        }
      },
    },
  },

  async mounted() {
    await this.fetchClubs();
  },

  methods: {
    getSportLabel(type) { return SPORT_TYPES.find(s => s.value === type)?.label ?? type; },
    getSportEmoji(type) { return SPORT_TYPES.find(s => s.value === type)?.emoji ?? '🏅'; },
    getStatusLabel(status) {
      const labels = { ACTIVE: 'Hoạt động', MAINTENANCE: 'Bảo trì', INACTIVE: 'Tạm dừng' };
      return labels[status] || status;
    },

    // ── Fetch ──────────────────────────────────────────────
    /** Ưu tiên `?clubId=` (link từ Quản lý CLB), không thì CLB đầu danh sách */
    pickClubIdFromRouteOrDefault() {
      const q = this.$route.query.clubId;
      if (q !== undefined && q !== null && String(q).trim() !== '') {
        const found = this.clubs.find((c) => String(c.id) === String(q));
        if (found) return found.id;
      }
      return this.clubs[0]?.id ?? '';
    },

    async fetchClubs() {
      try {
        const res = await clubService.Getallthedetails();
        if (res.data.success) {
          this.clubs = res.data.data ?? [];
          this.selectedClubId = this.pickClubIdFromRouteOrDefault();
          if (this.selectedClubId) await this.fetchCourts();
          else this.courts = [];
        }
      } catch (e) { console.error('fetchClubs:', e); }
    },

    async fetchCourts() {
      if (!this.selectedClubId) return;
      this.loading = true;
      this.courts = [];
      try {
        const res = await courtService.getCourts(this.selectedClubId);
        if (res.data.success) this.courts = res.data.data ?? [];
      } catch (e) { console.error('fetchCourts:', e); }
      finally { this.loading = false; }
    },

    // ── Add ────────────────────────────────────────────────
    openAddDrawer() {
      this.addForm = freshAdd();
      this.addSubmitted = false;
      this.addErrors = [];
      this.showAddDrawer = true;
      document.body.style.overflow = 'hidden';
    },
    closeAddDrawer() { this.showAddDrawer = false; document.body.style.overflow = ''; },

    async submitAdd() {
      this.addSubmitted = true;
      if (!this.addForm.name || !this.addForm.sportType) return;
      this.addLoading = true;
      this.addErrors = [];
      try {
        const p = { 
          name: this.addForm.name.trim(), 
          sportType: this.addForm.sportType,
          images: this.addForm.images
        };
        if (this.addForm.indoorOutdoor)        p.indoorOutdoor = this.addForm.indoorOutdoor;
        if (this.addForm.capacity)             p.capacity      = Number(this.addForm.capacity);
        if (this.addForm.surface?.trim())      p.surface       = this.addForm.surface.trim();
        if (this.addForm.description?.trim())  p.description   = this.addForm.description.trim();

        const res = await courtService.createCourt(this.selectedClubId, p);
        if (res.data.success) {
          const newCourtId = res.data.data.id;
          // Also save pricing for the new court
          if (this.addForm.pricings && this.addForm.pricings.length > 0) {
             const prices = this.addForm.pricings.map(pr => ({
                dayOfWeek: pr.dayOfWeek,
                startTime: pr.startTime,
                endTime:   pr.endTime,
                pricePerHour: Number(pr.pricePerHour)
             }));
             await courtService.updatePricing(newCourtId, prices);
          }

          await this.fetchCourts();
          this.closeAddDrawer();
        }
      } catch (e) {
        const fe = e.response?.data?.errors;
        this.addErrors = fe ? Object.values(fe).flat() : [e.response?.data?.message ?? 'Có lỗi xảy ra.'];
      } finally { this.addLoading = false; }
    },

    suggestPricingFromSimilarCourt(sportType) {
      // Find another court with the same sport type to suggest pricing
      const similar = this.courts.find(c => c.sportType === sportType && c.pricings?.length > 0);
      if (similar) {
         this.addForm.pricings = this.initPricings(similar.pricings);
      }
    },

    // ── Edit ───────────────────────────────────────────────
    openEditDrawer(court) {
      this.editForm = {
        id:            court.id,
        name:          court.name          ?? '',
        sportType:     court.sportType      ?? '',
        indoorOutdoor: court.indoorOutdoor  ?? '',
        capacity:      court.capacity       ?? '',
        surface:       court.surface        ?? '',
        description:   court.description    ?? '',
        status:        court.status         ?? 'ACTIVE',
        images:        court.images?.map(i => i.url) ?? [],
        newUrl:        '',
        pricings:      this.initPricings(court.pricings)
      };
      this.pricingSourceId = '';
      this.editSubmitted = false;
      this.editErrors    = [];
      this.editSuccess   = false;
      this.editMode      = 'upload';
      this.editPreview   = null;
      this.editUpErr     = '';
      this.showEditDrawer = true;
      document.body.style.overflow = 'hidden';
    },
    initPricings(existing) {
      if (!existing || existing.length === 0) {
        return [{ dayOfWeek: undefined, startTime: '05:00', endTime: '23:00', pricePerHour: 100000 }];
      }
      return existing.map(p => ({
        dayOfWeek: p.dayOfWeek ?? undefined,
        startTime: this.isoToHm(p.startTime),
        endTime:   this.isoToHm(p.endTime),
        pricePerHour: Number(p.pricePerHour)
      }));
    },
    isoToHm(iso) {
      if (!iso) return '08:00';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return typeof iso === 'string' ? iso.slice(0,5) : '08:00';
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    },
    closeEditDrawer() { this.showEditDrawer = false; document.body.style.overflow = ''; },

    async submitEdit() {
      this.editSubmitted = true;
      if (!this.editForm.name || !this.editForm.sportType) return;
      this.editLoading = true;
      this.editErrors  = [];
      this.editSuccess = false;
      try {
        const p = { 
          name: this.editForm.name.trim(), 
          sportType: this.editForm.sportType,
          images: this.editForm.images
        };
        if (this.editForm.indoorOutdoor)       p.indoorOutdoor = this.editForm.indoorOutdoor;
        if (this.editForm.capacity)            p.capacity      = Number(this.editForm.capacity);
        if (this.editForm.surface?.trim())     p.surface       = this.editForm.surface.trim();
        if (this.editForm.description?.trim()) p.description   = this.editForm.description.trim();
        if (this.editForm.status)              p.status        = this.editForm.status;

        const res = await courtService.updateCourt(this.editForm.id, p);
        if (res.data.success) {
          // Save Pricing
          const prices = this.editForm.pricings.map(pr => ({
            dayOfWeek: pr.dayOfWeek,
            startTime: pr.startTime,
            endTime:   pr.endTime,
            pricePerHour: Number(pr.pricePerHour)
          }));
          await courtService.updatePricing(this.editForm.id, prices);

          await this.fetchCourts();
          this.editSuccess = true;
          setTimeout(() => this.closeEditDrawer(), 1400);
        }
      } catch (e) {
        const fe = e.response?.data?.errors;
        this.editErrors = fe ? Object.values(fe).flat() : [e.response?.data?.message ?? 'Có lỗi xảy ra.'];
      } finally { this.editLoading = false; }
    },

    copyPricing() {
      if (!this.pricingSourceId) return;
      const source = this.courts.find(c => c.id === this.pricingSourceId);
      if (source && source.pricings) {
        this.editForm.pricings = this.initPricings(source.pricings);
        alert(`Đã sao chép bảng giá từ sân ${source.name}`);
      }
    },

    // ── Delete ─────────────────────────────────────────────
    openDeleteModal(court) {
      this.deleteTarget = { id: court.id, name: court.name };
      this.showDeleteModal = true;
    },
    async submitDelete() {
      this.deleteLoading = true;
      try {
        const res = await courtService.deleteCourt(this.deleteTarget.id);
        if (res.data.success) {
          this.courts = this.courts.filter(c => c.id !== this.deleteTarget.id);
          this.showDeleteModal = false;
        }
      } catch (e) { alert('Có lỗi xảy ra khi xoá sân.'); }
      finally { this.deleteLoading = false; }
    },

    async doUpload(file, ctx) {
      if (!file) return;
      const isAdd = ctx === 'add';
      const errKey = isAdd ? 'addUpErr' : 'editUpErr';
      const pctKey = isAdd ? 'addPct'   : 'editPct';
      const prevKey= isAdd ? 'addPreview': 'editPreview';
      const upKey  = isAdd ? 'addUploading':'editUploading';

      if (!file.type.startsWith('image/')) { this[errKey] = 'Chỉ chấp nhận file ảnh.'; return; }
      if (file.size > 5 * 1024 * 1024)    { this[errKey] = 'Ảnh tối đa 5MB.'; return; }

      this[errKey] = '';
      this[prevKey] = URL.createObjectURL(file);
      this[upKey] = true;
      this[pctKey] = 0;

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', 'court-image');

        const res = await courtService.uploadImage(fd, pct => { this[pctKey] = pct; });
        if (res.data.success) {
          const url = res.data.data.url;
          if (isAdd) this.addForm.images.push(url);
          else       this.editForm.images.push(url);
        } else {
          this[errKey] = res.data.message || 'Lỗi upload.';
        }
      } catch(e) {
        this[errKey] = 'Không thể tải ảnh lên.';
      } finally { 
        this[upKey] = false; 
        this[prevKey] = null; // Clear local object URL
      }
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

*{box-sizing:border-box;}
.courts-view{font-family:'Be Vietnam Pro',sans-serif;color:#1e293b;padding-bottom:100px;background:#f8fafc;min-height:100vh;}

/* Header */
.vheader{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding:10px 0;}
.vtitle{font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#0f172a;margin:0 0 5px;}
.vsub{font-size:15px;color:#10b981;margin:0;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:35px;}
.stat-card{background:#fff;border-radius:24px;padding:20px;display:flex;align-items:center;gap:16px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);transition:all .3s;}
.stat-card:hover{transform:translateY(-5px);box-shadow:0 20px 30px -10px rgba(0,0,0,0.1);}
.sc-icon{width:48px;height:48px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:24px;}
.sc-info{display:flex;flex-direction:column;gap:2px;}
.sc-label{font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;}
.sc-val{font-size:24px;font-weight:800;color:#0f172a;line-height:1;}

.blue .sc-icon{background:rgba(59,130,246,0.12);color:#2563eb;}
.green .sc-icon{background:rgba(34,197,94,0.12);color:#16a34a;}
.yellow .sc-icon{background:rgba(234,179,8,0.12);color:#ca8a04;}
.purple .sc-icon{background:rgba(139,92,246,0.12);color:#7c3aed;}

/* Filter Bar */
.search-bar-wrap{background:#fff;border-radius:24px;padding:8px;margin-bottom:30px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);}
.search-bar{display:flex;gap:8px;flex-wrap:wrap;}
.f-item{height:54px;background:#f8fafc;border-radius:20px;display:flex;align-items:center;padding:0 18px;gap:12px;transition:all .2s;}
.f-icon{color:#94a3b8;font-size:22px;}
.club-sel{flex:2;min-width:250px;}
.club-sel select{flex:1;border:none;background:transparent;font-family:inherit;font-size:15px;font-weight:700;color:#0f172a;cursor:pointer;}
.s-wrap{flex:3;min-width:200px;}
.s-wrap input{flex:1;border:none;background:transparent;font-family:inherit;font-size:15px;color:#1e293b;}
.sport-sel{flex:1;min-width:180px;}
.sport-sel select{flex:1;border:none;background:transparent;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;}

.f-item:focus-within{background:#fff;box-shadow:inset 0 0 0 2px #10b981;}

/* Buttons */
.btn-primary{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;border:none;height:54px;padding:0 28px;border-radius:20px;font-weight:700;font-size:15px;cursor:pointer;transition:all .3s;box-shadow:0 10px 20px -5px rgba(16,185,129,0.3);}
.btn-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 15px 25px -5px rgba(16,185,129,0.4);}
.btn-primary:disabled{opacity:0.5;cursor:not-allowed;}

/* Premium Card */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:28px;}
.premium-card{background:#fff;border-radius:32px;overflow:hidden;border:1px solid #f1f5f9;box-shadow:0 10px 40px -10px rgba(0,0,0,0.08);transition:all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);animation:fadeInUp .6s ease both;animation-delay:var(--d);display:flex;flex-direction:column;}
.premium-card:hover{transform:translateY(-10px);box-shadow:0 30px 60px -15px rgba(0,0,0,0.15);}

.c-header-sport{padding:24px;display:flex;align-items:center;gap:15px;position:relative;overflow:hidden;}
.c-header-sport::before{content:'';position:absolute;inset:0;opacity:0.1;z-index:0;}

.FOOTBALL{background:#ecfdf5;color:#065f46;}
.FOOTBALL::before{background:radial-gradient(circle at 20% 20%, #10b981 0%, transparent 50%);}
.BADMINTON{background:#f5f3ff;color:#5b21b6;}
.BADMINTON::before{background:radial-gradient(circle at 20% 20%, #8b5cf6 0%, transparent 50%);}
.TENNIS{background:#fefce8;color:#854d0e;}
.TENNIS::before{background:radial-gradient(circle at 20% 20%, #eab308 0%, transparent 50%);}
.PICKLEBALL{background:#fff7ed;color:#9a3412;}
.PICKLEBALL::before{background:radial-gradient(circle at 20% 20%, #f97316 0%, transparent 50%);}
.BASKETBALL{background:#fff7ed;color:#c2410c;}
.BASKETBALL::before{background:radial-gradient(circle at 20% 20%, #f97316 0%, transparent 50%);}
.VOLLEYBALL{background:#f0f9ff;color:#075985;}
.VOLLEYBALL::before{background:radial-gradient(circle at 20% 20%, #0ea5e9 0%, transparent 50%);}

.s-emoji{font-size:32px;z-index:1;}
.s-info{z-index:1;flex:1;}
.s-label{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:0.8;}
.s-status{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:rgba(255,255,255,0.6);border-radius:100px;font-size:11px;font-weight:700;margin-top:4px;}
.s-status .dot{width:6px;height:6px;border-radius:50%;background:#94a3b8;}
.s-status.ACTIVE{color:#059669;}
.s-status.ACTIVE .dot{background:#10b981;box-shadow:0 0 8px #10b981;}
.s-status.MAINTENANCE{color:#f59e0b;}
.s-status.MAINTENANCE .dot{background:#f59e0b;}
.s-status.INACTIVE .dot{background:#ef4444;}

.cbody{padding:24px;flex:1;display:flex;flex-direction:column;}
.c-title{font-size:20px;font-weight:800;margin:0 0 16px;color:#0f172a;}
.c-meta-row{display:flex;flex-direction:column;gap:10px;margin-bottom:20px;}
.cm-item{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:#64748b;}
.cm-item .material-icons{font-size:18px;color:#94a3b8;}
.c-desc{font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 24px;display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;}

.actions{display:flex;gap:10px;margin-top:auto;}
.abtn{flex:1;height:46px;border-radius:14px;border:none;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;}
.abtn.edit{background:#f1f5f9;color:#1e293b;}
.abtn.edit:hover{background:#e2e8f0;}
.abtn.del{flex:0 0 46px;background:#fef2f2;color:#ef4444;}
.abtn.del:hover{background:#fee2e2;}

.c-cover{height:180px;overflow:hidden;border-bottom:1px solid #f1f5f9;background:#f8fafc;}
.c-cover img{width:100%;height:100%;object-fit:cover;transition:transform 0.5s;}
.premium-card:hover .c-cover img{transform:scale(1.05);}

/* Drawer — khung lớn giữa màn, đủ rộng như vùng nội dung chính */
.drawer-overlay{
  position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(10px);z-index:9000;
  display:flex;justify-content:center;align-items:flex-start;padding:24px 16px;
  overflow-y:auto;
}
.drawer{
  width:min(1200px,calc(100vw - 32px));
  max-height:calc(100vh - 48px);
  min-height:0;
  margin:12px auto;
  height:auto;
  background:#fff;
  border-radius:20px;
  box-shadow:0 25px 80px rgba(15,23,42,0.22);
  display:flex;flex-direction:column;
  overflow:hidden;
  animation:cvSheetIn .38s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes cvSheetIn{
  from{opacity:0;transform:translateY(14px) scale(0.987);}
  to{opacity:1;transform:translateY(0) scale(1);}
}

.drawer-header{padding:28px 36px;background:linear-gradient(135deg, #1e293b, #0f172a);color:#fff;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;border-radius:20px 20px 0 0;gap:16px;}
.drawer-title-row{display:flex;align-items:center;gap:14px;min-width:0;}
.drawer-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.drawer-icon.add-icon,.drawer-icon.edit-icon{background:rgba(255,255,255,0.12);}
.drawer-title{font-size:22px;font-weight:800;margin:0;}
.drawer-sub{font-size:14px;opacity:0.7;margin:4px 0 0;}
.drawer-close{background:rgba(255,255,255,0.1);border:none;width:36px;height:36px;border-radius:10px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;}

.drawer-body{flex:1;overflow-y:auto;min-height:0;padding:36px 40px;}
.drawer-footer{flex-shrink:0;padding:22px 40px;border-top:1px solid #f1f5f9;display:flex;gap:12px;background:#fff;border-radius:0 0 20px 20px;}

/* Upload Section */
.f-upload-sec{margin-bottom:30px;}
.flabel{font-size:12px;font-weight:800;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.upload-mode-tabs{display:flex;background:#f1f5f9;padding:4px;border-radius:14px;margin-bottom:16px;gap:4px;}
.upload-mode-tabs button{flex:1;height:40px;border:none;border-radius:10px;background:transparent;color:#64748b;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .2s;}
.upload-mode-tabs button.active{background:#fff;color:#0f172a;box-shadow:0 2px 4px rgba(0,0,0,0.05);}

.uz{height:180px;border:2px dashed #e2e8f0;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;position:relative;overflow:hidden;background:#fbfcfd;}
.uz:hover{border-color:#10b981;background:#f0fdf4;}
.uz .ui-big{font-size:48px;color:#94a3b8;margin-bottom:8px;}
.uz .ul{font-size:14px;color:#475569;margin:0;}

.prev-img{width:100%;height:100%;object-fit:cover;}
.prev-ov{position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;opacity:0;transition:all .2s;gap:8px;}
.uz:hover .prev-ov{opacity:1;}

.prog-wrap{width:70%;height:6px;background:#e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:10px;}
.prog-bar{height:100%;background:#10b981;transition:width .2s;}

.url-input-wrap{display:flex;align-items:center;gap:12px;background:#f8fafc;border:2px solid #f1f5f9;border-radius:16px;padding:0 16px;margin-bottom:12px;}
.url-input-wrap input{flex:1;height:50px;border:none;background:transparent;outline:none;font-family:inherit;font-size:14px;}
.url-preview{width:100%;height:140px;object-fit:cover;border-radius:16px;border:1px solid #f1f5f9;}

/* Image Multi-Upload Gallery */
.img-grid-edit{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:12px;margin-bottom:16px;}
.img-th{width:80px;height:80px;border-radius:12px;overflow:hidden;position:relative;border:1px solid #e2e8f0;}
.img-th img{width:100%;height:100%;object-fit:cover;}
.th-del{position:absolute;top:2px;right:2px;width:20px;height:20px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.th-del .material-icons{font-size:14px;}
.th-del:hover{background:#ef4444;}

.uz-small{width:80px;height:80px;border:2px dashed #cbd5e1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#64748b;cursor:pointer;transition:all .2s;gap:4px;background:#f8fafc;}
.uz-small:hover{border-color:#10b981;color:#10b981;background:#f0fdf4;}
.uz-small.over{border-color:#10b981;background:#ecfdf5;}
.uz-small .material-icons{font-size:20px;}
.uz-txt{font-size:10px;font-weight:700;}

.uz-spin{width:20px;height:20px;border:2px solid #e2e8f0;border-top-color:#10b981;border-radius:50%;animation:spinner .8s linear infinite;}
@keyframes spinner{to{transform:rotate(360deg)}}

.url-input-mini{display:flex;gap:8px;}
.url-input-mini input{flex:1;height:44px;border:2px solid #f1f5f9;border-radius:12px;padding:0 12px;font-size:13px;background: #fbfcfd;}
.url-input-mini input:focus{border-color:#10b981;outline:none;background:#fff;}
.url-input-mini button{width:44px;height:44px;border-radius:12px;border:none;background:#10b981;color:#fff;cursor:pointer;}

/* Form */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.field{display:flex;flex-direction:column;gap:8px;}
.field.full{grid-column:1/-1;}
.field label{font-size:14px;font-weight:700;color:#475569;}
.field input, .field select, .field textarea{width:100%;padding:14px;border:2px solid #f1f5f9;border-radius:16px;font-family:inherit;font-size:14px;transition:all .2s;background:#fbfcfd;}
.field input:focus, .field select:focus, .field textarea:focus{border-color:#10b981;background:#fff;outline:none;box-shadow:0 0 0 4px rgba(16,185,129,0.1);}
.req{color:#ef4444;}
.err-msg{color:#ef4444;font-size:12px;font-weight:600;margin-top:5px;}

/* State */
.empty-glass{text-align:center;padding:100px 40px;background:white;border-radius:32px;border:2px dashed #e2e8f0;margin-top:20px;}
.empty-icon{font-size:64px;color:#cbd5e1;margin-bottom:20px;}
.empty-glass h3{font-size:20px;font-weight:800;color:#0f172a;margin:0 0 10px;}
.empty-glass p{color:#94a3b8;font-size:15px;margin:0 0 30px;}

/* Utils */
.spin{width:20px;height:20px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:loading-spin 0.8s linear infinite;}
@keyframes loading-spin{to{transform:rotate(360deg)}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)}}

/* Pricing Rules */
.pricing-rules{display:flex;flex-direction:column;gap:16px;}
.flabel-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.pricing-actions{display:flex;gap:8px;align-items:center;}
.pricing-copy-select{height:34px;border-radius:10px;border:1px solid #e2e8f0;padding:0 8px;font-size:12px;font-weight:600;color:#64748b;background:#f8fafc;}
.btn-copy-price{width:34px;height:34px;border-radius:10px;border:none;background:#ecfdf5;color:#059669;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.btn-copy-price:disabled{opacity:0.5;cursor:not-allowed;}
.btn-copy-price .material-icons{font-size:18px;}

.price-rule-card{background:#f8fafc;border-radius:20px;border:1px solid #f1f5f9;padding:20px;transition:all .2s;}
.price-rule-card:hover{border-color:#10b981;box-shadow:0 4px 12px rgba(16,185,129,0.05);}
.pr-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.pr-name{font-size:12px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;}
.pr-del{width:32px;height:32px;border-radius:8px;border:none;background:#fef2f2;color:#ef4444;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.pr-del:hover{background:#ef4444;color:#fff;}
.pr-del .material-icons{font-size:18px;}

.pr-body{display:flex;flex-direction:column;gap:16px;}
.pr-row{display:flex;gap:16px;}
.pr-field{flex:1;display:flex;flex-direction:column;gap:6px;}
.pr-field label{font-size:12px;font-weight:700;color:#64748b;}
.pr-field input, .pr-field select{height:42px;padding:0 12px;border:1px solid #e2e8f0;border-radius:12px;font-family:inherit;font-size:14px;background:#fff;}

.price-input{position:relative;}
.price-input input{width:100%;padding-right:32px;}
.price-input span{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-weight:700;color:#94a3b8;font-size:13px;}

.btn-add-price{height:50px;border:2px dashed #cbd5e1;border-radius:16px;background:transparent;color:#64748b;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .2s;margin-top:8px;}
.btn-add-price:hover{border-color:#10b981;color:#10b981;background:#f0fdf4;}
.btn-add-price .material-icons{font-size:20px;}

.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(5px);z-index:9999;display:flex;align-items:center;justify-content:center;}
.delete-modal{background:#fff;border-radius:32px;padding:40px;width:420px;text-align:center;box-shadow:0 30px 60px rgba(0,0,0,0.2);animation:popIn .4s cubic-bezier(0.16, 1, 0.3, 1);}
.del-icon{width:64px;height:64px;background:#fef2f2;color:#ef4444;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;}
.del-icon .material-icons{font-size:32px;}
.modal-actions{display:flex;gap:12px;margin-top:30px;}
.btn-cancel{height:54px;padding:0 24px;border:2px solid #f1f5f9;background:#fff;border-radius:20px;font-weight:700;color:#64748b;cursor:pointer;transition:all .2s;}
.btn-save{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;border:none;height:54px;padding:0 28px;border-radius:20px;font-weight:700;cursor:pointer;transition:all .3s;}
.btn-delete{flex:1;height:54px;border-radius:20px;border:none;background:#ef4444;color:#fff;font-weight:700;cursor:pointer;}

@media(max-width:768px){
  .grid{grid-template-columns:1fr;}
  .stats-row{grid-template-columns:1fr 1fr;}
  .drawer-overlay{padding:0;align-items:stretch;}
  .drawer{width:100%;max-width:none;max-height:none;height:100vh;margin:0;border-radius:0;}
  .drawer-header{border-radius:0;}
  .drawer-body{padding:24px 18px;}
  .drawer-footer{border-radius:0;padding:18px;}
  .f-item{flex:none;width:100%;}
}
</style>
