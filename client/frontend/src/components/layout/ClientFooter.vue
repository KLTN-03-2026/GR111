<template>
  <footer class="site-footer">
    <!-- 1. Top CTA Banner (Social + Newsletter) -->
    <div class="footer-cta-banner">
      <div class="banner-social">
        <div class="social-wrapper">
          <a href="#" class="social-icon" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="#" class="social-icon" aria-label="Twitter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
          </a>
          <a href="#" class="social-icon" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          <a href="#" class="social-icon" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>
      </div>
      
      <div class="banner-newsletter">
        <div class="newsletter-wrapper">
          <span class="newsletter-title">NHẬN TIN TỨC MỚI NHẤT</span>
          <form class="newsletter-form" @submit.prevent>
            <input type="email" placeholder="Email của bạn" aria-label="Email address" required />
            <button type="submit">ĐĂNG KÝ</button>
          </form>
        </div>
      </div>
    </div>

    <!-- 2. Main Footer Content -->
    <div class="footer-main">
      <div class="container container--footer">
        <div class="footer-grid">
          <!-- Column 1: Links -->
          <div class="footer-col">
            <h3 class="footer-heading">LIÊN KẾT NHANH</h3>
            <div class="heading-underline"></div>
            <p class="footer-subtext">Tìm kiếm những gì bạn cần trong nháy mắt</p>
            <ul class="footer-links">
              <li><router-link to="/">Playfinder</router-link></li>
              <li><router-link to="/about">Giới thiệu</router-link></li>
              <li><router-link to="/posts">Tin tức</router-link></li>
              <li><router-link to="/app">Ứng dụng</router-link></li>
              <li><router-link to="/contact">Liên hệ</router-link></li>
              <li><router-link to="/terms">Điều khoản & Điều kiện</router-link></li>
              <li><router-link to="/privacy">Chính sách bảo mật</router-link></li>
            </ul>
          </div>

          <!-- Column 2: Booking Info -->
          <div class="footer-col">
            <h3 class="footer-heading">ĐẶT SÂN THỂ THAO</h3>
            <div class="heading-underline"></div>
            <p class="footer-subtext">Tìm kiếm cơ sở thể thao tại thành phố của bạn</p>
            <ul class="footer-links">
              <li><router-link to="/search?city=Da+Nang">Đà Nẵng</router-link></li>
              <li><router-link to="/search?city=Hanoi">Hà Nội</router-link></li>
              <li><router-link to="/search?city=Ho+Chi+Minh">TP. Hồ Chí Minh</router-link></li>
              <li><router-link to="/search?city=Can+Tho">Cần Thơ</router-link></li>
              <li><router-link to="/search?city=Hai+Phong">Hải Phòng</router-link></li>
              <li><router-link to="/search?city=Hue">Huế</router-link></li>
              <li><router-link to="/search?city=Da+Lat">Đà Lạt</router-link></li>
            </ul>
          </div>

          <!-- Column 3: Operators Box -->
          <div class="footer-col footer-col--featured">
            <div class="featured-box">
              <h3 class="footer-heading footer-heading--dark">DÀNH CHO CHỦ SÂN</h3>
              <div class="featured-item">
                <a href="#" class="featured-link">Mở rộng tiếp cận người chơi</a>
                <p>Đưa sân của bạn lên nền tảng đặt sân hàng đầu giúp hàng nghìn người tìm thấy nơi chơi thể thao. Chúng tôi sẽ giúp bạn lấp đầy thời gian trống và tiếp cận đối tượng khách hàng mới.</p>
              </div>
              <div class="featured-item">
                <a href="#" class="featured-link">Quản lý đặt sân với Bookteq</a>
                <p>Bookteq là phần mềm đặt chỗ hoàn chỉnh dành cho các đơn vị vận hành. Quản lý đặt sân theo thời gian thực, thanh toán và khách hàng với dịch vụ hàng đầu của chúng tôi.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating status/login indicator (optional, matching the 'keyhole' in image) -->
    <div class="footer-floating-indicator">
      <router-link to="/login" title="Đăng nhập chủ sân" class="indicator-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z"/></svg>
      </router-link>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  width: 100%;
  background: #fff;
  font-family: 'Inter', sans-serif;
  color: #374151;
  position: relative;
}

/* 1. CTA Banner */
.footer-cta-banner {
  display: flex;
  width: 100%;
}

.banner-social {
  flex: 1.2;
  background-color: var(--green, #4ade80);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
}

.social-wrapper {
  display: flex;
  gap: 30px;
}

.social-icon {
  color: #1f2937;
  transition: transform 0.2s, opacity 0.2s;
}

.social-icon svg {
  width: 32px;
  height: 32px;
}

.social-icon:hover {
  transform: translateY(-3px);
  opacity: 0.8;
}

.banner-newsletter {
  flex: 1;
  background-color: #1e1b4b; /* Dark Navy */
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 30px 40px 30px 80px;
  color: #fff;
}

/* The diagonal cutoff */
.banner-newsletter::before {
  content: "";
  position: absolute;
  top: 0;
  left: -40px;
  width: 80px;
  height: 100%;
  background-color: #1e1b4b;
  transform: skewX(-15deg);
  z-index: 1;
}

.newsletter-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.newsletter-title {
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.newsletter-form {
  display: flex;
  gap: 15px;
  width: 100%;
}

.newsletter-form input {
  flex: 1;
  padding: 10px 15px;
  background: #fff;
  border: none;
  font-size: 0.95rem;
  color: #1f2937;
}

.newsletter-form button {
  background-color: var(--green, #4ade80);
  color: #1f2937;
  border: none;
  font-weight: 800;
  font-size: 0.85rem;
  padding: 0 20px;
  cursor: pointer;
  transition: filter 0.2s;
}

.newsletter-form button:hover {
  filter: brightness(1.1);
}

/* 2. Main Content */
.footer-main {
  padding: 80px 0 100px;
}

.container--footer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.6fr;
  gap: 60px;
}

.footer-heading {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 8px;
  color: #111827;
  letter-spacing: -0.01em;
}

.footer-heading--dark {
  margin-bottom: 25px;
}

.heading-underline {
  width: 100%;
  height: 4px;
  background-color: var(--green, #4ade80);
  margin-bottom: 20px;
}

.footer-subtext {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 25px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-links a {
  text-decoration: none;
  color: #059669; /* Slightly darker green for readability */
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #047857;
  text-decoration: underline;
}

/* Featured Box */
.featured-box {
  background: #e5e7eb;
  padding: 40px;
  border-radius: 4px;
  height: 100%;
}

.featured-item {
  margin-bottom: 25px;
}

.featured-item:last-child {
  margin-bottom: 0;
}

.featured-link {
  display: block;
  font-weight: 600;
  color: #059669;
  text-decoration: none;
  margin-bottom: 5px;
  font-size: 1rem;
}

.featured-link:hover {
  text-decoration: underline;
}

.featured-item p {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
}

/* 3. Floating indicator */
.footer-floating-indicator {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

.indicator-link {
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.indicator-link svg {
  width: 20px;
  height: 20px;
}

.indicator-link:hover {
  background: #f9fafb;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .footer-col--featured {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .footer-cta-banner {
    flex-direction: column;
  }
  .banner-newsletter::before {
    display: none;
  }
  .banner-newsletter {
    padding: 30px 20px;
  }
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .footer-col--featured {
    grid-column: span 1;
  }
  .featured-box {
    padding: 25px;
  }
}
</style>