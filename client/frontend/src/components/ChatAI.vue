<template>
  <div class="courtmate-container">
    <!-- Floating Trigger Button -->
    <Transition name="bubble">
      <button
        v-if="!isOpen"
        @click="toggleChat"
        class="trigger-btn"
        title="CourtMate AI"
      >
        <div class="trigger-inner">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M8 12h.01M12 12h.01M16 12h.01"/>
          </svg>
        </div>
        <span class="online-dot"></span>
        <span class="trigger-label">CourtMate</span>
      </button>
    </Transition>

    <!-- Chat Window -->
    <Transition name="window">
      <div v-if="isOpen" class="chat-window">

        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <div class="avatar-ring">
              <div class="avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <span class="status-dot"></span>
            </div>
            <div class="header-text">
              <span class="bot-name">CourtMate AI</span>
              <span class="bot-status">
                <span class="pulse"></span>
                Đang hoạt động
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button @click="clearMessages" class="icon-btn" title="Cuộc trò chuyện mới">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
            </button>
            <button @click="toggleChat" class="icon-btn" title="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages-area" ref="messageContainer">

          <!-- Welcome Card -->
          <div class="welcome-card">
            <div class="welcome-emoji">🏆</div>
            <p class="welcome-text">Xin chào! Tôi là <strong>CourtMate</strong> — trợ lý đặt sân thể thao của bạn. Hãy cho tôi biết bạn muốn chơi môn gì nhé!</p>
            <div class="quick-chips">
              <button
                v-for="chip in quickStartChips"
                :key="chip.label"
                @click="sendQuickMessage(chip.message)"
                class="chip"
                :class="`chip--${chip.color}`"
              >
                {{ chip.emoji }} {{ chip.label }}
              </button>
            </div>
          </div>

          <!-- Messages -->
          <TransitionGroup name="msg" tag="div" class="messages-list">
            <div
              v-for="(msg, index) in messages"
              :key="msg.id || index"
              class="msg-row"
              :class="msg.role === 'user' ? 'msg-row--user' : 'msg-row--bot'"
            >
              <!-- Bot Avatar -->
              <div v-if="msg.role !== 'user'" class="bot-bubble-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>

              <div class="bubble" :class="msg.role === 'user' ? 'bubble--user' : 'bubble--bot'">
                <div
                  v-if="msg.role !== 'user'"
                  class="markdown-content"
                  v-html="renderMarkdown(msg.content)"
                ></div>
                <div v-else class="user-text">{{ msg.content }}</div>
                <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>
          </TransitionGroup>

          <!-- Typing Indicator -->
          <Transition name="fade">
            <div v-if="isLoading" class="msg-row msg-row--bot">
              <div class="bot-bubble-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <div class="bubble bubble--bot typing-bubble">
                <span></span><span></span><span></span>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Quick Reply Suggestions -->
        <Transition name="fade">
          <div v-if="suggestions.length && !isLoading" class="suggestions-bar">
            <button
              v-for="s in suggestions"
              :key="s"
              @click="sendQuickMessage(s)"
              class="suggestion-chip"
            >
              {{ s }}
            </button>
          </div>
        </Transition>

        <!-- Input Area -->
        <div class="input-area">
          <div class="input-wrapper" :class="{ focused: isFocused }">
            <textarea
              v-model="input"
              ref="inputField"
              placeholder="Nhắn tin với CourtMate..."
              rows="1"
              :disabled="isLoading"
              @keydown.enter.exact.prevent="submitMessage"
              @focus="isFocused = true"
              @blur="isFocused = false"
              @input="autoResize"
            ></textarea>
            <button
              @click="submitMessage"
              :disabled="isLoading || !input.trim()"
              class="send-btn"
              :class="{ 'send-btn--active': input.trim() }"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
          <p class="input-hint">Enter để gửi · Shift+Enter xuống dòng</p>
        </div>

      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue';
import { useChat } from '@ai-sdk/vue';

// ─── State ────────────────────────────────────────────────────────────────────
const isOpen = ref(false);
const isFocused = ref(false);
const messageContainer = ref(null);
const inputField = ref(null);

// ─── AI Chat Hook ──────────────────────────────────────────────────────────────
const { messages, input, handleSubmit, isLoading, setMessages } = useChat({
  api: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/chat`
    : '/api/chat',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  },
  body: {
    userId: (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}')?.id;
      } catch {
        return undefined;
      }
    })(),
  },
  onError: (error) => {
    console.error('CourtMate Error:', error);
  },
});

// ─── Quick Start Chips ────────────────────────────────────────────────────────
const quickStartChips = [
  { label: 'Đặt sân bóng đá', emoji: '⚽', message: 'Tôi muốn đặt sân bóng đá', color: 'green' },
  { label: 'Đặt sân cầu lông', emoji: '🏸', message: 'Tôi muốn đặt sân cầu lông', color: 'blue' },
  { label: 'Đặt sân tennis', emoji: '🎾', message: 'Tôi muốn đặt sân tennis', color: 'orange' },
  { label: 'Sân trống hôm nay', emoji: '📅', message: 'Cho tôi xem sân còn trống hôm nay', color: 'purple' },
];

// ─── Contextual suggestions ───────────────────────────────────────────────────
const suggestions = computed(() => {
  if (!messages.value.length) return [];
  const last = messages.value[messages.value.length - 1];
  if (last?.role !== 'assistant') return [];
  const content = last.content?.toLowerCase() || '';

  if (content.includes('xem chi tiết') || content.includes('sân nào')) {
    return ['Xem sân đầu tiên', 'Xem tất cả', 'Tìm lại'];
  }
  if (content.includes('ngày') || content.includes('khung giờ')) {
    return ['Hôm nay', 'Ngày mai', 'Cuối tuần này'];
  }
  if (content.includes('xác nhận') || content.includes('đặt sân này')) {
    return ['✅ Xác nhận đặt', '❌ Huỷ'];
  }
  if (content.includes('thanh toán')) {
    return ['Xem lịch sử đặt sân', 'Tìm sân khác'];
  }
  return [];
});

// ─── Actions ──────────────────────────────────────────────────────────────────
const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      inputField.value?.focus();
      scrollToBottom();
    });
  }
};

const clearMessages = () => {
  setMessages([]);
};

const sendQuickMessage = (text) => {
  input.value = text;
  nextTick(submitMessage);
};

const submitMessage = () => {
  if (!input.value.trim() || isLoading.value) return;
  handleSubmit();
  nextTick(() => {
    if (inputField.value) {
      inputField.value.style.height = 'auto';
    }
  });
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
      messageContainer.value.scrollTo({
        top: messageContainer.value.scrollHeight,
        behavior: 'smooth',
      });
    }
  });
};

watch(messages, scrollToBottom, { deep: true });
watch(isLoading, scrollToBottom);

// ─── Markdown Renderer ────────────────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return '';
  return text
    // Code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // HR / Divider
    .replace(/^---$/gm, '<hr class="md-hr"/>')
    // Headings
    .replace(/^### (.*$)/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="md-h3">$1</h3>')
    // Unordered list items
    .replace(/^[-•] (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="md-ul">${m}</ul>`)
    // Ordered list
    .replace(/^\d+\. (.*)/gm, '<li>$1</li>')
    // Newlines
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br/>');
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (date) => {
  if (!date) return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
/* ── Tokens ────────────────────────────────────────────────────────────────── */
:root {
  --cm-primary: #16a34a;
  --cm-primary-dark: #15803d;
  --cm-primary-light: #dcfce7;
  --cm-accent: #f59e0b;
  --cm-bg: #ffffff;
  --cm-surface: #f9fafb;
  --cm-border: #e5e7eb;
  --cm-text: #111827;
  --cm-muted: #6b7280;
  --cm-radius: 1.25rem;
  --cm-font: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
}

/* ── Layout ────────────────────────────────────────────────────────────────── */
.courtmate-container {
  position: fixed;
  bottom: 1.75rem;
  right: 1.75rem;
  z-index: 9999;
  font-family: var(--cm-font);
}

/* ── Trigger Button ────────────────────────────────────────────────────────── */
.trigger-btn {
  position: relative;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: linear-gradient(145deg, #16a34a, #15803d);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 24px rgba(22, 163, 74, 0.4), 0 0 0 0 rgba(22, 163, 74, 0.3);
  animation: ripple-pulse 2.5s ease-in-out infinite;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.trigger-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(22, 163, 74, 0.5);
}

.trigger-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 13px;
  height: 13px;
  background: #4ade80;
  border: 2.5px solid white;
  border-radius: 50%;
}

.trigger-label {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 700;
  color: var(--cm-primary-dark);
  letter-spacing: 0.05em;
  white-space: nowrap;
}

@keyframes ripple-pulse {
  0%, 100% { box-shadow: 0 4px 24px rgba(22,163,74,0.4), 0 0 0 0 rgba(22,163,74,0.25); }
  50% { box-shadow: 0 4px 24px rgba(22,163,74,0.4), 0 0 0 10px rgba(22,163,74,0); }
}

/* ── Chat Window ───────────────────────────────────────────────────────────── */
.chat-window {
  width: 390px;
  height: 600px;
  background: var(--cm-bg);
  border-radius: var(--cm-radius);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  transform-origin: bottom right;
}

/* ── Header ────────────────────────────────────────────────────────────────── */
.chat-header {
  padding: 1rem 1.1rem;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.avatar-ring {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 11px;
  height: 11px;
  background: #4ade80;
  border: 2px solid white;
  border-radius: 50%;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.bot-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.01em;
}

.bot-status {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  gap: 4px;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #86efac;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.header-actions {
  display: flex;
  gap: 0.25rem;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.15);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.icon-btn:hover { background: rgba(255,255,255,0.25); }

/* ── Messages Area ─────────────────────────────────────────────────────────── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--cm-surface);
  scroll-behavior: smooth;
}

.messages-area::-webkit-scrollbar { width: 4px; }
.messages-area::-webkit-scrollbar-track { background: transparent; }
.messages-area::-webkit-scrollbar-thumb { background: var(--cm-border); border-radius: 2px; }

/* Welcome Card */
.welcome-card {
  background: white;
  border: 1px solid var(--cm-border);
  border-radius: 1rem;
  padding: 1.1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.welcome-emoji {
  font-size: 2rem;
  margin-bottom: 0.4rem;
}

.welcome-text {
  font-size: 0.85rem;
  color: var(--cm-muted);
  line-height: 1.5;
  margin-bottom: 0.8rem;
}

.welcome-text strong { color: var(--cm-text); }

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
}

.chip {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.chip--green { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
.chip--green:hover { background: #bbf7d0; }
.chip--blue { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
.chip--blue:hover { background: #bfdbfe; }
.chip--orange { background: #fef3c7; color: #b45309; border-color: #fde68a; }
.chip--orange:hover { background: #fde68a; }
.chip--purple { background: #ede9fe; color: #6d28d9; border-color: #ddd6fe; }
.chip--purple:hover { background: #ddd6fe; }

/* Messages List */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.msg-row--user { justify-content: flex-end; }
.msg-row--bot { justify-content: flex-start; }

.bot-bubble-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(145deg, #16a34a, #15803d);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.bubble {
  max-width: 78%;
  padding: 0.65rem 0.9rem;
  border-radius: 1.1rem;
  font-size: 0.86rem;
  line-height: 1.5;
  position: relative;
  word-break: break-word;
}

.bubble--user {
  background: linear-gradient(145deg, #16a34a, #15803d);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble--bot {
  background: white;
  color: var(--cm-text);
  border: 1px solid var(--cm-border);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.msg-time {
  display: block;
  font-size: 0.67rem;
  margin-top: 0.3rem;
  opacity: 0.55;
  text-align: right;
}

.bubble--user .msg-time { color: rgba(255,255,255,0.8); }
.bubble--bot .msg-time { color: var(--cm-muted); }

/* Typing */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0.7rem 0.9rem;
  min-width: 60px;
}

.typing-bubble span {
  width: 7px;
  height: 7px;
  background: var(--cm-border);
  border-radius: 50%;
  animation: dot-bounce 1.2s ease-in-out infinite;
}

.typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
.typing-bubble span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 100% { transform: translateY(0); background: #d1d5db; }
  50% { transform: translateY(-5px); background: #16a34a; }
}

/* ── Markdown Styles ─────────────────────────────────────────────────────────── */
.markdown-content :deep(strong) { font-weight: 700; color: #111827; }
.markdown-content :deep(em) { font-style: italic; }
.markdown-content :deep(.md-ul) {
  margin: 0.4rem 0;
  padding-left: 1.25rem;
  list-style: disc;
}
.markdown-content :deep(li) { margin-bottom: 0.2rem; }
.markdown-content :deep(.md-p) { margin: 0.4rem 0; }
.markdown-content :deep(.md-hr) {
  border: none;
  border-top: 1px solid var(--cm-border);
  margin: 0.6rem 0;
}
.markdown-content :deep(.md-h3) {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0.5rem 0 0.25rem;
}
.markdown-content :deep(.md-h4) {
  font-size: 0.88rem;
  font-weight: 700;
  margin: 0.4rem 0 0.2rem;
}
.markdown-content :deep(.code-block) {
  background: #f3f4f6;
  border: 1px solid var(--cm-border);
  border-radius: 6px;
  padding: 0.6rem;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0.4rem 0;
  font-family: 'JetBrains Mono', monospace;
}
.markdown-content :deep(.inline-code) {
  background: #f3f4f6;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
}

/* ── Suggestions ───────────────────────────────────────────────────────────── */
.suggestions-bar {
  padding: 0.6rem 0.9rem;
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  flex-shrink: 0;
  background: var(--cm-surface);
  border-top: 1px solid var(--cm-border);
}

.suggestions-bar::-webkit-scrollbar { display: none; }

.suggestion-chip {
  padding: 0.3rem 0.7rem;
  border: 1.5px solid #d1fae5;
  border-radius: 999px;
  background: white;
  color: #15803d;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.suggestion-chip:hover {
  background: #f0fdf4;
  border-color: #16a34a;
}

/* ── Input Area ────────────────────────────────────────────────────────────── */
.input-area {
  padding: 0.75rem 0.9rem 0.6rem;
  background: var(--cm-bg);
  border-top: 1px solid var(--cm-border);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  background: var(--cm-surface);
  border: 1.5px solid var(--cm-border);
  border-radius: 1rem;
  padding: 0.5rem 0.5rem 0.5rem 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper.focused {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.input-wrapper textarea {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  resize: none;
  font-size: 0.87rem;
  line-height: 1.45;
  color: var(--cm-text);
  font-family: var(--cm-font);
  max-height: 120px;
  overflow-y: auto;
}

.input-wrapper textarea::placeholder {
  color: #9ca3af;
}

.send-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  border: none;
  background: var(--cm-border);
  color: #9ca3af;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn--active {
  background: linear-gradient(145deg, #16a34a, #15803d);
  color: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
}

.send-btn--active:hover {
  transform: scale(1.08);
}

.input-hint {
  font-size: 0.68rem;
  color: #9ca3af;
  margin: 0.3rem 0 0 0.2rem;
}

/* ── Transitions ───────────────────────────────────────────────────────────── */
.bubble-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bubble-leave-active { transition: all 0.2s ease-in; }
.bubble-enter-from { opacity: 0; transform: scale(0.5); }
.bubble-leave-to { opacity: 0; transform: scale(0.5); }

.window-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.4, 0.64, 1); }
.window-leave-active { transition: all 0.2s ease-in; }
.window-enter-from { opacity: 0; transform: scale(0.8) translateY(20px); }
.window-leave-to { opacity: 0; transform: scale(0.8) translateY(20px); }

.msg-enter-active { transition: all 0.25s ease-out; }
.msg-enter-from { opacity: 0; transform: translateY(10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .courtmate-container {
    bottom: 0;
    right: 0;
  }

  .chat-window {
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
  }

  .trigger-btn {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>