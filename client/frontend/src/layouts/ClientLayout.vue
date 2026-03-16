<template>
  <div class="wrapper">
    <header>
      <ClientHeader></ClientHeader>
    </header>
    <router-view></router-view>
    <div class="overlay toggle-icon"></div>
    <a href="javaScript:;" class="back-to-top"
      ><i class="bx bxs-up-arrow-alt"></i
    ></a>
     <footer>
      <ClientFooter></ClientFooter>
    </footer>
    
  </div>
</template>
<script>
import ClientFooter from "../components/layout/ClientFooter.vue";
import ClientHeader from "../components/layout/ClientHeader.vue";

import "../assets/assets/js/bootstrap.bundle.min.js";
import "../assets/assets/js/jquery.min.js";
import "../assets/assets/plugins/simplebar/js/simplebar.min.js";
import "../assets/assets/plugins/metismenu/js/metisMenu.min.js";
import "../assets/assets/plugins/perfect-scrollbar/js/perfect-scrollbar.js";
import "../assets/assets/js/index.js";
import "../assets/assets/js/app.js";
export default {
  name: "ClientLayout",
  components: {
    ClientHeader,
    ClientFooter,
  },
};
</script>
<style>
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap");
@import "../assets/assets/plugins/simplebar/css/simplebar.css";
@import "../assets/assets/plugins/perfect-scrollbar/css/perfect-scrollbar.css";
@import "../assets/assets/css/bootstrap.min.css";
@import "../assets/assets/css/bootstrap-extended.css";
@import "../assets/assets/css/app.css";
@import "../assets/assets/css/icons.css";
@import "../assets/assets/css/dark-theme.css";
@import "../assets/assets/css/semi-dark.css";
@import "../assets/assets/css/header-colors.css";
</style>
