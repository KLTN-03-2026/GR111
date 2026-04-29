import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import AuthLayout from './layouts/AuthLayout.vue'
import ClientLayout from './layouts/ClientLayout.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import OwnerLayout from './layouts/OwnerLayout.vue'
import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css';

const app = createApp(App)
app.use(Vue3Toastify, {
  autoClose: 4000,
  position: 'top-right',
  transition: 'slide',
  hideProgressBar: false,
  theme: 'colored',
})
app.use(router)
app.component("default-layout", ClientLayout);
app.component("admin-layout", AdminLayout);
app.component("owner-layout", OwnerLayout);
app.component("nocore-layout", AuthLayout);
app.mount("#app")
