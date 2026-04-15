<template>
  <div class="courtmate-container">
    <!-- Floating Trigger -->
    <Transition name="pop">
      <button
        v-if="!isOpen"
        @click="toggleChat"
        class="trigger-btn"
        aria-label="Mở CourtMate AI"
      >
        <div class="trigger-glow"></div>
        <div class="trigger-img-wrap">
          <img src="/chatbot.png" alt="Chat" class="trigger-icon-img" />
        </div>
        <!-- <span class="trigger-badge">AI</span> -->
      </button>
    </Transition>

    <!-- Chat Window -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="chat-wrapper">
        <div class="chrome-border"></div>

        <!-- Header -->
        <header class="header">
          <div class="header-main">
            <div class="avatar-wrap">
              <div class="avatar-ring">
                <img src="/chatbot.png" alt="CourtMate AI" class="avatar-img" />
              </div>
              <span class="live-dot"></span>
            </div>
            <div class="header-text">
              <h5 class="online-status">CourtMate AI - hỗ trợ thông minh</h5>
            </div>
          </div>
          <div class="header-actions">
            <button @click="clearMessages" class="icon-btn" title="Làm mới">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
              </svg>
            </button>
            <button @click="toggleChat" class="icon-btn close-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Messages Scroll Area -->
        <div class="messages-area" ref="messageContainer">
          <!-- Welcome Block -->
          <div class="welcome-block" v-if="!displayMessages.length">
            <div class="welcome-orb">
              <img src="/chatbot.png" alt="CourtMate AI" />
            </div>
            <h2>Chào mừng đến với CourtMate!</h2>
            <p>Tôi là trợ lý ảo giúp bạn đặt sân thể thao siêu tốc. Bạn muốn chơi môn gì hôm nay?</p>
            <div class="chip-grid">
              <button
                v-for="chip in quickStartChips"
                :key="chip.label"
                @click="sendQuickMessage(chip.message)"
                class="start-chip"
                :style="{ '--chip-color': chip.color }"
              >
                <span class="chip-emoji">{{ chip.emoji }}</span>
                <span>{{ chip.label }}</span>
              </button>
            </div>
          </div>

          <!-- Messages List -->
          <div class="chat-list">
            <TransitionGroup name="msg-in">
              <div
                v-for="(msg, index) in displayMessages"
                :key="msg.id || index"
                class="msg-row"
                :class="msg.role === 'user' ? 'row-user' : 'row-bot'"
              >
                <div v-if="msg.role === 'assistant'" class="bot-avatar">
                  <img src="/chatbot.png" alt="AI" />
                </div>

                <div class="bubble-wrap">
                  <div class="bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-bot'">
                    <div
                      v-if="msg.role === 'assistant' && msg.textContent"
                      class="md-content"
                      v-html="renderMarkdown(msg.textContent)"
                    ></div>
                    <div v-else-if="msg.role === 'user'" class="plain-content">{{ msg.textContent }}</div>
                    
                    <!-- 🧩 STRUCTURED AI COMPONENTS 🧩 -->
                    <div v-if="msg.structuredData" class="component-area">
                      
                      <!-- Component: clubList -->
                      <div v-if="msg.structuredData.component === 'clubList'" class="club-list-comp">
                        <div v-if="msg.structuredData.data?.clubs?.length">
                          <div v-for="club in msg.structuredData.data.clubs" :key="club.id" class="club-card">
                            <div class="club-card-header">
                              <div class="club-card-title">🏟️ {{ club.name }}</div>
                              <div class="club-card-price">{{ club.minPrice?.toLocaleString() }}đ</div>
                            </div>
                            <p class="club-card-addr">📍 {{ club.address }}</p>
                            <div class="club-card-footer">
                              <span class="card-tag">🕐 {{ club.openTime }}-{{ club.closeTime }}</span>
                              <button @click="sendQuickMessage('Xem chi tiết sân ' + (club.slug || club.name))" class="card-btn">Chi tiết</button>
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-results">
                          <p>Rất tiếc, tôi không tìm thấy sân nào phù hợp với yêu cầu của bạn. 😅</p>
                        </div>
                      </div>

                      <!-- Component: clubDetail -->
                      <div v-if="msg.structuredData.component === 'clubDetail'" class="club-detail-comp">
                        <div class="detail-banner">⭐ {{ msg.structuredData.data.name }}</div>
                        <div class="detail-info-row">
                          <div class="info-item"><span>Giờ mở cửa:</span> <strong>{{ msg.structuredData.data.openTime }} - {{ msg.structuredData.data.closeTime }}</strong></div>
                        </div>
                        <div class="amenities-wrap">
                          <span v-for="a in msg.structuredData.data.amenities" :key="a.name" class="amenity-chip">{{ a.name }}</span>
                        </div>
                        <button @click="sendQuickMessage('Tìm giờ trống sân ' + msg.structuredData.data.name)" class="action-full-btn">Xem giờ trống</button>
                      </div>

                      <!-- Component: slotPicker -->
                      <div v-if="msg.structuredData.component === 'slotPicker'" class="slot-picker-comp">
                        <div v-for="court in msg.structuredData.data.courts" :key="court.courtId" class="court-block">
                          <div class="court-label">📍 {{ court.name }}</div>
                          <div class="slots-flex">
                            <button 
                              v-for="slot in court.slots" 
                              :key="slot.id"
                              @click="sendQuickMessage('Tôi muốn đặt sân ' + court.name + ' khung giờ ' + slot.start)"
                              class="slot-chip"
                            >
                              {{ slot.start }}
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Component: bookingConfirm -->
                      <div v-if="msg.structuredData.component === 'bookingConfirm'" class="confirm-comp">
                        <div class="comp-title">📋 Xác nhận đặt sân</div>
                        <div class="confirm-details">
                          <div class="detail-line"><span>Sân:</span> <strong>{{ msg.structuredData.data.clubName }}</strong></div>
                          <div class="detail-line"><span>Ngày:</span> <strong>{{ msg.structuredData.data.date }}</strong></div>
                          <div class="detail-line"><span>Khung giờ:</span> 
                            <span class="slot-text" v-for="s in msg.structuredData.data.slots" :key="s.startTime">{{ s.courtName }} ({{ s.startTime }})</span>
                          </div>
                          <div class="total-line"><span>Tổng:</span> <strong>{{ msg.structuredData.data.totalAmount?.toLocaleString() }}đ</strong></div>
                        </div>
                        <div class="confirm-footer">
                          <button @click="sendQuickMessage('Xác nhận đặt sân')" class="btn-confirm">✅ Xác nhận</button>
                          <button @click="sendQuickMessage('Tôi muốn thay đổi thông tin')" class="btn-cancel">Hủy</button>
                        </div>
                      </div>

                      <!-- Component: bookingSuccess -->
                      <div v-if="msg.structuredData.component === 'bookingSuccess'" class="success-comp">
                        <div class="success-icon-big">🎉</div>
                        <h3>Đặt sân thành công!</h3>
                        <div class="success-info">
                          <div class="info-val">Mã: <strong>{{ msg.structuredData.data.bookingCode }}</strong></div>
                          <div class="info-val">Tiền: <strong>{{ msg.structuredData.data.amount?.toLocaleString() }}đ</strong></div>
                        </div>
                      </div>

                      <!-- Component: userProfile -->
                      <div v-if="msg.structuredData.component === 'userProfile'" class="profile-comp">
                        <div class="profile-item"><span>Họ tên:</span> {{ msg.structuredData.data.fullName }}</div>
                        <div class="profile-item"><span>Số điện thoại:</span> {{ msg.structuredData.data.phone }}</div>
                        <div class="profile-item"><span>Email:</span> {{ msg.structuredData.data.email }}</div>
                      </div>

                      <!-- Component: bookingHistory -->
                      <div v-if="msg.structuredData.component === 'bookingHistory'" class="history-comp">
                        <div v-for="b in msg.structuredData.data" :key="b.code" class="history-card">
                          <div class="history-main">
                            <div class="h-name">{{ b.club }}</div>
                            <div class="h-date">{{ b.time }}</div>
                          </div>
                          <div class="h-status" :class="b.status.toLowerCase()">{{ b.status }}</div>
                        </div>
                      </div>

                      <!-- Component: authRequired -->
                      <div v-if="msg.structuredData.component === 'authRequired'" class="auth-comp">
                        <p>{{ msg.structuredData.data.error || 'Bạn cần đăng nhập để thực hiện thao tác này.' }}</p>
                        <a href="/login" class="auth-btn">Đến trang đăng nhập</a>
                      </div>

                      <!-- Component: error -->
                      <div v-if="msg.structuredData.component === 'error'" class="error-comp">
                        <div class="error-box">⚠️ {{ msg.structuredData.data.error || 'Đã có lỗi xảy ra' }}</div>
                      </div>

                    </div>
                  </div>
                  <time class="msg-time">{{ formatTime(msg.createdAt) }}</time>
                </div>
              </div>
            </TransitionGroup>

            <!-- Typing Indicator -->
            <div v-if="isLoading" class="msg-row row-bot">
              <div class="bot-avatar">
                <img src="/chatbot.png" alt="AI" />
              </div>
              <div class="bubble bubble-bot typing-bubble">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Footer -->
        <footer class="input-footer">
          <div v-if="suggestions.length && !isLoading" class="suggestions-strip">
            <button v-for="s in suggestions" :key="s" @click="sendQuickMessage(s)" class="sugg-pill">{{ s }}</button>
          </div>
          <div class="input-box" :class="{ 'input-focused': isFocused }">
            <textarea
              v-model="input"
              ref="inputField"
              placeholder="Nhập tin nhắn cho CourtMate..."
              rows="1"
              @keydown.enter.exact.prevent="submitMessage"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @input="autoResize"
              :disabled="isLoading"
            ></textarea>
            <button
              @click="submitMessage"
              :disabled="isLoading || !input.trim()"
              class="send-btn"
              :class="{ 'send-active': input.trim() }"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
          <p class="footer-note">Gửi tin nhắn · Shift+Enter xuống dòng</p>
        </footer>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed, shallowRef, triggerRef } from 'vue';
import { Chat } from '@ai-sdk/vue';
import { DefaultChatTransport } from 'ai';

// --- State ---
const isOpen = ref(false);
const isFocused = ref(false);
const messageContainer = ref(null);
const inputField = ref(null);
const input = ref('');
const userLocation = ref(null);

// Store structured data keyed by message id
const structuredDataMap = ref({});

const apiUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/chat`
  : '/api/chat';

// Create proper transport for AI SDK v6
const transport = new DefaultChatTransport({
  api: apiUrl,
  headers: () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  }),
  body: () => {
    let userId;
    try { userId = JSON.parse(localStorage.getItem('user') || '{}')?.id; } catch { userId = undefined; }
    return { userId, userLocation: userLocation.value };
  },
});

// Use shallowRef to avoid Vue proxy issues with class instances
const chat = shallowRef(new Chat({
  messages: [],
  transport,
  onError: (error) => console.error('CourtMate Error:', error),
  onFinish: ({ message }) => {
    // After each assistant message finishes, trigger reactivity
    triggerRef(chat);
  },
}));

const isLoading = computed(() => {
  const c = chat.value;
  return c.status === 'submitted' || c.status === 'streaming';
});

const displayMessages = computed(() => {
  const c = chat.value;
  const rawMessages = c.messages || [];
  
  return rawMessages.map(m => {
    let textContent = '';
    let structuredData = structuredDataMap.value[m.id] || null;

    // AI SDK v6: messages have 'parts' array, no 'content' property
    if (m.parts && m.parts.length > 0) {
      for (const part of m.parts) {
        if (part.type === 'text') {
          textContent += part.text;
        } 
        // v6 data parts have type 'data-{name}' pattern
        else if (typeof part.type === 'string' && part.type.startsWith('data-')) {
          if (part.data && part.data.component) {
            structuredData = part.data;
          }
        }
      }
    }

    // Fallback: if text content looks like JSON with component field
    if (!structuredData && textContent.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(textContent);
        if (parsed.component) {
          structuredData = parsed;
          textContent = parsed.messageResponse || '';
        }
      } catch (e) {
        // Not valid JSON - keep as text
      }
    }

    return { ...m, textContent, structuredData };
  });
});

const suggestions = computed(() => {
  if (!displayMessages.value.length) return [];
  const last = displayMessages.value[displayMessages.value.length - 1];
  if (last?.role !== 'assistant') return [];
  if (last.structuredData?.component === 'clubList') return ['Tìm sân khác', 'Sân gần tôi nhất'];
  return [];
});

const quickStartChips = [
  { label: 'Sân bóng đá', emoji: '⚽', message: 'Tôi muốn tìm sân bóng đá', color: '#008cff' },
  { label: 'Sân cầu lông', emoji: '🏸', message: 'Tìm sân cầu lông trống', color: '#0073cc' },
  { label: 'Xem lịch sử', emoji: '📅', message: 'Xem lịch sử đặt sân của tôi', color: '#2563eb' },
  { label: 'Tài khoản', emoji: '👤', message: 'Thông tin cá nhân của tôi', color: '#1e40af' },
];

// --- Actions ---
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    if (!userLocation.value && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLocation.value = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
        },
        () => {
          userLocation.value = null;
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60 * 1000 }
      );
    }
    nextTick(() => { inputField.value?.focus(); scrollToBottom(); });
  }
};

const clearMessages = () => {
  chat.value.messages = [];
  structuredDataMap.value = {};
  triggerRef(chat);
};

const sendQuickMessage = (text) => {
  input.value = text;
  nextTick(submitMessage);
};

const submitMessage = async () => {
  if (!input.value.trim() || isLoading.value) return;
  const text = input.value;
  input.value = '';
  nextTick(() => { if (inputField.value) inputField.value.style.height = 'auto'; });
  
  try {
    await chat.value.sendMessage({ text });
    triggerRef(chat);
  } catch (err) {
    console.error('Send message error:', err);
    triggerRef(chat);
  }
};

const autoResize = () => {
  const el = inputField.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

const formatTime = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

// Watch for message changes to scroll and trigger reactivity
watch(
  () => chat.value?.messages?.length,
  () => {
    triggerRef(chat);
    scrollToBottom();
  },
);

// Also poll during streaming to update UI
let pollTimer = null;
watch(isLoading, (loading) => {
  if (loading) {
    pollTimer = setInterval(() => {
      triggerRef(chat);
      scrollToBottom();
    }, 200);
  } else {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    triggerRef(chat);
    scrollToBottom();
  }
});

const renderMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

.courtmate-container {
  /* Sync exact colors with Bootstrap / Rocker Admin if available, else fallback */
  --primary: var(--bs-primary, #008cff);
  --primary-dark: #0073cc;
  --primary-light: rgba(0, 140, 255, 0.1);
  --bg-base: #ffffff;
  --bg-card: #f8f9fa;
  --bg-chat: #f4f6f9;
  --border: var(--bs-border-color, #e9ecef);
  --text-hi: var(--bs-body-color, #1e293b);
  --text-mid: #6c757d;
  --shadow: 0 10px 40px rgba(0,0,0,0.12);
  position: fixed; bottom: 2rem; right: 2rem; z-index: 10000;
  font-family: 'Roboto', sans-serif;
  box-sizing: border-box;
}

.courtmate-container * {
  box-sizing: inherit;
}

/* ── Trigger ── */
.trigger-btn {
  width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  border-radius: 50%; border: none; color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  position: relative; box-shadow: 0 8px 25px rgba(0, 140, 255, 0.4);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 0; margin: 0; outline: none;
}
.trigger-btn:hover { transform: scale(1.08); box-shadow: 0 10px 30px rgba(0, 140, 255, 0.5); }
.trigger-img-wrap { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 1; }
.trigger-icon-img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.25); display: block; }
.trigger-badge { position: absolute; top: 0px; right: 0px; background: #fd3550; color: white; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 12px; border: 2px solid white; line-height: 1; z-index: 2; }

/* ── Window ── */
.chat-wrapper {
  width: 400px; height: 680px; max-height: 85vh; background: var(--bg-base); border-radius: 20px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: var(--shadow); border: 1px solid var(--border);
  position: relative;
}

/* ── Header ── */
.header { 
  padding: 1rem 1.25rem; 
  background: var(--bg-base); 
  border-bottom: 1px solid var(--border); 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  box-shadow: 0 2px 10px rgba(0,0,0,0.02); 
  z-index: 10; 
  margin: 0;
}
.header-main { display: flex; align-items: center; gap: 0.8rem; }
.avatar-wrap { position: relative; display: inline-flex; }
.avatar-ring { width: 44px; height: 44px; background: var(--primary-light); border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,140,255,0.15); overflow: hidden; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.live-dot { position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background: #15ca20; border-radius: 50%; border: 2px solid var(--bg-base); box-sizing: content-box; }

.header-text { display: flex; flex-direction: column; justify-content: center; }
.header-text h1 { 
  font-family: 'Roboto', sans-serif; 
  font-size: 1.15rem; 
  font-weight: 700; 
  color: var(--text-hi); 
  margin: 0 0 2px 0; 
  padding: 0; 
  display: flex; 
  align-items: center; 
  line-height: 1.2;
}
.ai-label { background: var(--primary-light); color: var(--primary); font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; margin-left: 6px; line-height: 1;}
.online-status { font-size: 0.75rem; color: #15ca20; margin: 0; padding: 0; font-weight: 500; line-height: 1.2;}

.header-actions { display: flex; gap: 4px; }
.icon-btn { width: 34px; height: 34px; border-radius: 8px; border: none; background: transparent; color: var(--text-mid); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; padding: 0; outline: none; }
.icon-btn svg { width: 18px; height: 18px; }
.icon-btn:hover { background: var(--bg-chat); color: var(--primary); }

/* ── Messages Area ── */
.messages-area { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; background: var(--bg-chat); }
.welcome-block { text-align: center; padding: 2rem 1.5rem; background: var(--bg-base); border-radius: 16px; border: 1px solid var(--border); margin-bottom: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
.welcome-orb { margin-bottom: 1rem; display: flex; justify-content: center; }
.welcome-orb img { width: 64px; height: 64px; object-fit: contain; }
.welcome-block h2 { font-size: 1.15rem; font-weight: 700; color: var(--text-hi); margin: 0 0 0.5rem 0; }
.welcome-block p { font-size: 0.9rem; color: var(--text-mid); line-height: 1.5; margin: 0; }
.chip-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin-top: 1.5rem; }
.start-chip { padding: 0.6rem 1rem; background: var(--bg-base); border: 1px solid var(--border); border-radius: 12px; color: var(--text-mid); font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); outline: none; }
.start-chip:hover { border-color: var(--chip-color); color: var(--chip-color); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

/* ── Chat Bubbles ── */
.msg-row { display: flex; gap: 0.75rem; max-width: 92%; }
.row-user { align-self: flex-end; flex-direction: row-reverse; }
.row-bot { align-self: flex-start; }
.bot-avatar { width: 28px; height: 28px; border-radius: 50%; margin-top: 10px; flex-shrink: 0; overflow: hidden; border: 1px solid var(--border); background: var(--bg-base); display: flex; align-items: center; justify-content: center; }
.bot-avatar img { width: 100%; height: 100%; object-fit: contain; }
.bubble { padding: 0.85rem 1.15rem; border-radius: 16px; font-size: 0.95rem; line-height: 1.5; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.bubble-user { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(0, 140, 255, 0.2); }
.bubble-bot { background: var(--bg-base); color: var(--text-hi); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
.msg-time { font-size: 0.7rem; color: #94a3b8; margin-top: 6px; display: block; font-weight: 500; }
.row-user .msg-time { text-align: right; }

/* ── Typing Indicator ── */
.typing-bubble { display: flex; gap: 5px; align-items: center; padding: 1rem 1.2rem; }
.typing-bubble span { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; }
.typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
.typing-bubble span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── COMPONENT STYLING ── */
.component-area { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; width: 330px; }

/* Club Card */
.club-card { background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border); padding: 1.15rem; transition: 0.2s; }
.club-card:hover { border-color: var(--primary-light); box-shadow: 0 4px 12px var(--primary-light); }
.club-card-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: flex-start; }
.club-card-title { font-weight: 700; color: var(--text-hi); font-size: 0.95rem; }
.club-card-price { color: var(--primary); font-weight: 700; font-size: 0.85rem; background: var(--primary-light); padding: 4px 8px; border-radius: 6px; }
.club-card-addr { font-size: 0.8rem; color: var(--text-mid); margin: 6px 0 12px; line-height: 1.4; }
.club-card-footer { display: flex; justify-content: space-between; align-items: center; }
.card-tag { font-size: 0.75rem; color: var(--text-mid); font-weight: 500; background: #e2e8f0; padding: 4px 8px; border-radius: 6px; }
.card-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--primary); background: transparent; color: var(--primary); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s; outline: none; }
.card-btn:hover { background: var(--primary); color: white; }

/* Slot Picker */
.court-block { margin-bottom: 1rem; background: #ffffff; border: 1px solid var(--border); border-radius: 12px; padding: 1rem; }
.court-label { font-size: 0.9rem; font-weight: 700; color: var(--text-hi); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 6px; }
.slots-flex { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.slot-chip { padding: 6px 12px; border-radius: 8px; background: var(--primary-light); border: 1px solid transparent; color: var(--primary-dark); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s; outline: none;}
.slot-chip:hover { background: var(--primary); color: white; transform: translateY(-1px); box-shadow: 0 4px 10px var(--primary-light); }

/* Confirm Card */
.confirm-comp { background: #ffffff; border: 2px solid var(--primary); border-radius: 16px; padding: 1.5rem; box-shadow: 0 8px 24px var(--primary-light); }
.comp-title { font-size: 1.1rem; font-weight: 700; color: var(--primary); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 6px; }
.confirm-details { font-size: 0.95rem; display: flex; flex-direction: column; gap: 0.75rem; color: var(--text-mid); }
.detail-line { display: flex; justify-content: space-between; align-items: flex-start; }
.detail-line strong { color: var(--text-hi); text-align: right; max-width: 60%; }
.slot-text { display: block; text-align: right; margin-bottom: 2px; }
.total-line { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; color: var(--text-hi); font-size: 1.15rem; font-weight: 700;}
.confirm-footer { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
.btn-confirm { flex: 1; padding: 10px; border-radius: 10px; border: none; background: var(--primary); color: white; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.2s; outline: none;}
.btn-confirm:hover { background: var(--primary-dark); box-shadow: 0 4px 12px var(--primary-light); }
.btn-cancel { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-mid); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: 0.2s; outline: none; }
.btn-cancel:hover { background: #e2e8f0; color: var(--text-hi); }

/* Success Card */
.success-comp { text-align: center; padding: 2rem 1.5rem; background: #ecfdf5; border: 1px solid #10b981; border-radius: 16px; }
.success-icon-big { font-size: 3.5rem; margin-bottom: 1rem; line-height: 1;}
.success-comp h3 { font-size: 1.25rem; color: #059669; font-weight: 700; margin: 0 0 1rem 0; }
.success-info { display: flex; flex-direction: column; gap: 8px; font-size: 0.95rem; color: #064e3b; }
.info-val { background: rgba(255,255,255,0.6); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; }

/* History Card */
.history-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-base); border-radius: 12px; margin-bottom: 0.75rem; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.h-name { font-weight: 700; color: var(--text-hi); font-size: 0.95rem; margin-bottom: 4px; }
.h-date { font-size: 0.8rem; color: var(--text-mid); font-weight: 500; }
.h-status { font-size: 0.7rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.h-status.confirmed { background: #d1fae5; color: #059669; }
.h-status.pending { background: #fef3c7; color: #d97706; }

/* Profile */
.profile-comp { display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-base); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border); }
.profile-item { font-size: 0.95rem; color: var(--text-hi); display: flex; flex-direction: column; gap: 4px; }
.profile-item span { font-size: 0.75rem; font-weight: 600; color: var(--text-mid); text-transform: uppercase; letter-spacing: 0.5px; }

/* Auth Required */
.auth-comp { text-align: center; padding: 1.5rem; background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; }
.auth-comp p { font-size: 0.95rem; color: #92400e; margin: 0 0 1rem 0; font-weight: 500; line-height: 1.5; }
.auth-btn { display: inline-block; padding: 10px 24px; border-radius: 10px; background: var(--primary); color: white; font-weight: 700; text-decoration: none; font-size: 0.95rem; transition: 0.2s; }
.auth-btn:hover { background: var(--primary-dark); box-shadow: 0 4px 12px var(--primary-light); color: white; }

/* Error */
.error-comp { padding: 0.5rem 0; }
.error-box { padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; font-size: 0.95rem; font-weight: 500; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; margin:0;}

/* Detail */
.club-detail-comp { background: var(--bg-base); padding: 1.25rem; border-radius: 16px; border: 1px solid var(--border); }
.detail-banner { font-size: 1.15rem; font-weight: 700; color: var(--text-hi); margin: 0 0 1rem 0; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); }
.detail-info-row { margin-bottom: 1rem; }
.info-item { font-size: 0.95rem; color: var(--text-mid); display: flex; justify-content: space-between; }
.info-item strong { color: var(--text-hi); }
.amenities-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
.amenity-chip { padding: 4px 10px; border-radius: 8px; background: var(--bg-chat); border: 1px solid var(--border); color: var(--text-hi); font-size: 0.8rem; font-weight: 500; }
.action-full-btn { width: 100%; padding: 12px; border-radius: 10px; background: var(--primary); color: white; font-weight: 700; border: none; cursor: pointer; font-size: 0.95rem; transition: 0.2s; outline: none;}
.action-full-btn:hover { background: var(--primary-dark); box-shadow: 0 4px 15px var(--primary-light); }

/* No results */
.no-results { text-align: center; padding: 1.5rem; background: var(--bg-base); border-radius: 12px; border: 1px dashed var(--border); }
.no-results p { font-size: 0.95rem; color: var(--text-mid); font-weight: 500; margin:0;}

/* ── Footer ── */
.input-footer { padding: 1rem 1.25rem 1.25rem; background: var(--bg-base); border-top: 1px solid var(--border); border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; z-index: 10; }
.suggestions-strip { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 0.85rem; scrollbar-width: none; }
.suggestions-strip::-webkit-scrollbar { display: none; }
.sugg-pill { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--primary-light); background: var(--bg-base); color: var(--primary); font-size: 0.85rem; font-weight: 500; white-space: nowrap; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.02); outline: none;}
.sugg-pill:hover { border-color: var(--primary); background: var(--primary-light); transform: translateY(-1px); }

.input-box { display: flex; align-items: flex-end; gap: 0.75rem; padding: 0.6rem 0.6rem 0.6rem 1.1rem; background: var(--bg-chat); border-radius: 16px; border: 1px solid var(--border); transition: 0.3s; }
.input-focused { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); background: #ffffff; }
textarea { flex: 1; border: none; background: transparent; color: var(--text-hi); outline: none; font-size: 0.95rem; resize: none; max-height: 120px; padding: 6px 0; font-family: inherit; line-height: 1.5; margin: 0; }
textarea::placeholder { color: #94a3b8; }
.send-btn { width: 38px; height: 38px; border-radius: 12px; border: none; background: #e2e8f0; color: #94a3b8; cursor: not-allowed; display: flex; align-items: center; justify-content: center; transition: 0.3s; padding: 0; outline: none;}
.send-btn svg { width: 20px; height: 20px; }
.send-active { background: var(--primary); color: white; cursor: pointer; box-shadow: 0 4px 10px var(--primary-light); }
.send-active:hover { background: var(--primary-dark); transform: scale(1.05); }
.footer-note { font-size: 0.7rem; color: #94a3b8; text-align: center; margin: 0.75rem 0 0;  font-weight: 500; }

/* md-content tweaks for better contrast on dark bg if any */
.md-content :deep(strong) { font-weight: 700; color: inherit; }
.md-content :deep(p) { margin: 0 0 0.5rem 0; }
.md-content :deep(p:last-child) { margin-bottom: 0; }

/* Animations */
.pop-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-enter-from { transform: scale(0); opacity: 0; }
.slide-up-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.4, 0.64, 1); }
.slide-up-enter-from { transform: translateY(40px) scale(0.96); opacity: 0; }
.msg-in-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1); }
.msg-in-enter-from { transform: translateY(15px); opacity: 0; }
</style>