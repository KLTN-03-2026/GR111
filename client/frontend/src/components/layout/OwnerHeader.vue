<template>
  <header class="header-wrapper">
    <div class="header-right">
      <div class="header-notifications">
      </div>
      <time class="header-today" :datetime="todayIso">{{ todayLabel }}</time>
      <router-link
        to="/owner/settings"
        class="user-profile"
        aria-label="Mở trang cài đặt tài khoản"
      >
        <div class="user-info">
          <p class="user-name">{{ displayName }}</p>
          <p class="user-role">{{ user?.email || '—' }}</p>
        </div>
        <img
          class="user-avatar"
          :src="user?.avatarUrl || avatarUrl"
          alt=""
        />
      </router-link>
    </div>
  </header>
</template>

<script>

export default {
  name: 'OwnerHeader',
  components: {
  },
  data() {
    return {
      user: null
    }
  },
  computed: {
    displayName() {
      if (!this.user) return 'Chủ sân';
      return (
        this.user.name ||
        this.user.fullName ||
        (this.user.email ? String(this.user.email).split('@')[0] : '') ||
        'Chủ sân'
      );
    },
    avatarUrl() {
      const n = encodeURIComponent(this.displayName || 'Owner');
      return `https://ui-avatars.com/api/?name=${n}&background=16a34a&color=fff`;
    },
    /** yyyy-mm-dd cho <time datetime> */
    todayIso() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    /** Ngày hôm nay (tiếng Việt), ví dụ: Thứ Sáu, 29 tháng 4, 2026 */
    todayLabel() {
      try {
        return new Intl.DateTimeFormat('vi-VN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date());
      } catch {
        return '';
      }
    },
  },
  mounted() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (e) {
        console.error("Lỗi parse dữ liệu user:", e);
      }
    }
  }
}
</script>

<style scoped>
.header-wrapper {
  height: 80px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 30px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 999;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-today {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  line-height: 1.35;
  text-align: right;
  max-width: min(320px, 42vw);
}

.notif-btn {
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  font-size: 20px;
  color: #64748b;
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  border: 2px solid #fff;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 50px;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.user-profile:hover {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.user-profile:focus-visible {
  outline: 2px solid #16a34a;
  outline-offset: 2px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
}

.user-info {
  text-align: right;
}

.user-name {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

@media (max-width: 640px) {
  .header-today {
    font-size: 11px;
    max-width: 160px;
  }
  .user-info {
    display: none;
  }
}
</style>
