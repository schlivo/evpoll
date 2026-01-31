<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SvgIcon from './SvgIcon.vue'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navLinks = [
  { path: '/', label: 'Accueil', icon: 'home' },
  { path: '/comprendre', label: 'Comprendre', icon: 'lightbulb' },
  { path: '/options', label: 'Options', icon: 'bolt' },
  { path: '/aides', label: 'Aides', icon: 'euro' },
  { path: '/faq', label: 'FAQ', icon: 'help' },
]

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : ''
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

watch(() => route.path, () => {
  closeMobileMenu()
})
</script>

<template>
  <header class="header" :class="{ 'menu-open': mobileMenuOpen }">
    <div class="container">
      <nav class="nav">
        <router-link to="/" class="logo" @click="closeMobileMenu">
          <span class="logo-icon">
            <SvgIcon name="bolt" :size="24" />
          </span>
          <span class="logo-text">IRVE Copropriété</span>
        </router-link>

        <button
          class="mobile-toggle"
          @click="toggleMobileMenu"
          :aria-expanded="mobileMenuOpen"
          aria-label="Menu"
        >
          <span class="hamburger" :class="{ open: mobileMenuOpen }"></span>
        </button>

        <div class="nav-links-desktop">
          <router-link
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            :class="{ active: route.path === link.path }"
          >
            {{ link.label }}
          </router-link>
          <router-link to="/enquete" class="nav-cta">
            Participer
          </router-link>
        </div>
      </nav>
    </div>

    <Transition name="overlay">
      <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
    </Transition>

    <Transition name="menu">
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-content">
          <TransitionGroup name="stagger" tag="div" class="mobile-nav-links">
            <router-link
              v-for="(link, index) in navLinks"
              :key="link.path"
              :to="link.path"
              class="mobile-nav-item"
              :class="{ active: route.path === link.path }"
              :style="{ '--delay': index * 0.05 + 's' }"
              @click="closeMobileMenu"
            >
              <span class="mobile-nav-icon">
                <SvgIcon :name="link.icon" :size="24" />
              </span>
              <span class="mobile-nav-label">{{ link.label }}</span>
              <span class="mobile-nav-arrow">
                <SvgIcon name="chevron-right" :size="20" />
              </span>
            </router-link>
          </TransitionGroup>

          <div class="mobile-cta-wrapper" :style="{ '--delay': navLinks.length * 0.05 + 's' }">
            <router-link
              to="/enquete"
              class="mobile-cta"
              @click="closeMobileMenu"
            >
              <span class="mobile-cta-icon">
                <SvgIcon name="clipboard" :size="24" />
              </span>
              <span>Participer à l'enquête</span>
            </router-link>
            <p class="mobile-cta-hint">Chaque réponse compte !</p>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.header {
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header.menu-open {
  background: var(--color-bg);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.125rem;
  color: var(--color-text);
  z-index: 110;
}

.logo:hover {
  color: var(--color-primary);
}

.logo-icon {
  color: var(--color-primary);
  display: flex;
  align-items: center;
}

.mobile-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 110;
  border-radius: var(--radius);
  transition: background 0.2s;
}

.mobile-toggle:hover {
  background: var(--color-bg-alt);
}

.hamburger {
  position: relative;
  width: 22px;
  height: 2px;
  background: var(--color-text);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-text);
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hamburger::before { top: -7px; }
.hamburger::after { top: 7px; }

.hamburger.open {
  background: transparent;
}

.hamburger.open::before {
  top: 0;
  transform: rotate(45deg);
}

.hamburger.open::after {
  top: 0;
  transform: rotate(-45deg);
}

.nav-links-desktop {
  display: none;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 90;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.mobile-menu {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg);
  z-index: 95;
  overflow-y: auto;
}

.menu-enter-active,
.menu-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-enter-from,
.menu-leave-to {
  transform: translateY(-100%);
}

.mobile-menu-content {
  padding: 1.5rem 1rem 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.2s ease;
  animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: var(--delay);
}

.mobile-nav-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  transform: translateX(4px);
}

.mobile-nav-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.mobile-nav-item.active .mobile-nav-label {
  color: var(--color-primary-dark);
}

.mobile-nav-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-alt);
  border-radius: var(--radius);
  color: var(--color-text-light);
}

.mobile-nav-item.active .mobile-nav-icon {
  background: var(--color-primary);
  color: white;
}

.mobile-nav-label {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 500;
}

.mobile-nav-arrow {
  color: var(--color-text-muted);
  transition: transform 0.2s;
  display: flex;
  align-items: center;
}

.mobile-nav-item:hover .mobile-nav-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

.mobile-cta-wrapper {
  margin-top: 2rem;
  text-align: center;
  animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: var(--delay);
}

.mobile-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: var(--radius-lg);
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.mobile-cta:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.mobile-cta-icon {
  display: flex;
  align-items: center;
}

.mobile-cta-hint {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-enter-active {
  animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  animation-delay: var(--delay);
}

@media (min-width: 768px) {
  .mobile-toggle {
    display: none;
  }

  .mobile-menu,
  .mobile-overlay {
    display: none !important;
  }

  .nav-links-desktop {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .nav-links-desktop a {
    padding: 0.5rem 0.75rem;
    color: var(--color-text);
    border-radius: var(--radius);
    transition: all 0.2s;
    text-decoration: none;
  }

  .nav-links-desktop a:hover {
    background: var(--color-bg-alt);
    color: var(--color-primary);
  }

  .nav-links-desktop a.active {
    color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .nav-links-desktop .nav-cta {
    margin-left: 0.5rem;
    background: var(--color-primary);
    color: white;
    font-weight: 500;
  }

  .nav-links-desktop .nav-cta:hover {
    background: var(--color-primary-dark);
    color: white;
  }
}
</style>
