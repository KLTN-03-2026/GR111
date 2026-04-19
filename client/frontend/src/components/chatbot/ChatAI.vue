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
          <img src="/chat-bot.png" alt="Chat" class="trigger-icon-img" />
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
                <img src="/chat-bot.png" alt="CourtMate AI" class="avatar-img" />
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
              <img src="/chat-bot.png" alt="CourtMate AI" />
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
                  <img src="/chat-bot.png" alt="AI" />
                </div>

                <div class="bubble-wrap">
                  <div class="bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-bot'">
                    <div
                      v-if="msg.role === 'assistant' && msg.textContent"
                      class="md-content"
                      v-html="renderMarkdown(msg.textContent)"
                    ></div>
                    <div v-else-if="msg.role === 'user'" class="plain-content">{{ msg.textContent }}</div>

                    <ChatStructuredContent
                      v-if="msg.structuredData"
                      :structured-data="msg.structuredData"
                      @quick-message="sendQuickMessage"
                    />
                  </div>
                  <time class="msg-time">{{ formatTime(msg.createdAt) }}</time>
                </div>
              </div>
            </TransitionGroup>

            <!-- Typing Indicator -->
            <div v-if="isLoading" class="msg-row row-bot">
              <div class="bot-avatar">
                <img src="/chat-bot.png" alt="AI" />
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
import ChatStructuredContent from './ChatStructuredContent.vue';

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

<style scoped src="../../assets/assets/css/chatbot/ChatAI.css"></style>