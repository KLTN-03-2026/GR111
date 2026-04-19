<template>
  <section class="mobile-app-promo" aria-labelledby="promo-heading">
    <div class="promo-container">
      <div class="promo-content">
        <header class="promo-header">
          <h2 id="promo-heading" class="promo-title">
            PLAYFINDER <br />
            <span class="highlight">MOBILE APP</span>
          </h2>
        </header>

        <ul class="feature-list" role="list">
          <li class="feature-item">
            <svg class="check-icon" viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Instantly book sports facilities across the UK
          </li>
          <li class="feature-item">
            <svg class="check-icon" viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Split Payments with your friends using PaySplit
          </li>
          <li class="feature-item">
            <svg class="check-icon" viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Keep track of upcoming bookings
          </li>
          <li class="feature-item">
            <svg class="check-icon" viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Favorite nearby venues for easy booking
          </li>
        </ul>

        <div class="app-buttons">
          <a href="#" class="app-btn-link" aria-label="Download on App Store">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" class="app-store-badge" />
          </a>
          <a href="#" class="app-btn-link" aria-label="Get it on Google Play">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" class="google-play-badge" />
          </a>
        </div>
      </div>

      <div class="promo-mockup">
        <div class="mockup-wrapper">
          <img src="/chat-bot.png" alt="Playfinder Mobile App Mockups" class="mockup-img" />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "MobileAppPromo",
};
</script>

<style scoped>
.mobile-app-promo {
  --deep-purple: #2d1b4d;
  --bright-green: #16a34a;
  --text-white: #ffffff;
  
  background: linear-gradient(105deg, var(--deep-purple) 0%, var(--deep-purple) 45%, #1ed760 45.1%, var(--bright-green) 100%);
  color: var(--text-white);
  padding: 40px 0;
  overflow: hidden;
  position: relative;
}

.promo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  align-items: center;
  gap: 60px;
}

.promo-content {
  flex: 1;
  z-index: 2;
  animation: fadeInRight 0.8s ease-out;
}

.promo-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  text-transform: uppercase;
}

.highlight {
  color: #fff;
  opacity: 0.95;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0.9;
}

.check-icon {
  width: 20px;
  height: 20px;
  stroke: var(--bright-green);
  stroke-width: 3;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.app-buttons {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.app-btn-link img {
  height: 48px;
  transition: transform 0.2s ease;
}

.app-btn-link img:hover {
  transform: translateY(-3px);
}

.promo-mockup {
  flex: 1.2;
  position: relative;
  display: flex;
  justify-content: flex-end;
  animation: fadeInLeft 0.8s ease-out;
}

.mockup-wrapper {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.mockup-img {
  width: 120%;
  height: auto;
  transform: scale(1);
  filter: drop-shadow(0 20px 50px rgba(0,0,0,0.3));
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 1024px) {
  .promo-container {
    flex-direction: column;
    text-align: center;
    padding: 60px 24px;
    gap: 40px;
  }
  
  .mobile-app-promo {
    background: linear-gradient(180deg, var(--deep-purple) 0%, var(--deep-purple) 60%, var(--bright-green) 100%);
  }
  
  .feature-item {
    justify-content: center;
  }
  
  .app-buttons {
    justify-content: center;
  }
  
  .promo-mockup {
    justify-content: center;
  }
  
  .mockup-img {
    width: 100%;
    transform: none;
  }
}
</style>
