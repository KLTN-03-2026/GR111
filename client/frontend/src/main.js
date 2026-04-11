import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import AuthLayout from './layouts/AuthLayout.vue'
import ClientLayout from './layouts/ClientLayout.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import OwnerLayout from './layouts/OwnerLayout.vue'
import 'vue3-toastify/dist/index.css';

const app = createApp(App)
app.use(router)
app.component("default-layout", ClientLayout);
app.component("admin-layout", AdminLayout);
app.component("owner-layout", OwnerLayout);
app.component("nocore-layout", AuthLayout);
app.mount("#app")
