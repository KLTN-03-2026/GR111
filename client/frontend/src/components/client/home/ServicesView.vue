<template>
  <section class="services-section bg-light" :class="{ 'visible': visible }">
    <div class="container">
      <div class="services-header">
        <h2 class="services-title">DỊCH VỤ CỦA CHÚNG TÔI</h2>
        <p class="services-subtitle">Những dịch vụ tiện ích từ chúng tôi giúp bạn có trải nghiệm tốt nhất khi đặt sân.</p>
      </div>
      <div class="row">
        <div class="col-md-4 mb-4" v-for="(service, index) in services" :key="index">
          <div class="card h-100 shadow-sm service-card" :style="{ transitionDelay: (0.2 + index * 0.2) + 's' }">
            <div class="card-body text-center">
              <i :class="service.icon + ' fa-3x mb-3'" :style="{ color: 'rgb(22, 163, 74)' }"></i>
              <h5 class="card-title">{{ service.title }}</h5>
              <p class="card-text">{{ service.description }}</p>
              <a href="#" class="btn btn-custom">{{ service.btnText }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ServicesView',
  data() {
    return {
      visible: false,
      services: [
        {
          title: 'Đặt Sân Bóng Đá',
          description: 'Đặt sân bóng đá dễ dàng với nhiều lựa chọn thời gian và địa điểm.',
          icon: 'fas fa-futbol',
          btnText: 'Đặt Ngay'
        },
        {
          title: 'Sân Tennis',
          description: 'Sân tennis chất lượng cao cho mọi cấp độ người chơi.',
          icon: 'fas fa-table-tennis',
          btnText: 'Xem Chi Tiết'
        },
        {
          title: 'Đội Nóng',
          description: 'Tìm đối thủ hoặc tham gia đội bóng ngay lập tức.',
          icon: 'fas fa-users',
          btnText: 'Tham Gia'
        }
      ]
    }
  },
  mounted() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.visible = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(this.$el);
  }
}
</script>

<style scoped>
.services-section {
  padding: 100px 0;
  overflow: hidden;
}

.services-header {
  text-align: center;
  margin-bottom: 60px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.services-section.visible .services-header {
  opacity: 1;
  transform: translateY(0);
}

.services-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 900;
  font-size: 32px;
  letter-spacing: 2px;
  color: #1a1a2e;
  margin-bottom: 15px;
  text-transform: uppercase;
}

.services-subtitle {
  font-size: 16px;
  color: #555;
  max-width: 700px;
  margin: 0 auto;
}

.service-card {
  border: none;
  border-radius: 16px;
  padding: 20px;
  background: #ffffff;
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s ease, box-shadow 0.3s ease;
}

.services-section.visible .service-card {
  opacity: 1;
  transform: translateY(0);
}

.service-card:hover {
  transform: translateY(-12px) !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
}

.card-title {
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.btn-custom {
  background-color: rgb(22, 163, 74);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 13px;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.btn-custom:hover {
  background-color: rgb(15, 118, 52);
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(22, 163, 74, 0.3);
}
</style>
