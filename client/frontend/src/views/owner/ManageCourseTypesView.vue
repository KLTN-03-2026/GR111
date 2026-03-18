<template>
  <div id="app">
    <div class="orb orb1"></div>
    <div class="orb orb2"></div>
    <div class="orb orb3"></div>

    <div class="layout">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-logo">⚡</div>
        <div
          v-for="(item, i) in navItems"
          :key="i"
          class="nav-item"
          :class="{ active: activeNav === i }"
          @click="activeNav = i"
          :title="item.label"
        >
          <span>{{ item.icon }}</span>
        </div>
        <div class="nav-avatar">A</div>
      </div>

      <div class="main">
        <!-- Top Nav -->
        <div class="topnav">
          <span class="brand">ScorePulse</span>
          <div
            v-for="s in sports"
            :key="s"
            class="sport-tab"
            :class="{ active: activeSport === s }"
            @click="activeSport = s"
          >
            {{ s }}
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="center-panel">
            <!-- Date strip -->
            <div class="date-strip">
              <div
                v-for="d in dates"
                :key="d.id"
                class="date-item"
                :class="{ active: activeDate === d.id }"
                @click="activeDate = d.id"
              >
                <div class="day">{{ d.day }}</div>
                <div class="dt">{{ d.date }}</div>
                <div v-if="d.lbl" class="lbl">MD 19</div>
              </div>
            </div>

            <!-- Main match card -->
            <div class="match-card">
              <div
                style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 10px;
                "
              >
                <span class="live-badge"
                  ><span class="live-dot"></span>LIVE</span
                >
                <div style="display: flex; align-items: center; gap: 12px">
                  <span style="font-size: 11px; color: var(--text-muted)"
                    >⏱ {{ elapsedMin }}'</span
                  >
                  <span style="font-size: 11px; color: var(--text-secondary)"
                    >⭐ UEFA Champions League</span
                  >
                </div>
              </div>

              <div style="text-align: center; margin-bottom: 4px">
                <div style="font-size: 12px; color: var(--text-muted)">
                  Match Day 19 · 24 Jan 00:40
                </div>
              </div>

              <div style="text-align: center; margin-bottom: 10px">
                <div class="countdown">
                  <div class="cd-block">
                    <span class="cd-val" :class="{ tick: cdTick }">{{
                      cd.h
                    }}</span>
                    <div class="cd-label">HRS</div>
                  </div>
                  <span class="cd-sep">:</span>
                  <div class="cd-block">
                    <span class="cd-val" :class="{ tick: cdTick }">{{
                      cd.m
                    }}</span>
                    <div class="cd-label">MIN</div>
                  </div>
                  <span class="cd-sep">:</span>
                  <div class="cd-block">
                    <span class="cd-val" :class="{ tick: cdTick }">{{
                      cd.s
                    }}</span>
                    <div class="cd-label">SEC</div>
                  </div>
                </div>
              </div>

              <div class="match-body">
                <div class="team">
                  <div
                    class="team-logo"
                    style="
                      background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.05),
                        rgba(59, 130, 246, 0.1)
                      );
                    "
                  >
                    <img
                      class="team-logo-img"
                      src="https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"
                      alt="Real Madrid logo"
                    />
                  </div>
                  <div class="team-name mb-5">Real Madrid</div>
                </div>
                <div class="scoreboard mb-5">
                  <div :class="['score', scoreFlash ? 'goal' : '']">
                    {{ score.home }} — {{ score.away }}
                  </div>
                  <div
                    style="
                      font-size: 10px;
                      color: var(--text-muted);
                      margin-top: 4px;
                    "
                  >
                    FT
                  </div>
                </div>
                <div class="team">
                  <div
                    class="team-logo"
                    style="
                      background: linear-gradient(
                        135deg,
                        rgba(255, 0, 0, 0.05),
                        rgba(0, 0, 255, 0.08)
                      );
                    "
                  >
                    <img
                      class="team-logo-img"
                      src="https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"
                      alt="Barcelona logo"
                    />
                  </div>
                  <div class="team-name mb-5">Barcelona</div>
                </div>
              </div>

              <div class="vote-bar-wrap">
                <div
                  class="vote-bar-l"
                  :style="{ width: fcbVotes + '%' }"
                ></div>
                <div class="vote-bar-r" :style="{ width: rmVotes + '%' }"></div>
              </div>

              <div class="vote-section" style="margin-top: 10px">
                <div class="vote-side">
                  <div class="vote-avatars">
                    <div class="vote-avatar">F</div>
                    <div
                      class="vote-avatar"
                      style="
                        background: linear-gradient(135deg, #06b6d4, #3b82f6);
                      "
                    >
                      C
                    </div>
                    <div
                      class="vote-avatar"
                      style="
                        background: linear-gradient(135deg, #8b5cf6, #ec4899);
                      "
                    >
                      B
                    </div>
                  </div>
                  <div class="vote-text">
                    FCB <strong>{{ fcbVotes }}%</strong>
                  </div>
                </div>
                <button class="vote-btn" @click="castVote">Add Vote</button>
                <div class="vote-side" style="justify-content: flex-end">
                  <div class="vote-text" style="text-align: right">
                    RM
                    <strong style="color: var(--accent)">{{ rmVotes }}%</strong>
                  </div>
                  <div class="vote-avatars">
                    <div
                      class="vote-avatar"
                      style="
                        background: linear-gradient(135deg, #f59e0b, #ef4444);
                      "
                    >
                      J
                    </div>
                    <div
                      class="vote-avatar"
                      style="
                        background: linear-gradient(135deg, #10b981, #3b82f6);
                      "
                    >
                      K
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- League table -->
            <div style="height: 5px" class="table-card ">
              <div style="height: 100px;" class="table-header">
                <div class="table-title">🏆 Champion League Tables</div>
                <div class="season-badge" @click="toggleSeason">
                  {{ season }} ▾
                </div>
              </div>
              <div class="table-cols">
                <div>Pos</div>
                <div>Club</div>
                <div style="text-align: center">Pts</div>
                <div style="text-align: center">W</div>
                <div style="text-align: center">D</div>
                <div style="text-align: center">L</div>
                <div style="text-align: center">GF</div>
                <div style="text-align: center">GA</div>
                <div style="text-align: right">Last 5</div>
              </div>
              <div
                v-for="(team, i) in tableData"
                :key="team.name"
                class="table-row"
              >
                <div>
                  <div class="pos-num">{{ i + 1 }}</div>
                  <span :class="'rank-' + team.trend">{{
                    team.trend === "up"
                      ? "↑"
                      : team.trend === "down"
                        ? "↓"
                        : "–"
                  }}</span>
                </div>
                <div class="team-cell">
                  <div class="team-icon">{{ team.icon }}</div>
                  <div class="team-cell-name">{{ team.name }}</div>
                </div>
                <div class="pts">{{ team.pts }}</div>
                <div class="sv">{{ team.w }}</div>
                <div class="sv">{{ team.d }}</div>
                <div class="sv">{{ team.l }}</div>
                <div class="sv">{{ team.gf }}</div>
                <div class="sv">{{ team.ga }}</div>
                <div class="last-matches">
                  <div
                    v-for="r in team.last"
                    :key="r"
                    class="match-chip"
                    :class="'chip-' + r.toLowerCase()"
                  >
                    {{ r }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right panel -->
          <div class="right-panel">
            <div class="panel-title">
              <span
                style="
                  width: 8px;
                  height: 8px;
                  background: var(--accent-live);
                  border-radius: 50%;
                  display: inline-block;
                  animation: blink 1s ease-in-out infinite;
                "
              ></span>
              Live Matches
            </div>
            <div v-for="(m, i) in liveMatches" :key="i" class="live-match-card">
              <div class="lm-header">
                <span
                  class="live-badge"
                  style="font-size: 9px; padding: 2px 6px"
                  ><span class="live-dot"></span>LIVE</span
                >
                <span class="lm-time">{{ m.minute }}'</span>
              </div>
              <div class="lm-teams">
                <div class="lm-team">
                  <div class="lm-logo">{{ m.home.icon }}</div>
                  <div class="lm-name">{{ m.home.name }}</div>
                </div>
                <div class="lm-score">
                  {{ m.home.score }} - {{ m.away.score }}
                </div>
                <div class="lm-team">
                  <div class="lm-logo">{{ m.away.icon }}</div>
                  <div class="lm-name">{{ m.away.name }}</div>
                </div>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (m.minute / 90) * 100 + '%' }"
                ></div>
              </div>
            </div>

            <div class="panel-title" style="margin-top: 18px">📅 Upcoming</div>
            <div
              v-for="(m, i) in upcomingMatches"
              :key="'u' + i"
              class="live-match-card"
            >
              <div class="lm-header">
                <span style="font-size: 9px; color: var(--text-muted)">{{
                  m.league
                }}</span>
                <span style="font-size: 10px; color: var(--accent2)">{{
                  m.time
                }}</span>
              </div>
              <div class="lm-teams">
                <div class="lm-team">
                  <div class="lm-logo">{{ m.home.icon }}</div>
                  <div class="lm-name">{{ m.home.name }}</div>
                </div>
                <div
                  style="
                    font-family: &quot;Rajdhani&quot;, sans-serif;
                    font-size: 14px;
                    color: var(--text-muted);
                    font-weight: 700;
                  "
                >
                  VS
                </div>
                <div class="lm-team">
                  <div class="lm-logo">{{ m.away.icon }}</div>
                  <div class="lm-name">{{ m.away.name }}</div>
                </div>
              </div>
            </div>

            <!-- Mini stats -->
            <div class="panel-title" style="margin-top: 18px">
              📊 Top Scorers
            </div>
            <div
              v-for="(p, i) in topScorers"
              :key="i"
              class="live-match-card"
              style="padding: 20px 20px"
            >
              <div style="display: flex; align-items: center; gap: 8px">
                <div
                  style="
                    font-family: &quot;Rajdhani&quot;, sans-serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--text-muted);
                    width: 18px;
                  "
                >
                  {{ i + 1 }}
                </div>
                <div
                  style="
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                  "
                >
                  {{ p.icon }}
                </div>
                <div style="flex: 1">
                  <div style="font-size: 11px; font-weight: 600">
                    {{ p.name }}
                  </div>
                  <div style="font-size: 9px; color: var(--text-muted)">
                    {{ p.team }}
                  </div>
                </div>
                <div
                  style="
                    font-family: &quot;Rajdhani&quot;, sans-serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--accent);
                  "
                >
                  {{ p.goals }}
                </div>
              </div>
              <div class="progress-bar" style="margin-top: 5px">
                <div
                  class="progress-fill"
                  :style="{
                    width: (p.goals / topScorers[0].goals) * 100 + '%',
                    background:
                      'linear-gradient(90deg,var(--accent-yellow),var(--accent-live))',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";

const sports = [
  "Basketball",
  "Football",
  "Badminton",
  "Cricket",
  "Golf",
  "NFL",
];
const activeSport = ref("Football");
const activeNav = ref(0);
const navItems = [
  { icon: "⊞", label: "Dashboard" },
  { icon: "⚽", label: "Sports" },
  { icon: "👥", label: "Teams" },
  { icon: "🎬", label: "Video" },
  { icon: "📊", label: "Stats" },
  { icon: "🏆", label: "Trophy" },
  { icon: "⚙", label: "Settings" },
];
const dates = [
  { id: "mon", day: "Mon", date: "21", lbl: false },
  { id: "tue", day: "Tue", date: "22", lbl: false },
  { id: "wed", day: "Wed", date: "23", lbl: false },
  { id: "thu", day: "Thu", date: "24", lbl: true },
  { id: "fri", day: "Fri", date: "25", lbl: false },
  { id: "sat", day: "Sat", date: "26", lbl: false },
  { id: "sun", day: "Sun", date: "27", lbl: false },
];
const activeDate = ref("thu");
const season = ref("2025/2026");
const toggleSeason = () =>
  (season.value = season.value === "2025/2026" ? "2024/2025" : "2025/2026");

let totalSecs = ref(12 * 3600 + 45 * 60 + 24);
const cd = reactive({ h: "00", m: "12", s: "45" });
const cdTick = ref(false);
const elapsedMin = ref(47);
const score = reactive({ home: 0, away: 0 });
const scoreFlash = ref(false);
const fcbVotes = ref(65);
const rmVotes = computed(() => 100 - fcbVotes.value);

const castVote = () => {
  const d = Math.floor(Math.random() * 5) - 2;
  fcbVotes.value = Math.min(88, Math.max(12, fcbVotes.value + d));
};

const tableData = ref([
  {
    name: "Real Madrid",
    icon: "⚪",
    pts: 47,
    w: 15,
    d: 2,
    l: 2,
    gf: 50,
    ga: 19,
    last: ["W", "W", "W", "D", "W"],
    trend: "up",
  },
  {
    name: "Manchester City",
    icon: "🔵",
    pts: 44,
    w: 16,
    d: 2,
    l: 1,
    gf: 44,
    ga: 14,
    last: ["D", "W", "W", "W", "W"],
    trend: "same",
  },
  {
    name: "Barcelona",
    icon: "🔵",
    pts: 44,
    w: 14,
    d: 2,
    l: 3,
    gf: 47,
    ga: 21,
    last: ["W", "D", "W", "W", "L"],
    trend: "up",
  },
  {
    name: "Bayern Munich",
    icon: "🔴",
    pts: 42,
    w: 13,
    d: 3,
    l: 3,
    gf: 45,
    ga: 20,
    last: ["W", "W", "L", "W", "W"],
    trend: "same",
  },
  {
    name: "Liverpool",
    icon: "🔴",
    pts: 40,
    w: 12,
    d: 4,
    l: 3,
    gf: 42,
    ga: 23,
    last: ["W", "W", "D", "L", "W"],
    trend: "up",
  },
  {
    name: "Arsenal",
    icon: "🔴",
    pts: 38,
    w: 11,
    d: 5,
    l: 3,
    gf: 39,
    ga: 24,
    last: ["W", "D", "W", "L", "W"],
    trend: "same",
  },
  {
    name: "PSG",
    icon: "🔴",
    pts: 37,
    w: 13,
    d: 3,
    l: 2,
    gf: 40,
    ga: 17,
    last: ["W", "L", "W", "W", "D"],
    trend: "up",
  },
  {
    name: "Manchester Utd",
    icon: "🔴",
    pts: 34,
    w: 11,
    d: 4,
    l: 3,
    gf: 34,
    ga: 14,
    last: ["W", "D", "L", "W", "W"],
    trend: "down",
  },
  {
    name: "AC Milan",
    icon: "🔴",
    pts: 34,
    w: 10,
    d: 4,
    l: 5,
    gf: 35,
    ga: 26,
    last: ["L", "W", "W", "D", "L"],
    trend: "down",
  },
  {
    name: "Atletico Madrid",
    icon: "🔴",
    pts: 32,
    w: 9,
    d: 5,
    l: 5,
    gf: 32,
    ga: 25,
    last: ["D", "W", "L", "W", "D"],
    trend: "same",
  },
  {
    name: "Borussia Dortmund",
    icon: "🟡",
    pts: 30,
    w: 9,
    d: 3,
    l: 7,
    gf: 30,
    ga: 28,
    last: ["W", "L", "W", "D", "L"],
    trend: "down",
  },
  {
    name: "Napoli",
    icon: "🔵",
    pts: 29,
    w: 8,
    d: 5,
    l: 6,
    gf: 28,
    ga: 24,
    last: ["D", "W", "L", "W", "D"],
    trend: "same",
  },
  {
    name: "Inter Milan",
    icon: "⚫",
    pts: 27,
    w: 9,
    d: 2,
    l: 5,
    gf: 27,
    ga: 20,
    last: ["L", "W", "D", "W", "L"],
    trend: "same",
  },
  {
    name: "Juventus",
    icon: "⚪",
    pts: 26,
    w: 8,
    d: 2,
    l: 7,
    gf: 26,
    ga: 24,
    last: ["W", "L", "W", "D", "L"],
    trend: "down",
  },
  {
    name: "Chelsea",
    icon: "🔵",
    pts: 25,
    w: 7,
    d: 4,
    l: 6,
    gf: 25,
    ga: 23,
    last: ["D", "W", "L", "W", "L"],
    trend: "same",
  },
  {
    name: "Tottenham",
    icon: "⚪",
    pts: 24,
    w: 7,
    d: 3,
    l: 7,
    gf: 24,
    ga: 26,
    last: ["L", "W", "D", "L", "W"],
    trend: "down",
  },
  {
    name: "RB Leipzig",
    icon: "🔴",
    pts: 23,
    w: 6,
    d: 5,
    l: 6,
    gf: 23,
    ga: 22,
    last: ["W", "D", "L", "W", "L"],
    trend: "same",
  },
  {
    name: "Roma",
    icon: "🟡",
    pts: 22,
    w: 6,
    d: 4,
    l: 7,
    gf: 22,
    ga: 25,
    last: ["L", "D", "W", "L", "W"],
    trend: "down",
  },
  {
    name: "Sevilla",
    icon: "⚪",
    pts: 21,
    w: 5,
    d: 6,
    l: 6,
    gf: 21,
    ga: 24,
    last: ["D", "L", "W", "D", "L"],
    trend: "same",
  },
  {
    name: "Ajax",
    icon: "⚪",
    pts: 20,
    w: 5,
    d: 5,
    l: 7,
    gf: 20,
    ga: 27,
    last: ["L", "W", "D", "L", "L"],
    trend: "down",
  },
]);
const upcomingMatches = ref([
  {
    league: "Premier League",
    time: "18:30",
    home: { name: "Spurs", icon: "⚪" },
    away: { name: "Everton", icon: "🔵" },
  },
  {
    league: "La Liga",
    time: "21:00",
    home: { name: "Atletico", icon: "🔴" },
    away: { name: "Sevilla", icon: "⚪" },
  },
]);
const topScorers = ref([
  { name: "Nguyễn Đình Vĩ", team: "Hà Nội", icon: "🇻🇳", goals: 22 },
  {
    name: "Bạch Trường Khang",
    team: "Hoàng Anh Gia Lai",
    icon: "🇻🇳",
    goals: 19,
  },
  { name: "Trịnh Duy Ngọc", team: "Đà Nẵng", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", goals: 17 },
  { name: "Trần Văn Quý", team: "Barcelona", icon: "🇪🇸", goals: 14 },
]);

let iv;
onMounted(() => {
  iv = setInterval(() => {
    // countdown
    if (totalSecs.value > 0) {
      totalSecs.value--;
      const h = Math.floor(totalSecs.value / 3600);
      const m = Math.floor((totalSecs.value % 3600) / 60);
      const s = totalSecs.value % 60;
      cd.h = String(h).padStart(2, "0");
      cd.m = String(m).padStart(2, "0");
      cd.s = String(s).padStart(2, "0");
      cdTick.value = true;
      setTimeout(() => (cdTick.value = false), 200);
    }
    // random goal
    if (Math.random() < 0.004) {
      if (Math.random() < 0.5) score.home++;
      else score.away++;
      scoreFlash.value = true;
      setTimeout(() => (scoreFlash.value = false), 500);
    }
    // live match minutes
    liveMatches.value.forEach((m) => {
      if (m.minute < 90 && Math.random() < 0.08) m.minute++;
    });
    // elapsed
    if (elapsedMin.value < 90 && Math.random() < 0.03) elapsedMin.value++;
  }, 1000);
});
onUnmounted(() => clearInterval(iv));
</script>

<style>
:root {
  --bg-deep: #080d18;
  --bg-dark: #0d1525;
  --bg-card: #111c30;
  --bg-card2: #162038;
  --bg-hover: #1a2845;
  --border: rgba(255, 255, 255, 0.07);
  --accent: #3b82f6;
  --accent2: #06b6d4;
  --accent-live: #ef4444;
  --accent-green: #22c55e;
  --accent-yellow: #f59e0b;
  --text-primary: #e2e8f0;
  --text-secondary: #7c94b6;
  --text-muted: #4a5f7a;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: "Outfit", sans-serif;
  background: var(--bg-deep);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  animation: orbFloat 8s ease-in-out infinite;
}
.orb1 {
  width: 400px;
  height: 400px;
  background: rgba(59, 130, 246, 0.07);
  top: -100px;
  left: 20%;
  animation-delay: 0s;
}
.orb2 {
  width: 300px;
  height: 300px;
  background: rgba(6, 182, 212, 0.05);
  bottom: 10%;
  right: 15%;
  animation-delay: -3s;
}
.orb3 {
  width: 200px;
  height: 200px;
  background: rgba(139, 92, 246, 0.05);
  top: 40%;
  left: 5%;
  animation-delay: -6s;
}
@keyframes orbFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-30px) scale(1.1);
  }
}

.layout {
  display: flex;
  height: 100vh;
  position: relative;
  z-index: 1;
}

/* Sidebar */
.sidebar {
  width: 64px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  gap: 8px;
  flex-shrink: 0;
}
.sidebar-logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 12px;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  animation: logoPulse 3s ease-in-out infinite;
}
@keyframes logoPulse {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 35px rgba(59, 130, 246, 0.7);
  }
}
.nav-item {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
  font-size: 17px;
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.nav-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
}
.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  margin-top: auto;
  cursor: pointer;
  border: 2px solid var(--accent);
  transition: transform 0.2s;
}
.nav-avatar:hover {
  transform: scale(1.1);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Top nav */
.topnav {
  height: 56px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 6px;
  flex-shrink: 0;
  overflow-x: auto;
}
.topnav::-webkit-scrollbar {
  display: none;
}
.brand {
  font-family: "Rajdhani", sans-serif;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, var(--accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-right: 16px;
  white-space: nowrap;
}
.sport-tab {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  white-space: nowrap;
}
.sport-tab:hover {
  color: var(--text-primary);
}
.sport-tab.active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 0 16px rgba(59, 130, 246, 0.4);
}

/* Content */
.content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 270px;
  gap: 0;
  overflow: hidden;
}
.center-panel {
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.right-panel {
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  padding: 14px;
  overflow-y: auto;
}

/* Date strip */
.date-strip {
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--bg-card);
  border-radius: 12px;
  padding: 8px 10px;
  border: 1px solid var(--border);
}
.date-item {
  flex: 1;
  text-align: center;
  padding: 5px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  color: var(--text-muted);
}
.date-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.date-item.active {
  background: rgba(59, 130, 246, 0.2);
  color: var(--accent);
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.date-item .day {
  font-size: 9px;
}
.date-item .dt {
  font-size: 13px;
  font-weight: 600;
}
.date-item .lbl {
  font-size: 9px;
  font-family: "Rajdhani", sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent2);
}

/* Match card */
.match-card {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 48px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  animation: slideUp 0.5s ease forwards;
}
.match-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}
.match-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(59, 130, 246, 0.05),
    transparent 70%
  );
  pointer-events: none;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--accent-live);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
}
.live-dot {
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.7);
  }
}

.match-body {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto minmax(120px, 1fr);
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.team-name {
  font-family: "Rajdhani", sans-serif;
  font-size: 45px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.team-logo {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: var(--bg-card2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 2px solid var(--border);
  position: relative;
  transition: all 0.3s;
}
.team-logo-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}
.team:hover .team-logo {
  border-color: var(--accent);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}
.team-name {
  font-family: "Rajdhani", sans-serif;
  font-size: 17px;
  font-weight: 700;
  text-align: center;
}

.scoreboard {
  text-align: center;
}
.countdown {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
  font-family: "Rajdhani", sans-serif;
}
.cd-block {
  text-align: center;
}
.cd-val {
  font-size: 20px;
  font-weight: 700;
  background: var(--bg-card2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 7px;
  display: block;
  transition: color 0.15s;
}
.cd-val.tick {
  color: var(--accent2);
}
.cd-label {
  font-size: 8px;
  color: var(--text-muted);
  margin-top: 1px;
}
.cd-sep {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  padding-bottom: 14px;
}
.score {
  font-family: "Rajdhani", sans-serif;
  font-size: 32px;
  font-weight: 700;
  background: var(--bg-card2);
  border: 1px solid var(--border);
  padding: 10px 18px;
  border-radius: 12px;
  letter-spacing: 4px;
  position: relative;
  overflow: hidden;
}
.score::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  animation: scanline 2.5s linear infinite;
}
@keyframes scanline {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.vote-section {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.vote-side {
  display: flex;
  align-items: center;
  gap: 6px;
}
.vote-avatars {
  display: flex;
}
.vote-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid var(--bg-card);
  margin-left: -5px;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
}
.vote-avatar:first-child {
  margin-left: 0;
}
.vote-text {
  font-size: 10px;
  color: var(--text-secondary);
}
.vote-text strong {
  color: var(--accent-green);
}
.vote-btn {
  padding: 7px 18px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Outfit", sans-serif;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  white-space: nowrap;
}
.vote-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
}
.vote-btn:active {
  transform: scale(0.97);
}
.vote-bar-wrap {
  display: flex;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
}
.vote-bar-l {
  background: var(--accent);
  border-radius: 2px 0 0 2px;
  transition: width 1s ease;
}
.vote-bar-r {
  background: var(--accent-live);
  border-radius: 0 2px 2px 0;
  margin-left: auto;
  transition: width 1s ease;
}

/* Table */
.table-card {
  background: var(--bg-card);
  border-radius: 26px;
  border: 1px solid var(--border);
  overflow: hidden;
  animation: slideUp 0.5s ease 0.15s both;
  max-height
  : 2100px;   /* to hơn */
  padding: 10px;
  height: 1000px;
}
.table-header {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}
.table-title {
  font-family: "Rajdhani", sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.season-badge {
  background: var(--bg-card2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}
.season-badge:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.table-cols {
  display: grid;
  grid-template-columns: 38px 1fr 36px 28px 28px 28px 36px 36px 76px;
  gap: 2px;
  padding: 6px 12px;
  font-size: 9px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.table-row {
  display: grid;
  grid-template-columns: 38px 1fr 36px 28px 28px 28px 36px 36px 76px;
  gap: 2px;
  padding: 9px 12px;
  font-size: 11px;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: background 0.2s;
  animation: slideUp 0.4s ease both;
}
.table-row:hover {
  background: var(--bg-hover);
}
.table-row:last-child {
  border-bottom: none;
}
.table-row:nth-child(1) {
  animation-delay: 0.1s;
}
.table-row:nth-child(2) {
  animation-delay: 0.15s;
}
.table-row:nth-child(3) {
  animation-delay: 0.2s;
}
.table-row:nth-child(4) {
  animation-delay: 0.25s;
}
.table-row:nth-child(5) {
  animation-delay: 0.25s;
}
.table-row:nth-child(6) {
  animation-delay: 0.25s;
}
.pos-num {
  font-family: "Rajdhani", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
}
.rank-up {
  color: var(--accent-green);
  font-size: 9px;
}
.rank-down {
  color: var(--accent-live);
  font-size: 9px;
}
.rank-same {
  color: var(--text-muted);
  font-size: 9px;
}
.team-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}
.team-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.team-cell-name {
  font-weight: 500;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pts {
  font-family: "Rajdhani", sans-serif;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
}
.sv {
  text-align: center;
  color: var(--text-secondary);
  font-size: 10px;
}
.last-matches {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
}
.match-chip {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 800;
  flex-shrink: 0;
  transition: transform 0.15s;
  cursor: pointer;
}
.match-chip:hover {
  transform: scale(1.2);
}
.chip-w {
  background: rgba(34, 197, 94, 0.2);
  color: var(--accent-green);
}
.chip-d {
  background: rgba(245, 158, 11, 0.2);
  color: var(--accent-yellow);
}
.chip-l {
  background: rgba(239, 68, 68, 0.2);
  color: var(--accent-live);
}

/* Right panel */
.panel-title {
  font-family: "Rajdhani", sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 7px;
}
.live-match-card {
  background: var(--bg-card2);
  border-radius: 10px;
  padding: 11px;
  margin-bottom: 7px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.2s;
  animation: slideUp 0.4s ease both;
}
.live-match-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(-2px);
}
.live-match-card:nth-child(1) {
  animation-delay: 0.1s;
}
.live-match-card:nth-child(2) {
  animation-delay: 0.2s;
}
.live-match-card:nth-child(3) {
  animation-delay: 0.3s;
}
.lm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.lm-time {
  font-size: 10px;
  color: var(--accent2);
  font-weight: 600;
}
.lm-teams {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lm-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
}
.lm-logo {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  border: 1px solid var(--border);
}
.lm-name {
  font-size: 9px;
  font-weight: 500;
  text-align: center;
}
.lm-score {
  font-family: "Rajdhani", sans-serif;
  font-size: 18px;
  font-weight: 700;
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 3px 9px;
  border-radius: 6px;
}
.progress-bar {
  height: 2px;
  background: var(--bg-card);
  border-radius: 2px;
  margin-top: 7px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  border-radius: 2px;
  transition: width 1s ease;
  box-shadow: 0 0 6px var(--accent);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--bg-hover);
  border-radius: 3px;
}

/* Pulse animation for score goal */
@keyframes goalFlash {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
    color: var(--accent-green);
  }
}
.score.goal {
  animation: goalFlash 0.4s ease;
}

/* Transition for sport tabs */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
