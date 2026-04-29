<template>
  <div class="clubs-view">

    <!-- Header -->
    <div class="vheader">
      <div>
        <h1 class="vtitle">Quản lý Câu lạc bộ</h1>
        <p class="vsub">Hệ thống quản lý cơ sở thể thao chuyên nghiệp.</p>
      </div>
      <button class="btn-primary" @click="openAdd">
        <span class="material-icons">add_business</span> Thêm câu lạc bộ
      </button>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card blue">
        <div class="sc-icon"><span class="material-icons">domain</span></div>
        <div class="sc-info">
          <span class="sc-label">Tổng cơ sở</span>
          <span class="sc-val">{{ clubs.length }}</span>
        </div>
        <div class="sc-chart"></div>
      </div>
      <div class="stat-card green">
        <div class="sc-icon"><span class="material-icons">bolt</span></div>
        <div class="sc-info">
          <span class="sc-label">Đang hoạt động</span>
          <span class="sc-val">{{ clubs.filter(c => c.approvalStatus === 'APPROVED').length }}</span>
        </div>
      </div>
      <div class="stat-card yellow">
        <div class="sc-icon"><span class="material-icons">hourglass_top</span></div>
        <div class="sc-info">
          <span class="sc-label">Chờ duyệt</span>
          <span class="sc-val">{{ clubs.filter(c => c.approvalStatus === 'PENDING').length }}</span>
        </div>
      </div>
      <div class="stat-card purple">
        <div class="sc-icon"><span class="material-icons">fitness_center</span></div>
        <div class="sc-info">
          <span class="sc-label">Tổng số sân</span>
          <span class="sc-val">{{ clubs.reduce((acc, c) => acc + (c.courts?.length || 0), 0) }}</span>
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="search-bar-wrap">

    <!-- Success banner after club creation -->
    <transition name="fade">
      <div v-if="successBanner" class="success-banner">
        <span class="material-icons sb-icon">check_circle</span>
        <div class="sb-body">
          <strong>✅ "​{{ successBanner.clubName }}​" đã được tạo thành công!</strong>
          <p>Bước tiếp theo để khung giờ đặt sân hiển thị cho khách:</p>
          <div class="sb-actions">
            <router-link to="/owner/courts" class="sb-btn primary">
              <span class="material-icons">add_circle</span> Thêm sân vào CLB
            </router-link>
            <router-link to="/owner/pricing" class="sb-btn">
              <span class="material-icons">attach_money</span> Thiết lập bảng giá
            </router-link>
          </div>
        </div>
        <button class="sb-close" @click="successBanner = null">
          <span class="material-icons">close</span>
        </button>
      </div>
    </transition>

      <div class="search-bar">
        <div class="s-wrap">
          <span class="material-icons s-icon">search</span>
          <input v-model="q" placeholder="Tìm theo tên hoặc địa chỉ..." />
        </div>
        <select v-model="statusQ" class="status-select">
          <option value="all">Tất cả trạng thái</option>
          <option value="APPROVED">Hoạt động</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="REJECTED">Tạm ngưng</option>
        </select>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid">
      <div v-for="n in 3" :key="n" class="card loading-card">
        <div class="sk-img"></div>
        <div class="sk-body"><div class="sk-l w60"></div><div class="sk-l w40"></div><div class="sk-l w80"></div></div>
      </div>
    </div>

    <!-- Grid -->
    <div v-else-if="list.length" class="grid">
      <div
        v-for="(c,i) in list"
        :key="c.id"
        class="card premium-card"
        :style="{ '--d': `${i * 70}ms`, '--cover-url': `url(${JSON.stringify(c.coverImageUrl || fallbackImg)})` }"
      >
        <div class="c-hero">
          <div class="c-hero-bg" aria-hidden="true"></div>
          <span class="badge-new" :class="c.approvalStatus">{{ statusLabel(c.approvalStatus) }}</span>
        </div>
        <div class="cbody">
          <div class="c-category">{{ c.city }} · {{ c.district }}</div>
          <h3 class="c-title">{{ c.name }}</h3>
          <p class="c-addr"><span class="material-icons">location_on</span>{{ c.address }}</p>
          
          <div class="c-tags">
             <div v-if="c.openingHours?.length" class="c-tag">
               <span class="material-icons">schedule</span>
               {{ fmt(c.openingHours[0].openTime) }} – {{ fmt(c.openingHours[0].closeTime) }}
             </div>
             <div v-else class="c-tag warn">
               <span class="material-icons">warning_amber</span>
               Chưa có giờ mở cửa
             </div>
             <div class="c-tag green">
               <span class="material-icons">layers</span>
               {{ c.courts?.length ?? 0 }} sân
             </div>
          </div>

          <div class="actions">
            <button class="abtn edit" @click="openEdit(c)">
              <span class="material-icons">edit</span> <span>Sửa</span>
            </button>
            <router-link :to="`/owner/courts?clubId=${c.id}`" class="abtn manage">
              <span class="material-icons">dashboard</span> <span>Quản lý sân</span>
            </router-link>
            <button class="abtn del" @click="openDel(c)">
              <span class="material-icons">delete_outline</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="empty-glass">
      <div class="empty-icon"><span class="material-icons">business_center</span></div>
      <h3>Chưa có câu lạc bộ nào</h3>
      <p>Bạn chưa sở hữu câu lạc bộ thể thao nào. Bắt đầu ngay bằng cách tạo một cơ sở mới.</p>
      <button class="btn-primary" @click="openAdd">
        <span class="material-icons">add_circle</span> Thêm ngay
      </button>
    </div>

    <!-- ═══ DRAWER ADD ═══ -->
    <transition name="slide">
      <div class="overlay" v-if="showAdd" @click.self="closeAdd">
        <div class="drawer">
          <div class="dhead add-head">
            <div class="dhead-left"><span class="material-icons dhi">add_business</span><div><b>Thêm câu lạc bộ</b><small>Điền đầy đủ thông tin bên dưới</small></div></div>
            <button class="xbtn" @click="closeAdd"><span class="material-icons">close</span></button>
          </div>
          <div class="dbody">
            <div v-if="addErr.length" class="alert err"><span class="material-icons">error</span><ul><li v-for="e in addErr" :key="e">{{e}}</li></ul></div>

            <!-- Fields -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">info</span>Thông tin cơ bản</div>
              <div class="fgrid">
                <div class="f span2">
                  <label>Tên CLB <span class="req">*</span></label>
                  <input v-model="addForm.name" :class="{inv:addSub&&!addForm.name}" placeholder="Sân bóng Thành Phát..." />
                  <small v-if="addSub&&!addForm.name" class="err-msg">Bắt buộc</small>
                </div>
                <div class="f">
                  <label>Tỉnh/Thành phố <span class="req">*</span></label>
                  <select
                    v-model="addProvinceSlug"
                    class="addr-sel"
                    :class="{inv:addSub&&!addForm.city}"
                    :disabled="vnProvincesLoading"
                    @change="onAddProvinceChange"
                  >
                    <option value="" disabled>{{ vnProvincesLoading ? 'Đang tải...' : '— Chọn tỉnh/thành —' }}</option>
                    <option v-for="p in vnProvinces" :key="p.slug" :value="p.slug">{{ p.name }}</option>
                  </select>
                  <small v-if="vnProvincesErr" class="err-msg">{{ vnProvincesErr }}</small>
                  <small v-if="vnAddDetailLoading" class="muted-msg">Đang tải quận/huyện…</small>
                </div>
                <div class="f">
                  <label>Quận/Huyện <span class="req">*</span></label>
                  <select
                    v-model="addDistrictCode"
                    class="addr-sel"
                    :class="{inv:addSub&&!addForm.district}"
                    :disabled="!vnAddDetail || vnAddDetailLoading"
                    @change="onAddDistrictChange"
                  >
                    <option value="" disabled>— Chọn quận/huyện —</option>
                    <option v-for="d in (vnAddDetail?.districts || [])" :key="d.code" :value="d.code">{{ d.name }}</option>
                  </select>
                </div>
                <div class="f span2">
                  <label>Phường/Xã</label>
                  <select v-model="addForm.ward" class="addr-sel" :disabled="!addDistrictCode">
                    <option value="">— Chọn phường/xã (tuỳ chọn) —</option>
                    <option v-for="w in addWardOptions" :key="w.code" :value="w.name">{{ w.name }}</option>
                  </select>
                </div>
                <div class="f span2">
                  <label>Địa chỉ <span class="req">*</span></label>
                  <input v-model="addForm.address" :class="{inv:addSub&&!addForm.address}" placeholder="123 Nguyễn Văn A..." />
                </div>
                <div class="f"><label>Số điện thoại</label><input v-model="addForm.phone" placeholder="0901 234 567" /></div>
                <div class="f"><label>Email</label><input v-model="addForm.email" type="email" placeholder="info@club.com" /></div>
                <div class="f span2"><label>Mô tả</label><textarea v-model="addForm.description" rows="2" placeholder="Giới thiệu về câu lạc bộ..."></textarea></div>
              </div>
            </div>

            <div class="fsec">
              <div class="flabel"><span class="material-icons">account_balance</span>Chuyển khoản (hiển thị cho khách khi thanh toán)</div>
              <p class="flabel-hint" style="margin:-6px 0 12px;font-size:13px;color:#64748b;">Khách sẽ thấy STK / ngân hàng / nội dung CK (mã đơn) trên trang thanh toán.</p>
              <div class="fgrid">
                <div class="f"><label>Ngân hàng</label><input v-model="addForm.transferBankName" placeholder="Ví dụ: VietcomBank" /></div>
                <div class="f"><label>Số tài khoản</label><input v-model="addForm.transferAccountNumber" placeholder="Số TK nhận tiền" /></div>
                <div class="f span2"><label>Chủ tài khoản</label><input v-model="addForm.transferBeneficiaryName" placeholder="Họ tên chủ TK" /></div>
                <div class="f span2">
                  <label>Ảnh mã QR (tuỳ chọn)</label>
                  <div class="url-input-wrap" style="margin-bottom:8px">
                    <span class="material-icons">link</span>
                    <input v-model="addForm.transferQrImageUrl" type="url" placeholder="https://... hoặc tải ảnh bên dưới" />
                  </div>
                  <input ref="addTransferQrFile" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="e=>uploadTransferQr(e.target.files[0],'add')" />
                  <button type="button" class="hap-btn" @click="$refs.addTransferQrFile.click()"><span class="material-icons" style="font-size:18px">qr_code_2</span> Tải ảnh QR</button>
                </div>
              </div>
            </div>

            <!-- Opening Hours section -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">schedule</span>Giờ mở cửa <span class="flabel-hint">— Bắt buộc để khung giờ đặt sân hiển thị</span></div>
              <div class="hours-apply-row">
                <span class="hap-label">Áp dụng chung:</span>
                <input type="time" v-model="addBulkOpen" class="hap-input" />
                <span>–</span>
                <input type="time" v-model="addBulkClose" class="hap-input" />
                <button class="hap-btn" @click="applyBulkHours('add')">Áp dụng tất cả ngày</button>
              </div>
              <div class="hours-list">
                <div v-for="h in addForm.openingHours" :key="h.dayOfWeek" class="hour-row" :class="{closed: h.isClosed}">
                  <div class="hr-day"><b>{{ h.label }}</b></div>
                  <div class="hr-times" v-if="!h.isClosed">
                    <input type="time" v-model="h.openTime" />
                    <span>–</span>
                    <input type="time" v-model="h.closeTime" />
                  </div>
                  <div class="hr-status" v-else>Nghỉ / Đóng cửa</div>
                  <button class="hr-toggle" :title="h.isClosed ? 'Mở cửa' : 'Đóng cửa'" @click="h.isClosed = !h.isClosed">
                    <span class="material-icons">{{ h.isClosed ? 'play_arrow' : 'block' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Cover Image (Primary) -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">image</span>Ảnh bìa câu lạc bộ (Chính)</div>
              <div class="upload-mode-tabs">
                <button :class="{active: addMode==='upload'}" @click="addMode='upload'"><span class="material-icons">cloud_upload</span> Tải lên</button>
                <button :class="{active: addMode==='url'}"    @click="addMode='url'"><span class="material-icons">link</span> Nhập URL</button>
              </div>

              <template v-if="addMode==='upload'">
                <div class="uz" :class="{over:addOver, preview:addPreview, err:addUpErr}"
                  @dragover.prevent="addOver=true" @dragleave.prevent="addOver=false"
                  @drop.prevent="e=>doUpload(e.dataTransfer.files[0],'add')"
                  @click="$refs.addFile.click()">
                  <input ref="addFile" type="file" accept="image/*" hidden @change="e=>doUpload(e.target.files[0],'add')" />
                  <template v-if="addUploading">
                    <div class="prog-wrap"><div class="prog-bar" :style="`width:${addPct}%`"></div></div>
                    <p class="uh">Đang tải lên... {{ addPct }}%</p>
                  </template>
                  <template v-else-if="addPreview">
                    <img :src="addPreview" class="prev-img" />
                    <div class="prev-ov"><span class="material-icons">photo_camera</span><span>Đổi ảnh</span></div>
                  </template>
                  <template v-else>
                    <span class="material-icons ui-big">cloud_upload</span>
                    <p class="ul">Chọn ảnh bìa chính</p>
                  </template>
                </div>
                <p v-if="addUpErr" class="err-msg">{{ addUpErr }}</p>
              </template>
              <template v-else>
                <div class="url-input-wrap">
                  <span class="material-icons">link</span>
                  <input v-model="addForm.coverImageUrl" type="url" placeholder="https://..." />
                </div>
              </template>
            </div>

            <!-- Club Gallery (multi-image) -->
            <div class="fsec">
                <div class="flabel"><span class="material-icons">collections</span>Bộ sưu tập ảnh thư viện ({{ addForm.images?.length || 0 }})</div>
                <div class="img-grid-edit">
                    <div v-for="(img, idx) in addForm.images" :key="idx" class="img-th">
                        <img :src="img" />
                        <button class="th-del" @click="addForm.images.splice(idx,1)"><span class="material-icons">close</span></button>
                    </div>
                    <div class="uz-small" :class="{over:addGalleryOver, loading:addGalleryUploading}"
                        @dragover.prevent="addGalleryOver=true" @dragleave.prevent="addGalleryOver=false"
                        @drop.prevent="e=>doUpload(e.dataTransfer.files[0],'addGallery')"
                        @click="$refs.addGalleryFile.click()">
                        <input ref="addGalleryFile" type="file" accept="image/*" hidden @change="e=>doUpload(e.target.files[0],'addGallery')" />
                        <template v-if="addGalleryUploading">
                            <div class="uz-spin"></div>
                            <span>{{ addGalleryPct }}%</span>
                        </template>
                        <template v-else>
                            <span class="material-icons">add_a_photo</span>
                            <span class="uz-txt">Thêm ảnh</span>
                        </template>
                    </div>
                </div>
                <div class="url-input-mini">
                    <input v-model="addForm.newUrl" type="url" placeholder="Hoặc dán URL ảnh thư viện..." @keyup.enter="if(addForm.newUrl){addForm.images.push(addForm.newUrl);addForm.newUrl=''}" />
                    <button @click="if(addForm.newUrl){addForm.images.push(addForm.newUrl);addForm.newUrl=''}"><span class="material-icons">add</span></button>
                </div>
            </div>

            <!-- Map -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">map</span>Vị trí trên Bản đồ</div>
              <LocationPicker 
                :lat="addForm.latitude" 
                :lng="addForm.longitude" 
                @update:location="l => { addForm.latitude = l.lat; addForm.longitude = l.lng; }" 
              />
            </div>
          </div>
          <div class="dfoot">
            <button class="btn-sec" @click="closeAdd">Hủy</button>
            <button class="btn-primary" :disabled="addLoading||addUploading" @click="submitAdd">
              <span v-if="addLoading" class="spin"></span><span class="material-icons" v-else>save</span>
              {{ addLoading ? 'Đang lưu...' : 'Thêm câu lạc bộ' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══ DRAWER EDIT ═══ -->
    <transition name="slide">
      <div class="overlay" v-if="showEdit" @click.self="closeEdit">
        <div class="drawer">
          <div class="dhead edit-head">
            <div class="dhead-left"><span class="material-icons dhi">edit_note</span><div><b>Chỉnh sửa</b><small>{{ editForm.name }}</small></div></div>
            <button class="xbtn" @click="closeEdit"><span class="material-icons">close</span></button>
          </div>
          <div class="dbody">
            <div v-if="editErr.length" class="alert err"><span class="material-icons">error</span><ul><li v-for="e in editErr" :key="e">{{e}}</li></ul></div>
            <div v-if="editOk" class="alert ok"><span class="material-icons">check_circle</span> Cập nhật thành công!</div>

            <!-- Cover Image edit (Primary) -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">image</span>Ảnh bìa câu lạc bộ (Chính)</div>
              <div class="upload-mode-tabs">
                <button :class="{active: editMode==='upload'}" @click="editMode='upload'"><span class="material-icons">cloud_upload</span> Tải lên</button>
                <button :class="{active: editMode==='url'}"    @click="editMode='url'"><span class="material-icons">link</span> Nhập URL</button>
              </div>

              <template v-if="editMode==='upload'">
                <div class="uz" :class="{over:editOver, preview:editPreview||editForm.coverImageUrl, err:editUpErr}"
                  @dragover.prevent="editOver=true" @dragleave.prevent="editOver=false"
                  @drop.prevent="e=>doUpload(e.dataTransfer.files[0],'edit')"
                  @click="$refs.editFile.click()">
                  <input ref="editFile" type="file" accept="image/*" hidden @change="e=>doUpload(e.target.files[0],'edit')" />
                  <template v-if="editUploading">
                    <div class="prog-wrap"><div class="prog-bar" :style="`width:${editPct}%`"></div></div>
                    <p class="uh">Đang tải lên... {{ editPct }}%</p>
                  </template>
                  <template v-else-if="editPreview||editForm.coverImageUrl">
                    <img :src="editPreview||editForm.coverImageUrl" class="prev-img" />
                    <div class="prev-ov"><span class="material-icons">photo_camera</span><span>Đổi ảnh</span></div>
                  </template>
                  <template v-else>
                    <span class="material-icons ui-big">cloud_upload</span>
                    <p class="ul">Chọn ảnh bìa chính</p>
                  </template>
                </div>
                <p v-if="editUpErr" class="err-msg">{{ editUpErr }}</p>
              </template>
              <template v-else>
                <div class="url-input-wrap">
                  <span class="material-icons">link</span>
                  <input v-model="editForm.coverImageUrl" type="url" placeholder="https://..." />
                </div>
              </template>
            </div>

            <!-- Club Gallery edit (multi-image) -->
            <div class="fsec">
                <div class="flabel"><span class="material-icons">collections</span>Thư viện ảnh bổ sung ({{ editForm.images?.length || 0 }})</div>
                <div class="img-grid-edit">
                    <div v-for="(img, idx) in editForm.images" :key="idx" class="img-th">
                        <img :src="img" />
                        <button class="th-del" @click="editForm.images.splice(idx,1)"><span class="material-icons">close</span></button>
                    </div>
                    <div class="uz-small" :class="{over:editGalleryOver, loading:editGalleryUploading}"
                        @dragover.prevent="editGalleryOver=true" @dragleave.prevent="editGalleryOver=false"
                        @drop.prevent="e=>doUpload(e.dataTransfer.files[0],'editGallery')"
                        @click="$refs.editGalleryFile.click()">
                        <input ref="editGalleryFile" type="file" accept="image/*" hidden @change="e=>doUpload(e.target.files[0],'editGallery')" />
                        <template v-if="editGalleryUploading">
                            <div class="uz-spin"></div>
                            <span>{{ editGalleryPct }}%</span>
                        </template>
                        <template v-else>
                            <span class="material-icons">add_a_photo</span>
                            <span class="uz-txt">Thêm ảnh</span>
                        </template>
                    </div>
                </div>
                <div class="url-input-mini">
                    <input v-model="editForm.newUrl" type="url" placeholder="Hoặc dán URL ảnh thư viện..." @keyup.enter="if(editForm.newUrl){editForm.images.push(editForm.newUrl);editForm.newUrl=''}" />
                    <button @click="if(editForm.newUrl){editForm.images.push(editForm.newUrl);editForm.newUrl=''}"><span class="material-icons">add</span></button>
                </div>
            </div>

            <!-- Fields edit -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">info</span>Thông tin cơ bản</div>
              <div class="fgrid">
                <div class="f span2"><label>Tên CLB <span class="req">*</span></label><input v-model="editForm.name" :class="{inv:editSub&&!editForm.name}" /></div>
                <div class="f">
                  <label>Tỉnh/Thành phố <span class="req">*</span></label>
                  <select
                    v-model="editProvinceSlug"
                    class="addr-sel"
                    :disabled="vnProvincesLoading"
                    @change="onEditProvinceChange"
                  >
                    <option value="" disabled>— Chọn tỉnh/thành —</option>
                    <option v-for="p in vnProvinces" :key="'e-'+p.slug" :value="p.slug">{{ p.name }}</option>
                  </select>
                  <small v-if="vnEditDetailLoading" class="muted-msg">Đang tải quận/huyện…</small>
                </div>
                <div class="f">
                  <label>Quận/Huyện <span class="req">*</span></label>
                  <select
                    v-model="editDistrictCode"
                    class="addr-sel"
                    :disabled="!vnEditDetail || vnEditDetailLoading"
                    @change="onEditDistrictChange"
                  >
                    <option value="" disabled>— Chọn quận/huyện —</option>
                    <option v-for="d in (vnEditDetail?.districts || [])" :key="'ed-'+d.code" :value="d.code">{{ d.name }}</option>
                  </select>
                </div>
                <div class="f span2">
                  <label>Phường/Xã</label>
                  <select v-model="editForm.ward" class="addr-sel" :disabled="!editDistrictCode">
                    <option value="">— Chọn phường/xã (tuỳ chọn) —</option>
                    <option v-for="w in editWardOptions" :key="'ew-'+w.code" :value="w.name">{{ w.name }}</option>
                  </select>
                </div>
                <div class="f span2"><label>Địa chỉ <span class="req">*</span></label><input v-model="editForm.address" /></div>
                <div class="f"><label>Số điện thoại</label><input v-model="editForm.phone" /></div>
                <div class="f"><label>Email</label><input v-model="editForm.email" type="email" /></div>
                <div class="f span2"><label>Mô tả</label><textarea v-model="editForm.description" rows="2"></textarea></div>
              </div>
            </div>

            <div class="fsec">
              <div class="flabel"><span class="material-icons">account_balance</span>Chuyển khoản (hiển thị cho khách khi thanh toán)</div>
              <p class="flabel-hint" style="margin:-6px 0 12px;font-size:13px;color:#64748b;">Nội dung chuyển khoản trên đơn hàng luôn là mã đơn (booking code).</p>
              <div class="fgrid">
                <div class="f"><label>Ngân hàng</label><input v-model="editForm.transferBankName" placeholder="Ví dụ: VietcomBank" /></div>
                <div class="f"><label>Số tài khoản</label><input v-model="editForm.transferAccountNumber" placeholder="Số TK nhận tiền" /></div>
                <div class="f span2"><label>Chủ tài khoản</label><input v-model="editForm.transferBeneficiaryName" placeholder="Họ tên chủ TK" /></div>
                <div class="f span2">
                  <label>Ảnh mã QR (tuỳ chọn)</label>
                  <div class="url-input-wrap" style="margin-bottom:8px">
                    <span class="material-icons">link</span>
                    <input v-model="editForm.transferQrImageUrl" type="url" placeholder="https://... hoặc tải ảnh" />
                  </div>
                  <input ref="editTransferQrFile" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="e=>uploadTransferQr(e.target.files[0],'edit')" />
                  <button type="button" class="hap-btn" @click="$refs.editTransferQrFile.click()"><span class="material-icons" style="font-size:18px">qr_code_2</span> Tải ảnh QR</button>
                </div>
              </div>
            </div>

            <!-- Opening Hours section -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">schedule</span>Giờ mở cửa <span class="flabel-hint">— Bắt buộc để khung giờ hiển thị</span></div>
              <div class="hours-apply-row">
                <span class="hap-label">Áp dụng chung:</span>
                <input type="time" v-model="editBulkOpen" class="hap-input" />
                <span>–</span>
                <input type="time" v-model="editBulkClose" class="hap-input" />
                <button class="hap-btn" @click="applyBulkHours('edit')">Áp dụng tất cả ngày</button>
              </div>
              <div class="hours-list">
                <div v-for="h in editForm.openingHours" :key="h.dayOfWeek" class="hour-row" :class="{closed: h.isClosed}">
                  <div class="hr-day"><b>{{ h.label }}</b></div>
                  <div class="hr-times" v-if="!h.isClosed">
                    <input type="time" v-model="h.openTime" />
                    <span>–</span>
                    <input type="time" v-model="h.closeTime" />
                  </div>
                  <div class="hr-status" v-else>Nghỉ / Đóng cửa</div>
                  <button class="hr-toggle" :title="h.isClosed ? 'Mở cửa' : 'Đóng cửa'" @click="h.isClosed = !h.isClosed">
                    <span class="material-icons">{{ h.isClosed ? 'play_arrow' : 'block' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Amenities section -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">room_service</span>Tiện ích miễn phí & Dịch vụ</div>
              <div v-if="amenitiesLoading" class="amen-loading">
                <span class="spin"></span> Đang tải tiện ích...
              </div>
              <div v-else class="amen-grid">
                <div v-for="a in amens" :key="a.id" class="amen-item" :class="{selected: a.isSelected}" @click="toggleAmen(a)">
                  <span class="material-icons">{{ a.icon || 'star' }}</span>
                  <div class="amen-name">{{ a.name }}</div>
                  <div class="amen-chk"><span class="material-icons">check</span></div>
                </div>
              </div>
            </div>

            <!-- Map edit -->
            <div class="fsec">
              <div class="flabel"><span class="material-icons">map</span>Vị trí trên Bản đồ</div>
              <LocationPicker 
                :lat="editForm.latitude" 
                :lng="editForm.longitude" 
                @update:location="l => { editForm.latitude = l.lat; editForm.longitude = l.lng; }" 
              />
            </div>
          </div>
          <div class="dfoot">
            <button class="btn-sec" @click="closeEdit">Hủy</button>
            <button class="btn-primary" :disabled="editLoading||editUploading||amenitiesLoading" @click="submitEdit">
              <span v-if="editLoading" class="spin"></span><span class="material-icons" v-else>save</span>
              {{ editLoading ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ═══ DELETE MODAL ═══ -->
    <transition name="fade">
      <div class="overlay center" v-if="showDel" @click.self="showDel=false">
        <div class="del-box">
          <div class="del-ico"><span class="material-icons">warning_amber</span></div>
          <h3>Xác nhận xóa</h3>
          <p>Bạn muốn xóa câu lạc bộ <strong>{{ delTarget.name }}</strong>?</p>
          <div class="del-acts">
            <button class="btn-sec" @click="showDel=false">Hủy</button>
            <button class="btn-danger" :disabled="delLoading" @click="submitDel">
              <span v-if="delLoading" class="spin"></span><span class="material-icons" v-else>delete_forever</span>
              {{ delLoading ? 'Đang xóa...' : 'Xóa' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script>
import { clubService } from '@/services/club.service';
import { addressService } from '@/services/address.service';
import LocationPicker from '@/components/common/LocationPicker.vue';

const MAX = 5 * 1024 * 1024;
const TYPES = ['image/jpeg','image/png','image/webp'];
const blank = () => ({
  name:'', city:'', district:'', ward:'', address:'', phone:'', email:'', description:'', coverImageUrl:'', images: [], newUrl: '', latitude: null, longitude: null,
  transferBankName:'', transferAccountNumber:'', transferBeneficiaryName:'', transferQrImageUrl:'',
});

export default {
  name: 'OwnerClubsView',
  components: { LocationPicker },
  data() {
    return {
      clubs: [], loading: false,
      q: '', statusQ: 'all',
      fallbackImg: 'https://images.unsplash.com/photo-1575446106012-c344f5b75e13?w=600&q=80',
      successBanner: null,

      // ADD
      showAdd: false, addForm: blank(), addSub: false, addLoading: false, addErr: [],
      addMode: 'upload', addOver: false, addPreview: null, addUploading: false, addPct: 0, addUpErr: '',
      addGalleryOver: false, addGalleryUploading: false, addGalleryPct: 0,
      addBulkOpen: '08:00', addBulkClose: '22:00',

      // EDIT
      showEdit: false, editForm: {}, editSub: false, editLoading: false, editErr: [], editOk: false,
      editMode: 'upload', editOver: false, editPreview: null, editUploading: false, editPct: 0, editUpErr: '',
      editGalleryOver: false, editGalleryUploading: false, editGalleryPct: 0,
      editBulkOpen: '08:00', editBulkClose: '22:00',

      // Amenities
      amens: [], amenitiesLoading: false,

      // DELETE
      showDel: false, delTarget: {}, delLoading: false,

      // Địa chỉ (63 tỉnh/TP + quận/huyện/xã)
      vnProvinces: [],
      vnProvincesLoading: false,
      vnProvincesErr: '',
      addProvinceSlug: '',
      addDistrictCode: '',
      vnAddDetail: null,
      vnAddDetailLoading: false,
      editProvinceSlug: '',
      editDistrictCode: '',
      vnEditDetail: null,
      vnEditDetailLoading: false,
    };
  },
  computed: {
    addWardOptions() {
      if (!this.vnAddDetail || this.addDistrictCode === '' || this.addDistrictCode === undefined) return [];
      const code = Number(this.addDistrictCode);
      const d = this.vnAddDetail.districts.find((x) => x.code === code);
      return d?.wards || [];
    },
    editWardOptions() {
      if (!this.vnEditDetail || this.editDistrictCode === '' || this.editDistrictCode === undefined) return [];
      const code = Number(this.editDistrictCode);
      const d = this.vnEditDetail.districts.find((x) => x.code === code);
      return d?.wards || [];
    },
    list() {
      const q = this.q.toLowerCase();
      return this.clubs.filter(c => {
        const ms = (c.name?.toLowerCase() || '').includes(q) || (c.address?.toLowerCase() || '').includes(q);
        const mt = this.statusQ === 'all' || c.approvalStatus === this.statusQ;
        return ms && mt;
      });
    }
  },
  mounted() {
    this.load();
    this.loadVnProvinces();
  },
  methods: {
    async loadVnProvinces() {
      this.vnProvincesLoading = true;
      this.vnProvincesErr = '';
      try {
        const r = await addressService.getProvinces();
        if (r.data?.success) this.vnProvinces = r.data.data || [];
        else this.vnProvincesErr = r.data?.message || 'Không tải được danh sách tỉnh thành.';
      } catch (e) {
        this.vnProvincesErr = e.response?.data?.message || 'Không tải được danh sách tỉnh thành. Kiểm tra kết nối backend.';
      } finally {
        this.vnProvincesLoading = false;
      }
    },

    async onAddProvinceChange() {
      const slug = this.addProvinceSlug;
      this.addForm.district = '';
      this.addForm.ward = '';
      this.addDistrictCode = '';
      this.vnAddDetail = null;
      if (!slug) {
        this.addForm.city = '';
        return;
      }
      const p = this.vnProvinces.find((x) => x.slug === slug);
      this.addForm.city = p ? p.name : '';
      this.vnAddDetailLoading = true;
      try {
        const r = await addressService.getProvinceDetail(slug);
        if (r.data?.success) this.vnAddDetail = r.data.data;
        else this.addErr = [r.data?.message || 'Không tải được đơn vị hành chính.'];
      } catch (e) {
        const msg = e.response?.data?.message || 'Không tải được quận/huyện. Thử lại sau.';
        this.addErr = [msg];
      } finally {
        this.vnAddDetailLoading = false;
      }
    },

    onAddDistrictChange() {
      const code = Number(this.addDistrictCode);
      const d = this.vnAddDetail?.districts?.find((x) => x.code === code);
      this.addForm.ward = '';
      this.addForm.district = d ? d.name : '';
    },

    async onEditProvinceChange() {
      const slug = this.editProvinceSlug;
      this.editForm.ward = '';
      this.editForm.district = '';
      this.editDistrictCode = '';
      this.vnEditDetail = null;
      if (!slug) {
        this.editForm.city = '';
        return;
      }
      const p = this.vnProvinces.find((x) => x.slug === slug);
      this.editForm.city = p ? p.name : '';
      this.vnEditDetailLoading = true;
      try {
        const r = await addressService.getProvinceDetail(slug);
        if (r.data?.success) this.vnEditDetail = r.data.data;
        else this.editErr = [r.data?.message || 'Không tải được đơn vị hành chính.'];
      } catch (e) {
        const msg = e.response?.data?.message || 'Không tải được quận/huyện.';
        this.editErr = [msg];
      } finally {
        this.vnEditDetailLoading = false;
      }
    },

    onEditDistrictChange() {
      const code = Number(this.editDistrictCode);
      const d = this.vnEditDetail?.districts?.find((x) => x.code === code);
      this.editForm.ward = '';
      this.editForm.district = d ? d.name : '';
    },

    /** Bỏ tiền tố "Thành phố"/"Tỉnh" để khớp tên lưu trong DB với open-api */
    normalizeVnAdminName(s) {
      if (!s) return '';
      return String(s)
        .trim()
        .replace(/^thành phố\s+/iu, '')
        .replace(/^tỉnh\s+/iu, '')
        .replace(/^tp\.?\s+/iu, '')
        .trim();
    },

    findProvinceByStoredCity(city) {
      const raw = (city || '').trim();
      if (!raw) return null;
      const norm = this.normalizeVnAdminName(raw);
      return (
        this.vnProvinces.find((x) => x.name === raw) ||
        this.vnProvinces.find((x) => this.normalizeVnAdminName(x.name) === norm) ||
        this.vnProvinces.find((x) => raw.includes(x.name) || x.name.includes(raw)) ||
        (norm &&
          this.vnProvinces.find(
            (x) =>
              norm.includes(this.normalizeVnAdminName(x.name)) ||
              this.normalizeVnAdminName(x.name).includes(norm)
          ))
      );
    },

    findDistrictByStoredName(districts, district) {
      const raw = (district || '').trim();
      if (!raw || !districts?.length) return null;
      const norm = this.normalizeVnAdminName(raw);
      return (
        districts.find((di) => di.name === raw) ||
        districts.find((di) => this.normalizeVnAdminName(di.name) === norm) ||
        districts.find((di) => raw.includes(di.name) || di.name.includes(raw))
      );
    },

    async hydrateEditAddressSelectors() {
      if (!this.vnProvinces.length) await this.loadVnProvinces();
      const city = (this.editForm.city || '').trim();
      if (!city) return;
      const p = this.findProvinceByStoredCity(city);
      if (!p) return;
      this.editProvinceSlug = p.slug;
      this.vnEditDetailLoading = true;
      try {
        const r = await addressService.getProvinceDetail(p.slug);
        if (r.data?.success) {
          this.vnEditDetail = r.data.data;
          const dist = (this.editForm.district || '').trim();
          if (dist) {
            const d = this.findDistrictByStoredName(this.vnEditDetail.districts, dist);
            if (d) this.editDistrictCode = String(d.code);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.vnEditDetailLoading = false;
      }
    },

    statusLabel(s) { return {APPROVED:'Hoạt động',PENDING:'Chờ duyệt',REJECTED:'Tạm ngưng'}[s] || s; },
    fmt(t) {
      if (!t) return '--:--';
      // If ISO string (e.g. "1970-01-01T16:00:00.000Z"), extract UTC HH:MM directly
      if (typeof t === 'string') {
        const m = t.match(/(\d{2}):(\d{2})/);
        if (m) return `${m[1]}:${m[2]}`;
      }
      return '--:--';
    },

    async load() {
      this.loading = true;
      try { const r = await clubService.Getallthedetails(); if (r.data.success) this.clubs = r.data.data || []; }
      catch(e) { console.error(e); }
      finally { this.loading = false; }
    },

    // ── UPLOAD ────────────────────────────────────────────────
    async doUpload(file, ctx) {
      if (!file) return;
      const isAdd = ctx === 'add';
      const isGallery = ctx.includes('Gallery');
      
      let errKey, pctKey, prevKey, upKey;
      
      if (isGallery) {
        const type = ctx.startsWith('add') ? 'addGallery' : 'editGallery';
        errKey = type + 'Err'; pctKey = type + 'Pct'; upKey = type + 'Uploading'; prevKey = 'dummy';
      } else {
        errKey = isAdd ? 'addUpErr' : 'editUpErr';
        pctKey = isAdd ? 'addPct'   : 'editPct';
        prevKey= isAdd ? 'addPreview': 'editPreview';
        upKey  = isAdd ? 'addUploading':'editUploading';
      }

      if (!TYPES.includes(file.type)) { this[errKey] = 'Chỉ chấp nhận JPG, PNG, WEBP.'; return; }
      if (file.size > MAX)            { this[errKey] = 'File vượt quá 5MB.'; return; }

      this[errKey] = '';
      if (!isGallery) this[prevKey] = URL.createObjectURL(file);
      this[upKey] = true;
      this[pctKey] = 0;

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', isGallery ? 'club-gallery' : 'club-cover');
        if (!isAdd && !isGallery && this.editForm.id) fd.append('entityId', this.editForm.id);

        const res = await clubService.uploadImage(fd, pct => { this[pctKey] = pct; });
        if (res.data.success) {
          const url = res.data.data.url;
          if (isGallery) {
            if (ctx.startsWith('add')) this.addForm.images.push(url);
            else                       this.editForm.images.push(url);
          } else {
            if (isAdd) this.addForm.coverImageUrl = url;
            else       this.editForm.coverImageUrl = url;
          }
        } else {
          this[errKey] = res.data.message || 'Upload thất bại.';
          if (!isGallery) this[prevKey] = null;
        }
      } catch(e) {
        this[errKey] = e.response?.data?.message || e.message || 'Upload thất bại.';
        if (!isGallery) this[prevKey] = null;
      } finally { this[upKey] = false; }
    },

    // ── ADD ───────────────────────────────────────────────────
    openAdd() {
      this.addForm = { ...blank(), openingHours: this.initHours([]) }; 
      this.addSub = false; this.addErr = [];
      this.addPreview = null; this.addUpErr = ''; this.addMode = 'upload';
      this.addProvinceSlug = '';
      this.addDistrictCode = '';
      this.vnAddDetail = null;
      this.showAdd = true; document.body.style.overflow = 'hidden';
    },
    closeAdd() { this.showAdd = false; document.body.style.overflow = ''; },
    async submitAdd() {
      this.addSub = true;
      if (!this.addForm.name || !this.addForm.city || !this.addForm.district || !this.addForm.address) return;
      this.addLoading = true; this.addErr = [];
      try {
        const r = await clubService.addClub(this.buildPayload(this.addForm));
        if (r.data.success) { 
          const newClub = r.data.data;
          if (this.addForm.openingHours?.length) {
            const hrs = this.addForm.openingHours.map(h => ({
              dayOfWeek: h.dayOfWeek, openTime: h.openTime,
              closeTime: h.closeTime, isClosed: h.isClosed
            }));
            await clubService.updateOpeningHours(newClub.id, hrs);
          }
          this.closeAdd();
          this.successBanner = { clubId: newClub.id, clubName: newClub.name };
          this.load();
        }
      } catch(e) {
        const fe = e.response?.data?.errors;
        this.addErr = fe ? Object.values(fe).flat() : [e.response?.data?.message || 'Có lỗi xảy ra.'];
      } finally { this.addLoading = false; }
    },

    applyBulkHours(ctx) {
      const open  = ctx === 'add' ? this.addBulkOpen  : this.editBulkOpen;
      const close = ctx === 'add' ? this.addBulkClose : this.editBulkClose;
      const hours = ctx === 'add' ? this.addForm.openingHours : this.editForm.openingHours;
      if (!hours) return;
      hours.forEach(h => { if (!h.isClosed) { h.openTime = open; h.closeTime = close; } });
    },

    // ── EDIT ──────────────────────────────────────────────────
    openEdit(c) {
      this.editForm = { 
        id:c.id, name:c.name||'', city:c.city||'', district:c.district||'', ward:c.ward||'',
        address:c.address||'', phone:c.phone||'', email:c.email||'',
        description:c.description||'', coverImageUrl:c.coverImageUrl||'',
        latitude: c.latitude || null, longitude: c.longitude || null,
        images: c.images?.map(i => i.url) || [],
        newUrl: '',
        transferBankName: c.transferBankName || '',
        transferAccountNumber: c.transferAccountNumber || '',
        transferBeneficiaryName: c.transferBeneficiaryName || '',
        transferQrImageUrl: c.transferQrImageUrl || '',
        openingHours: this.initHours(c.openingHours)
      };
      this.editSub = false; this.editErr = []; this.editOk = false;
      this.editPreview = null; this.editUpErr = ''; this.editMode = 'upload';
      this.editProvinceSlug = '';
      this.editDistrictCode = '';
      this.vnEditDetail = null;
      this.showEdit = true; document.body.style.overflow = 'hidden';
      this.loadAmenities(c.id);
      this.$nextTick(() => this.hydrateEditAddressSelectors());
    },
    initHours(existing) {
      const days = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ Nhật'];
      return [1,2,3,4,5,6,0].map(d => {
        const found = existing?.find(h => h.dayOfWeek === d);
        return {
          dayOfWeek: d,
          label: days[d === 0 ? 6 : d - 1],
          openTime: found ? this.isoToHm(found.openTime) : '08:00',
          closeTime: found ? this.isoToHm(found.closeTime) : '22:00',
          isClosed: found ? !!found.isClosed : false
        };
      });
    },
    isoToHm(iso) {
      if (!iso) return '08:00';
      // Extract HH:MM from ISO string directly to avoid timezone conversion
      if (typeof iso === 'string') {
        const m = iso.match(/(\d{2}):(\d{2})/);
        if (m) return `${m[1]}:${m[2]}`;
      }
      return '08:00';
    },
    async loadAmenities(clubId) {
      this.amenitiesLoading = true;
      try {
        const r = await clubService.getClubAmenities(clubId);
        if (r.data.success) this.amens = r.data.data || [];
      } catch(e) { console.error('loadAmenities fail:', e); }
      finally { this.amenitiesLoading = false; }
    },
    toggleAmen(a) { a.isSelected = !a.isSelected; },
    closeEdit() { this.showEdit = false; document.body.style.overflow = ''; },
    async submitEdit() {
      this.editSub = true;
      if (!this.editForm.name || !this.editForm.city || !this.editForm.district || !this.editForm.address) return;
      this.editLoading = true; this.editErr = []; this.editOk = false;
      try {
        const r = await clubService.editClub(this.editForm.id, this.buildPayload(this.editForm));
        if (r.data.success) {
          // Save amenities
          const sel = this.amens.filter(a => a.isSelected).map(a => ({ amenityId: a.id, price: a.price || 0 }));
          await clubService.updateClubAmenities(this.editForm.id, sel);

          // Save opening hours
          const hrs = this.editForm.openingHours.map(h => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed
          }));
          await clubService.updateOpeningHours(this.editForm.id, hrs);

          const idx = this.clubs.findIndex(c => c.id === this.editForm.id);
          if (idx !== -1) {
            this.clubs[idx] = { ...this.clubs[idx], ...r.data.data };
          }
          
          this.editOk = true;
          setTimeout(() => this.closeEdit(), 1200);
          this.load(); // Refresh to get all updated relations
        }
      } catch(e) {
        const fe = e.response?.data?.errors;
        this.editErr = fe ? Object.values(fe).flat() : [e.response?.data?.message || 'Có lỗi xảy ra.'];
      } finally { this.editLoading = false; }
    },

    // ── DELETE ────────────────────────────────────────────────
    openDel(c) { this.delTarget = { id:c.id, name:c.name }; this.showDel = true; },
    async submitDel() {
      this.delLoading = true;
      try {
        const r = await clubService.deleteClub(this.delTarget.id);
        if (r.data.success) { this.clubs = this.clubs.filter(c => c.id !== this.delTarget.id); this.showDel = false; }
      } catch(e) { alert('Xóa thất bại.'); }
      finally { this.delLoading = false; }
    },

    buildPayload(f) {
      const p = {};
      ['name','city','district','ward','address','phone','email','description','coverImageUrl','images','latitude','longitude']
        .forEach(k => { if (f[k] !== undefined && f[k] !== '') p[k] = f[k]; });
      ['transferBankName','transferAccountNumber','transferBeneficiaryName','transferQrImageUrl'].forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(f, k)) p[k] = f[k] ? f[k] : null;
      });
      return p;
    },

    async uploadTransferQr(file, mode) {
      if (!file) return;
      if (!TYPES.includes(file.type)) { alert('Chỉ chấp nhận JPG, PNG, WEBP.'); return; }
      if (file.size > MAX) { alert('File vượt quá 5MB.'); return; }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'club-transfer-qr');
      if (mode === 'edit' && this.editForm.id) fd.append('entityId', this.editForm.id);
      try {
        const res = await clubService.uploadImage(fd);
        if (res.data.success) {
          const url = res.data.data.url;
          if (mode === 'add') this.addForm.transferQrImageUrl = url;
          else this.editForm.transferQrImageUrl = url;
        } else {
          alert(res.data.message || 'Upload thất bại.');
        }
      } catch (e) {
        alert(e.response?.data?.message || e.message || 'Upload thất bại.');
      }
    },
    addPreviewFromUrl() { /* preview handled by v-if */ },
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

*{box-sizing:border-box;}
.clubs-view{font-family:'Be Vietnam Pro',sans-serif;color:#1e293b;padding-bottom:100px;background:#f8fafc;min-height:100vh;}

/* Header */
.vheader{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding:10px 0;}
.vtitle{font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#0f172a;margin:0 0 5px;}
.vsub{font-size:15px;color:#64748b;margin:0;font-weight:500;}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:35px;}
.stat-card{background:#fff;border-radius:24px;padding:24px;display:flex;align-items:center;gap:20px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);transition:all .3s;}
.stat-card:hover{transform:translateY(-5px);box-shadow:0 20px 30px -10px rgba(0,0,0,0.1);}
.sc-icon{width:56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;}
.sc-icon span{font-size:30px;}
.sc-info{display:flex;flex-direction:column;gap:3px;}
.sc-label{font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;}
.sc-val{font-size:28px;font-weight:800;color:#0f172a;line-height:1;}

.blue .sc-icon{background:rgba(59,130,246,0.12);color:#2563eb;}
.green .sc-icon{background:rgba(34,197,94,0.12);color:#16a34a;}
.yellow .sc-icon{background:rgba(234,179,8,0.12);color:#ca8a04;}
.purple .sc-icon{background:rgba(139,92,246,0.12);color:#7c3aed;}

/* Search */
.search-bar-wrap{background:#fff;border-radius:24px;padding:8px;margin-bottom:30px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);}
.search-bar{display:flex;gap:8px;}
.s-wrap{flex:1;position:relative;}
.s-icon{position:absolute;left:18px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:22px;}
.s-wrap input{width:100%;height:54px;padding:0 20px 0 52px;border:none;border-radius:20px;font-family:inherit;font-size:15px;background:#f8fafc;transition:all .2s;}
.s-wrap input:focus{background:#fff;box-shadow:inset 0 0 0 2px #22c55e;}
.status-select{width:180px;height:54px;border:none;border-radius:20px;background:#f8fafc;padding:0 15px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;}

/* Buttons */
.btn-primary{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;border:none;height:54px;padding:0 28px;border-radius:20px;font-weight:700;font-size:15px;cursor:pointer;transition:all .3s;box-shadow:0 10px 20px -5px rgba(16,185,129,0.3);}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 15px 25px -5px rgba(16,185,129,0.4);}

/* Premium Card — hero ~40% chiều cao qua aspect-ratio; thân co theo nội dung (không cắt nút) */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:28px;align-items:stretch;}
.premium-card{
  position:relative;
  isolation:isolate;
  background:#fff;
  border-radius:32px;
  overflow:hidden;
  border:1px solid #f1f5f9;
  box-shadow:0 10px 40px -10px rgba(0,0,0,0.08);
  transition:all .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation:fadeInUp .6s ease both;
  animation-delay:var(--d);
  display:flex;
  flex-direction:column;
  width:100%;
  min-height:360px;
  height:auto;
}
.c-hero{
  position:relative;
  flex:0 0 auto;
  width:100%;
  aspect-ratio:5 / 2;
  min-height:140px;
  max-height:min(220px,40vh);
  display:flex;
  flex-direction:column;
  overflow:hidden;
  border-bottom:1px solid #f1f5f9;
}
.c-hero-bg{
  position:absolute;
  inset:0;
  background-image:var(--cover-url);
  background-size:cover;
  background-position:center;
  border-radius:32px 32px 0 0;
}
.premium-card:hover{transform:translateY(-10px) scale(1.02);box-shadow:0 30px 60px -15px rgba(0,0,0,0.15);}

.badge-new{position:absolute;top:16px;right:16px;z-index:2;padding:6px 14px;border-radius:14px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;backdrop-filter:blur(8px);}
.badge-new.APPROVED{background:rgba(34,197,94,0.85);color:#fff;}
.badge-new.PENDING{background:rgba(234,179,8,0.85);color:#fff;}
.badge-new.REJECTED{background:rgba(239,68,68,0.85);color:#fff;}

.cbody{position:relative;z-index:1;flex:1 1 auto;padding:24px;background:#fff;}
.c-category{font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;}
.c-title{font-size:20px;font-weight:800;margin:0 0 10px;color:#0f172a;}
.c-addr{display:flex;align-items:center;gap:6px;font-size:14px;color:#64748b;font-weight:500;margin-bottom:18px;}
.c-addr .material-icons{font-size:18px;color:#94a3b8;}

.c-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;}
.c-tag{display:flex;align-items:center;gap:6px;padding:6px 12px;background:#f1f5f9;border-radius:10px;font-size:12px;font-weight:700;color:#475569;}
.c-tag .material-icons{font-size:16px;}
.c-tag.green{background:#ecfdf5;color:#059669;}

.actions{display:flex;gap:10px;}
.abtn{flex:1;height:46px;border-radius:14px;border:none;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;}
.abtn.edit{background:#f1f5f9;color:#1e293b;}
.abtn.edit:hover{background:#e2e8f0;}
.abtn.manage{flex:2;background:#0f172a;color:#fff;}
.abtn.manage:hover{background:#1e293b;}
.abtn.del{flex:0 0 46px;background:#fef2f2;color:#ef4444;}
.abtn.del:hover{background:#fee2e2;}

/* Drawer — khung lớn giữa màn (giống vùng nội dung chính), không còn strip hẹp */
.overlay{
  position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(10px);z-index:9000;
  display:flex;justify-content:center;align-items:flex-start;padding:24px 16px;
  overflow-y:auto;
}
.drawer{
  width:min(1200px,calc(100vw - 32px));
  max-height:calc(100vh - 48px);
  min-height:0;
  margin:12px auto;
  background:#fff;
  border-radius:20px;
  box-shadow:0 25px 80px rgba(15,23,42,0.22);
  display:flex;flex-direction:column;
  overflow:hidden;
  animation:sheetIn .38s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes sheetIn{
  from{opacity:0;transform:translateY(14px) scale(0.987);}
  to{opacity:1;transform:translateY(0) scale(1);}
}

.dhead{padding:28px 36px;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;border-radius:20px 20px 0 0;}
.add-head{background:linear-gradient(135deg, #10b981, #059669);color:#fff;}
.edit-head{background:linear-gradient(135deg, #1e293b, #0f172a);color:#fff;}
.dhead-left b{font-size:22px;font-weight:800;display:block;}
.dhead-left small{opacity:0.8;font-size:14px;}

.dbody{flex:1;overflow-y:auto;min-height:0;padding:36px 40px;}
.fsec{margin-bottom:32px;}
.flabel{font-size:12px;font-weight:800;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;margin-bottom:16px;display:flex;align-items:center;gap:8px;}

/* Amenity Grid */
.amen-grid{display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:12px;}
.amen-item{padding:16px 12px;border-radius:18px;border:2px solid #f1f5f9;text-align:center;cursor:pointer;transition:all .2s;position:relative;}
.amen-item .material-icons{font-size:24px;margin-bottom:8px;color:#94a3b8;}
.amen-name{font-size:12px;font-weight:700;color:#64748b;}
.amen-chk{position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:50%;background:#22c55e;color:#fff;display:none;align-items:center;justify-content:center;font-size:12px;scale:0;}
.amen-item.selected{border-color:#22c55e;background:#f0fdf4;}
.amen-item.selected .material-icons{color:#16a34a;}
.amen-item.selected .amen-name{color:#166534;}
.amen-item.selected .amen-chk{display:flex;scale:1;animation:popIn .3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;}

@keyframes popIn{from{scale:0} to{scale:1}}

/* Form fields */
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.f label{font-size:14px;font-weight:700;color:#475569;margin-bottom:8px;display:block;}
.f input, .f textarea, .f select.addr-sel{width:100%;padding:14px 16px;border:2px solid #f1f5f9;border-radius:16px;font-family:inherit;font-size:14px;transition:all .2s;background:#f8fafc;}
.f input:focus, .f textarea:focus, .f select.addr-sel:focus{border-color:#10b981;background:#fff;outline:none;box-shadow:0 0 0 4px rgba(16,185,129,0.1);}
.f select.addr-sel{cursor:pointer;appearance:auto;}
.muted-msg{display:block;margin-top:6px;font-size:12px;color:#64748b;}
.f.span2{grid-column: span 2;}

.upload-mode-tabs{display:flex;background:#f1f5f9;padding:4px;border-radius:14px;margin-bottom:16px;gap:4px;}
.upload-mode-tabs button{flex:1;height:40px;border:none;border-radius:10px;background:transparent;color:#64748b;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .2s;}
.upload-mode-tabs button.active{background:#fff;color:#0f172a;box-shadow:0 2px 4px rgba(0,0,0,0.05);}
.upload-mode-tabs button .material-icons{font-size:18px;}

.uz{height:200px;border:2px dashed #e2e8f0;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .3s;position:relative;overflow:hidden;background:#fbfcfd;}
.uz:hover{border-color:#10b981;background:#f0fdf4;}
.uz.over{border-color:#10b981;background:#ecfdf5;transform:scale(1.02);}
.uz .ui-big{font-size:48px;color:#94a3b8;margin-bottom:10px;}
.uz .ul{font-size:14px;color:#475569;margin:0;}
.uz .uh{font-size:12px;color:#94a3b8;margin:4px 0 0;}

.prev-img{width:100%;height:100%;object-fit:cover;}
.prev-ov{position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;opacity:0;transition:all .2s;gap:8px;}
.uz:hover .prev-ov{opacity:1;}
.prev-ov span:last-child{font-weight:700;font-size:13px;}

.prog-wrap{width:80%;height:6px;background:#e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:10px;}
.prog-bar{height:100%;background:#10b981;transition:width .2s;}

.url-input-wrap{display:flex;align-items:center;gap:12px;background:#f8fafc;border:2px solid #f1f5f9;border-radius:16px;padding:0 16px;margin-bottom:12px;}
.url-input-wrap input{flex:1;height:50px;border:none;background:transparent;outline:none;font-family:inherit;font-size:14px;}
.url-preview{width:100%;height:160px;object-fit:cover;border-radius:16px;border:1px solid #f1f5f9;margin-bottom:12px;}

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

.dfoot{flex-shrink:0;padding:22px 40px;background:#fff;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:12px;box-shadow:0 -10px 20px rgba(0,0,0,0.02);border-radius:0 0 20px 20px;}
.btn-sec{height:54px;padding:0 24px;border:2px solid #f1f5f9;background:#fff;border-radius:20px;font-weight:700;color:#64748b;cursor:pointer;transition:all .2s;}
.btn-sec:hover{background:#f8fafc;border-color:#e2e8f0;color:#1e293b;}

.xbtn{width:40px;height:40px;border-radius:12px;border:none;background:rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.xbtn:hover{background:rgba(255,255,255,0.3);transform:rotate(90deg);}

.err-msg{color:#ef4444;font-size:12px;font-weight:600;margin-top:4px;}
.alert{padding:16px;border-radius:16px;margin-bottom:24px;display:flex;gap:12px;font-size:14px;font-weight:600;}
.alert.err{background:#fef2f2;color:#991b1b;}
.alert.ok{background:#f0fdf4;color:#166534;}
.alert ul{margin:0;padding-left:20px;}

.del-box{width:400px;background:#fff;border-radius:32px;padding:40px;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);animation:popIn .4s cubic-bezier(0.16, 1, 0.3, 1);}
.del-ico{width:80px;height:80px;background:#fef2f2;color:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:40px;}
.del-ico span{font-size:48px;}
.del-box h3{font-size:20px;font-weight:800;color:#0f172a;margin:0 0 12px;}
.del-box p{color:#64748b;margin:0 0 32px;}
.del-acts{display:flex;gap:12px;}
.del-acts button{flex:1;}
.btn-danger{background:#ef4444;color:#fff;border:none;height:54px;border-radius:20px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .3s;}
.btn-danger:hover{background:#dc2626;transform:translateY(-2px);box-shadow:0 10px 15px -3px rgba(239,68,68,0.3);}

/* Animations */
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)}}

.amen-loading{padding:40px;text-align:center;color:#64748b;font-weight:600;}

/* Hour Rows */
.hours-list{display:flex;flex-direction:column;gap:12px;}
.hour-row{display:flex;align-items:center;gap:16px;padding:12px 16px;background:#f8fafc;border-radius:16px;border:1px solid #f1f5f9;transition:all .2s;}
.hour-row.closed{opacity:0.6;background:#f1f5f9;}
.hr-day{width:100px;font-size:14px;color:#0f172a;}
.hr-times{flex:1;display:flex;align-items:center;gap:8px;}
.hr-times input{width:110px;height:38px;padding:0 10px;border:1px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;}
.hr-status{flex:1;font-size:13px;color:#94a3b8;font-style:italic;}
.hr-toggle{width:38px;height:38px;border-radius:10px;border:none;background:#fff;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.05);}
.hour-row.closed .hr-toggle{background:#0f172a;color:#fff;}
.hour-row.closed .hr-toggle:hover{background:#1e293b;}

.spin{width:20px;height:20px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:loading-spin 0.8s linear infinite;}
@keyframes loading-spin{to{transform:rotate(360deg)}}

/* Hour Apply-all row */
.hours-apply-row{display:flex;align-items:center;gap:10px;background:#eff6ff;border:1.5px solid #dbeafe;border-radius:12px;padding:10px 14px;margin-bottom:10px;flex-wrap:wrap;}
.hap-label{font-size:13px;font-weight:700;color:#1d4ed8;white-space:nowrap;}
.hap-input{height:36px;padding:0 10px;border:1.5px solid #bfdbfe;border-radius:8px;font-size:13px;background:#fff;width:90px;font-family:inherit;}
.hap-input:focus{outline:none;border-color:#3b82f6;}
.hap-btn{margin-left:auto;background:#3b82f6;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:.2s;white-space:nowrap;}
.hap-btn:hover{background:#2563eb;transform:translateY(-1px);}

/* Label hint */
.flabel-hint{font-size:11px;font-weight:600;color:#f59e0b;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:2px 7px;margin-left:8px;}

/* Warning tag on card */
.c-tag.warn{background:#fff7ed;color:#c2410c;border-color:#fed7aa;}
.c-tag.warn .material-icons{color:#f97316;}

/* Success banner */
.success-banner{display:flex;align-items:flex-start;gap:16px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:20px;padding:20px 24px;margin-bottom:24px;position:relative;}
.sb-icon{color:#16a34a;font-size:32px;flex-shrink:0;}
.sb-body strong{display:block;font-size:15px;color:#15803d;margin-bottom:4px;}
.sb-body p{font-size:13px;color:#64748b;margin:0 0 12px;}
.sb-actions{display:flex;gap:10px;flex-wrap:wrap;}
.sb-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;transition:.2s;background:#dcfce7;color:#15803d;border:1.5px solid #86efac;}
.sb-btn:hover{background:#bbf7d0;transform:translateY(-1px);}
.sb-btn.primary{background:#16a34a;color:#fff;border-color:#15803d;}
.sb-btn.primary:hover{background:#15803d;}
.sb-close{position:absolute;top:12px;right:12px;background:transparent;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;}
.sb-close:hover{color:#1e293b;}

/* Responsive */
@media(max-width:768px){
  .grid{grid-template-columns:1fr;}
  .stats-row{grid-template-columns:1fr 1fr;}
  .overlay{padding:0;align-items:stretch;}
  .drawer{width:100%;max-width:none;max-height:none;height:100vh;margin:0;border-radius:0;}
  .dhead{border-radius:0;}
  .dbody{padding:24px 18px;}
  .dfoot{border-radius:0;padding:18px;}
}
</style>