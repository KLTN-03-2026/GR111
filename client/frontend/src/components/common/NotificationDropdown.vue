<template>
  <div class="notification-container" ref="dropdownRef">
    <button class="notif-trigger" :class="theme" @click="toggleDropdown">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <transition name="dropdown-fade">
      <div v-if="isOpen" class="notif-dropdown">
        <div class="notif-header">
          <h3>Thông báo</h3>
          <button v-if="unreadCount > 0" class="mark-all-btn" @click="markAllAsRead">
            Đánh dấu đã đọc tất cả
          </button>
        </div>
        
        <div class="notif-body">
          <div v-if="loading" class="notif-loading">Đang tải...</div>
          <div v-else-if="notifications.length === 0" class="notif-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>Không có thông báo nào</p>
          </div>
          
          <template v-else>
            <div 
              v-for="item in notifications" 
              :key="item.id" 
              class="notif-item" 
              :class="{ 'unread': !item.isRead }"
              @click="handleNotificationClick(item)"
            >
              <div class="notif-icon-wrapper" :class="getIconClass(item.type)">
                <svg v-if="['BOOKING_CONFIRMED', 'PAYMENT_SUCCESS', 'PROMOTION'].includes(item.type)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <svg v-else-if="['BOOKING_CANCELLED', 'PAYMENT_FAILED'].includes(item.type)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div class="notif-content">
                <h4 class="notif-title">{{ item.title }}</h4>
                <p class="notif-message">{{ item.body }}</p>
                <span class="notif-time">{{ formatTime(item.createdAt) }}</span>
              </div>
              <div v-if="!item.isRead" class="unread-dot"></div>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import NotificationService from '@/services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default {
  name: 'NotificationDropdown',
  props: {
    theme: {
      type: String,
      default: 'light' // 'light' | 'dark'
    }
  },
  data() {
    return {
      isOpen: false,
      notifications: [],
      loading: true,
      pollingInterval: null
    };
  },
  computed: {
    unreadCount() {
      return this.notifications.filter(n => !n.isRead).length;
    }
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.fetchNotifications();
      }
    },
    async fetchNotifications() {
      try {
        const data = await NotificationService.getMyNotifications();
        this.notifications = data || [];
      } catch (error) {
        console.error("Failed to fetch notifications", error);
        this.notifications = [];
      } finally {
        this.loading = false;
      }
    },
    async markAllAsRead() {
      try {
        this.loading = true;
        await NotificationService.markAsRead();
        // Cập nhật local nhanh
        this.notifications.forEach(n => n.isRead = true);
        // Hoặc refetch để chắc chắn đồng bộ:
        // await this.fetchNotifications();
        } catch (error) {
          console.error("Failed to mark all as read:", error);
        } finally {
          this.loading = false;
      }
    },
    async handleNotificationClick(item) {
      if (!item.isRead) {
        try {
          await NotificationService.markAsRead(item.id);
          item.isRead = true;
          // decrease unread count locally via reactivity
        } catch (error) {
          console.error("Failed to mark as read:", error);
        }
      }
      
      // Navigate to booking if needed
      if (item.bookingId) {
        this.$router.push(`/order?id=${item.bookingId}`);
        this.isOpen = false;
      }
    },
    getIconClass(type) {
      if (['BOOKING_CONFIRMED', 'PAYMENT_SUCCESS', 'PROMOTION'].includes(type)) return 'icon-success';
      if (['BOOKING_CANCELLED', 'PAYMENT_FAILED'].includes(type)) return 'icon-danger';
      if (['BOOKING_REMINDER', 'SCHEDULE_CHANGED'].includes(type)) return 'icon-warning';
      return 'icon-info';
    },
    formatTime(dateString) {
      if (!dateString) return '';
      try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
      } catch (e) {
        return '';
      }
    },
    closeOnClickOutside(event) {
      if (this.$refs.dropdownRef && !this.$refs.dropdownRef.contains(event.target)) {
        this.isOpen = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.closeOnClickOutside);
    this.fetchNotifications();
    // Simple polling every 30s
    this.pollingInterval = setInterval(this.fetchNotifications, 30000);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeOnClickOutside);
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
};
</script>

<style scoped>
.notification-container {
  position: relative;
  display: inline-block;
}

.notif-trigger {
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.2s;
  color: #64748b; 
}

.notif-trigger:hover {
  background: rgba(0, 0, 0, 0.05);
}

.notif-trigger.dark {
  color: #e0e0e0;
}

.notif-trigger.dark:hover {
  background: rgba(0, 0, 0, 0.3); /* slightly darker overlay */
}

.notif-badge {
  position: absolute;
  top: 4px;
  right: 2px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  height: 16px;
  min-width: 16px;
  padding: 0 4px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: -10px; 
  width: 360px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
  z-index: 1050;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.notif-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 22px;
  width: 12px;
  height: 12px;
  background: #ffffff;
  transform: rotate(45deg);
  border-left: 1px solid #f1f5f9;
  border-top: 1px solid #f1f5f9;
}

.notif-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.notif-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: #16a34a;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
}

.mark-all-btn:hover {
  color: #15803d;
  text-decoration: underline;
}

.notif-body {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

/* Custom scrollbar */
.notif-body::-webkit-scrollbar {
  width: 6px;
}
.notif-body::-webkit-scrollbar-track {
  background: transparent;
}
.notif-body::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

.notif-loading, .notif-empty {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}
.notif-empty svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.notif-item {
  display: flex;
  padding: 14px 20px;
  gap: 14px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
  align-items: flex-start;
  text-decoration: none;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.unread {
  background: #f0fdf4;
}
.notif-item.unread:hover {
  background: #e6fced;
}

.notif-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-success { background: #dcfce7; color: #16a34a; }
.icon-danger { background: #fee2e2; color: #ef4444; }
.icon-warning { background: #fef9c3; color: #eab308; }
.icon-info { background: #e0f2fe; color: #0284c7; }

.notif-content {
  flex: 1;
}

.notif-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.notif-message {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #475569;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-time {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16a34a;
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
}


.view-all-link {
  color: #16a34a;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.view-all-link:hover {
  text-decoration: underline;
}

/* Transitions */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

@media (max-width: 640px) {
  .notif-dropdown {
    position: fixed;
    top: 70px;
    left: 10px;
    right: 10px;
    width: auto;
    max-width: none;
  }
  .notif-dropdown::before {
    display: none;
  }
}
</style>
