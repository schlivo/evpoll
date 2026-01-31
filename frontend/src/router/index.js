import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/comprendre',
    name: 'comprendre',
    component: () => import('../views/ComprendreView.vue')
  },
  {
    path: '/options',
    name: 'options',
    component: () => import('../views/OptionsView.vue')
  },
  {
    path: '/aides',
    name: 'aides',
    component: () => import('../views/AidesView.vue')
  },
  {
    path: '/enquete',
    name: 'enquete',
    component: () => import('../views/EnqueteView.vue')
  },
  {
    path: '/faq',
    name: 'faq',
    component: () => import('../views/FaqView.vue')
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue'),
    meta: { standalone: true }
  },
  {
    path: '/flyer',
    name: 'flyer',
    component: () => import('../views/FlyerView.vue'),
    meta: { standalone: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
