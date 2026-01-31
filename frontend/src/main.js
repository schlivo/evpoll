import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Minimal router just to prevent router-link errors
// The actual navigation is handled by scroll in App.vue
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/:pathMatch(.*)*', component: { template: '' } }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
