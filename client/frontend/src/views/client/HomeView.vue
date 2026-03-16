<template>
  <div>
    <!-- Hero Section -->
    <HeroView />
<CitiesView/>
    <div class="container mt-4">
      <h4 class="mb-4 fw-bold">Sân gần bạn</h4>

      <div class="row">
        <template v-for="(venue, index) in danhSachSan" :key="index">
          <div class="col-lg-12 mb-4">
             <VenueCard :venue="venue" />
          </div>
        </template>
      </div>
    </div>
 
  <BlogView/>
     <!-- Services Section -->
    <section class="bg-light" style="margin-top: 50px">
      <div class="container">
        <h2 class="text-center mb-4">Dịch Vụ Của Chúng Tôi</h2>
        <div class="row">
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <i class="fas fa-futbol fa-3x text-primary mb-3"></i>
                <h5 class="card-title">Đặt Sân Bóng Đá</h5>
                <p class="card-text">
                  Đặt sân bóng đá dễ dàng với nhiều lựa chọn thời gian và địa
                  điểm.
                </p>
                <a href="#" class="btn btn-primary">Đặt Ngay</a>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <i class="fas fa-table-tennis fa-3x text-success mb-3"></i>
                <h5 class="card-title">Sân Tennis</h5>
                <p class="card-text">
                  Sân tennis chất lượng cao cho mọi cấp độ người chơi.
                </p>
                <a href="#" class="btn btn-success">Xem Chi Tiết</a>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm">
              <div class="card-body text-center">
                <i class="fas fa-users fa-3x text-warning mb-3"></i>
                <h5 class="card-title">Đội Nóng</h5>
                <p class="card-text">
                  Tìm đối thủ hoặc tham gia đội bóng ngay lập tức.
                </p>
                <a href="#" class="btn btn-warning">Tham Gia</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import CitiesView from "../../components/client/home/CitiesView.vue";
import HeroView from "../../components/client/home/HeroView.vue";
import BlogView from "../../components/client/home/BlogView.vue";
import VenueCard from "../../components/client/booking/VenueCard.vue";

export default {
  components: {
    HeroView,
    CitiesView,
    BlogView,
    VenueCard,
  },
  data() {
    return {
      danhSachSan: [
        {
          id: "c1",
          name: "Sân Cầu Lông Thanh Xuân",
          address: "Thanh Khê, Đà Nẵng",
          image: "https://golfbooking.com.vn/images/slideshow/2026/01/13/original/uu-dai-dac-quyen-intergolf-slice-web_1768300163.webp",
          isPartner: true,
          hasOnlineBooking: true,
          format: "Sân 1",
          surface: "Thảm chuyên dụng",
          type: "Cầu lông",
          distance: 1.2,
          changingRoom: true,
          freeParking: true,
          availableSlots: "Còn 5 khung giờ hôm nay",
          rating: 4.6
        },
        {
          id: "c2",
          name: "Sân Bóng Mini Hòa Xuân",
          address: "Cẩm Lệ, Đà Nẵng",
          image: "https://golfbooking.com.vn/images/slideshow/2026/02/27/original/z7569511046253_0a3ea76709deb74d41ed2c087b572469_1772186728.webp",
          isPartner: false,
          hasOnlineBooking: true,
          format: "Sân 5 người",
          surface: "Cỏ nhân tạo",
          type: "Bóng đá",
          distance: 2.1,
          changingRoom: true,
          freeParking: true,
          availableSlots: "Còn 3 khung giờ hôm nay",
          rating: 4.5
        },
        {
          id: "c3",
          name: "CLB Cầu Lông Tuyên Sơn",
          address: "Hải Châu, Đà Nẵng",
          image: "https://golfbooking.com.vn/images/slideshow/2026/02/13/original/z7531562292224_6d6a7e6283e06bcefe65f27652943f94_1770978712.webp",
          isPartner: true,
          hasOnlineBooking: false,
          format: "Sân 2",
          surface: "Gỗ chuyên dụng",
          type: "Cầu lông",
          distance: 3.4,
          changingRoom: true,
          freeParking: false,
          availableSlots: "",
          rating: 4.7
        },
      ],
    };
  },
};
</script>

<style scoped>
.carousel {
  height: 70vh;
  overflow: hidden;
}

.carousel-item img {
  height: 100%;
  object-fit: cover;
}

.carousel-caption {
  position: relative;
  width: auto;
  max-width: 520px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  text-align: center;
  margin: 20px auto;
}

.carousel-caption h5 {
  font-size: 2rem;
  font-weight: bold;
}

.carousel-caption p {
  font-size: 1.2rem;
}

.card {
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-10px);
}

.card:hover {
  transform: translateY(-4px);
  transition: 0.2s;
}
</style>
