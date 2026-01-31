<script setup>
import { ref, provide, onMounted, onUnmounted, nextTick } from 'vue'
import SvgIcon from './components/SvgIcon.vue'

// Import all views as components
import HomeView from './views/HomeView.vue'
import ComprendreView from './views/ComprendreView.vue'
import OptionsView from './views/OptionsView.vue'
import AidesView from './views/AidesView.vue'
import FaqView from './views/FaqView.vue'
import EnqueteView from './views/EnqueteView.vue'

const sections = [
  { id: 'accueil', label: 'Accueil', icon: 'home', component: HomeView },
  { id: 'comprendre', label: 'Comprendre', icon: 'lightbulb', component: ComprendreView },
  { id: 'options', label: 'Options', icon: 'bolt', component: OptionsView },
  { id: 'aides', label: 'Financement', icon: 'euro', component: AidesView },
  { id: 'faq', label: 'FAQ', icon: 'help', component: FaqView },
]

const currentSection = ref(0)
const isEnqueteOpen = ref(false)
const scrollContainer = ref(null)
const isScrolling = ref(false)
const lastScrollTop = ref(0)
const headerHidden = ref(false)
const scrollAnimationId = ref(null)
const scrollEndTimeout = ref(null)
const lastScrollTime = ref(0)
const scrollVelocity = ref(0)

/** Ease-in-out cubic for smooth start/end. */
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** Ease-out for snap animation */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const openEnquete = () => {
  isEnqueteOpen.value = true
  document.body.style.overflow = 'hidden'
}

// Provide openEnquete to all child components
provide('openEnquete', openEnquete)

// Provide section navigation
const navigateToSection = (sectionId) => {
  const index = sections.findIndex(s => s.id === sectionId)
  if (index !== -1) {
    scrollToSection(index)
  }
}
provide('navigateToSection', navigateToSection)

const closeEnquete = () => {
  isEnqueteOpen.value = false
  document.body.style.overflow = ''
}
provide('closeEnquete', closeEnquete)

const SCROLL_DURATION_MS = 1100

const scrollToSection = (index) => {
  const container = scrollContainer.value
  const section = container?.children[index]
  if (!container || !section) return

  if (scrollAnimationId.value != null) {
    cancelAnimationFrame(scrollAnimationId.value)
    scrollAnimationId.value = null
  }

  const startTop = container.scrollTop
  const targetTop = section.offsetTop
  if (startTop === targetTop) {
    currentSection.value = index
    location.hash = sections[index].id
    return
  }

  isScrolling.value = true
  currentSection.value = index
  location.hash = sections[index].id
  headerHidden.value = false

  const startTime = performance.now()

  const tick = (now) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1)
    const eased = easeInOutCubic(progress)
    container.scrollTop = startTop + (targetTop - startTop) * eased

    if (progress < 1) {
      scrollAnimationId.value = requestAnimationFrame(tick)
    } else {
      container.scrollTop = targetTop
      isScrolling.value = false
      scrollAnimationId.value = null
    }
  }

  scrollAnimationId.value = requestAnimationFrame(tick)
}

/** Find the nearest section to snap to based on scroll position */
const findNearestSection = (scrollTop, viewportHeight) => {
  const container = scrollContainer.value
  if (!container) return 0

  let nearestSection = 0
  let nearestDistance = Infinity

  for (let i = 0; i < container.children.length; i++) {
    const section = container.children[i]
    const sectionTop = section.offsetTop - container.offsetTop
    const distance = Math.abs(scrollTop - sectionTop)

    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestSection = i
    }
  }

  return nearestSection
}

/** Smooth snap to nearest section */
const snapToNearestSection = () => {
  const container = scrollContainer.value
  if (!container || isScrolling.value) return

  const scrollTop = container.scrollTop
  const viewportHeight = container.clientHeight
  const nearestIndex = findNearestSection(scrollTop, viewportHeight)
  const section = container.children[nearestIndex]

  if (!section) return

  const targetTop = section.offsetTop - container.offsetTop
  const distance = Math.abs(scrollTop - targetTop)

  // Only snap if we're within a reasonable distance (30% of viewport)
  if (distance < viewportHeight * 0.3 && distance > 5) {
    // Smooth snap animation
    isScrolling.value = true
    const startTop = scrollTop
    const startTime = performance.now()
    const duration = Math.min(400, 200 + distance * 0.5) // Faster for shorter distances

    const animateSnap = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      container.scrollTop = startTop + (targetTop - startTop) * eased

      if (progress < 1) {
        scrollAnimationId.value = requestAnimationFrame(animateSnap)
      } else {
        container.scrollTop = targetTop
        isScrolling.value = false
        scrollAnimationId.value = null
        currentSection.value = nearestIndex
        history.replaceState(null, '', '#' + sections[nearestIndex].id)
      }
    }

    scrollAnimationId.value = requestAnimationFrame(animateSnap)
  }
}

const handleScroll = () => {
  if (!scrollContainer.value || isScrolling.value) return

  const container = scrollContainer.value
  const scrollTop = container.scrollTop
  const now = performance.now()

  // Calculate velocity
  const timeDelta = now - lastScrollTime.value
  if (timeDelta > 0) {
    scrollVelocity.value = (scrollTop - lastScrollTop.value) / timeDelta
  }

  lastScrollTime.value = now
  lastScrollTop.value = scrollTop

  // Find current section for indicator
  const viewportHeight = container.clientHeight
  let bestSection = 0
  let bestVisibility = 0

  for (let i = 0; i < container.children.length; i++) {
    const section = container.children[i]
    const sectionTop = section.offsetTop - container.offsetTop
    const sectionBottom = sectionTop + section.offsetHeight
    const visibleTop = Math.max(sectionTop, scrollTop)
    const visibleBottom = Math.min(sectionBottom, scrollTop + viewportHeight)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
    const coversTop = sectionTop <= scrollTop + 100 && sectionBottom > scrollTop + 100
    const visibility = coversTop ? visibleHeight + 10000 : visibleHeight

    if (visibility > bestVisibility) {
      bestVisibility = visibility
      bestSection = i
    }
  }

  if (bestSection !== currentSection.value) {
    currentSection.value = bestSection
    history.replaceState(null, '', '#' + sections[bestSection].id)
  }

  // Clear previous timeout and set new one for scroll end detection
  if (scrollEndTimeout.value) {
    clearTimeout(scrollEndTimeout.value)
  }

  // Snap after scroll ends (when user stops scrolling)
  scrollEndTimeout.value = setTimeout(() => {
    // Only snap if velocity is low (user has stopped or nearly stopped)
    if (Math.abs(scrollVelocity.value) < 0.5) {
      snapToNearestSection()
    }
  }, 150)
}

/** Sync URL hash with section (deep links, back button). */
const syncHashToSection = () => {
  const hash = location.hash.slice(1)
  if (!hash) return
  const index = sections.findIndex(s => s.id === hash)
  if (index >= 0 && index !== currentSection.value) {
    scrollToSection(index)
  }
}

const handleKeydown = (e) => {
  if (isEnqueteOpen.value) return

  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault()
    if (currentSection.value < sections.length - 1) {
      scrollToSection(currentSection.value + 1)
    }
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault()
    if (currentSection.value > 0) {
      scrollToSection(currentSection.value - 1)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('hashchange', syncHashToSection)
  // Initial hash: scroll to section after DOM is ready
  nextTick(() => syncHashToSection())
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('hashchange', syncHashToSection)
  if (scrollEndTimeout.value) {
    clearTimeout(scrollEndTimeout.value)
  }
  if (scrollAnimationId.value) {
    cancelAnimationFrame(scrollAnimationId.value)
  }
})
</script>

<template>
  <div class="app" :class="{ 'enquete-open': isEnqueteOpen }">
    <!-- Minimal sticky header (mobile only, Apple-style) -->
    <header class="mobile-header" :class="{ 'header-hidden': headerHidden }" v-if="!isEnqueteOpen">
      <span class="mobile-header-logo">Enquête IRVE</span>
      <span class="mobile-header-title">{{ sections[currentSection]?.label ?? 'Accueil' }}</span>
      <button
        type="button"
        class="mobile-header-cta"
        @click="openEnquete"
        aria-label="Participer à l'enquête"
      >
        Participer
      </button>
    </header>

    <!-- Side navigation dots -->
    <nav class="section-nav" v-if="!isEnqueteOpen">
      <button
        v-for="(section, index) in sections"
        :key="section.id"
        class="section-dot"
        :class="{ active: currentSection === index }"
        @click="scrollToSection(index)"
        :aria-label="section.label"
      >
        <span class="section-tooltip">{{ section.label }}</span>
      </button>
    </nav>

    <!-- Main scroll container -->
    <div
      class="scroll-container"
      ref="scrollContainer"
      @scroll="handleScroll"
    >
      <section
        v-for="(section, index) in sections"
        :key="section.id"
        :id="section.id"
        class="full-section"
        :class="[`section-bg-${section.id}`, { active: currentSection === index }]"
      >
        <div class="section-content">
          <component :is="section.component" />
        </div>

        <!-- Scroll indicator -->
        <button
          v-if="index < sections.length - 1"
          class="scroll-indicator"
          @click="scrollToSection(index + 1)"
        >
          <span class="scroll-indicator-text">Défiler</span>
          <span class="scroll-indicator-arrow">
            <SvgIcon name="arrow-down" :size="24" />
          </span>
        </button>
      </section>
    </div>

    <!-- Mobile bottom navigation -->
    <nav class="mobile-bottom-nav" v-if="!isEnqueteOpen">
      <button
        v-for="(section, index) in sections"
        :key="section.id"
        class="bottom-nav-item"
        :class="{ active: currentSection === index }"
        @click="scrollToSection(index)"
      >
        <SvgIcon :name="section.icon" :size="22" />
        <span class="bottom-nav-label">{{ section.label }}</span>
      </button>
      <button class="bottom-nav-item bottom-nav-cta" @click="openEnquete">
        <SvgIcon name="clipboard" :size="22" />
        <span class="bottom-nav-label">Participer</span>
      </button>
    </nav>

    <!-- Enquete modal -->
    <Transition name="modal">
      <div v-if="isEnqueteOpen" class="enquete-modal">
        <div class="enquete-modal-header">
          <h2>Participer à l'enquête</h2>
          <button class="enquete-close" @click="closeEnquete">
            <SvgIcon name="close" :size="20" />
          </button>
        </div>
        <div class="enquete-modal-content">
          <EnqueteView />
        </div>
      </div>
    </Transition>

    <!-- Modal backdrop -->
    <Transition name="fade">
      <div
        v-if="isEnqueteOpen"
        class="modal-backdrop"
        @click="closeEnquete"
      ></div>
    </Transition>
  </div>
</template>

<style>
/* Reset for full-page scroll */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Scroll container - no CSS snap, handled by JS */
.scroll-container {
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-top: calc(56px + env(safe-area-inset-top, 0));
  overscroll-behavior: contain;
}

.full-section {
  min-height: calc(100vh - 56px - env(safe-area-inset-top, 0));
  position: relative;
}

.section-content {
  padding-bottom: 80px;
  position: relative;
  z-index: 1;
}

/* Hide default page styling */
.section-content :deep(.page) {
  min-height: auto;
  padding-top: 1rem;
}

.section-content :deep(.hero) {
  padding: 2rem 0;
}

@media (min-width: 768px) {
  .section-content :deep(.hero) {
    padding: 3rem 0;
  }
}

/* Section navigation dots */
.section-nav {
  position: fixed;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
  border: 2px solid var(--color-bg);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-dot:hover {
  background: var(--color-primary-light);
  transform: scale(1.2);
}

.section-dot.active {
  background: var(--color-primary);
  transform: scale(1.3);
}

.section-tooltip {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-text);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
}

.section-dot:hover .section-tooltip {
  opacity: 1;
  right: 28px;
}

/* Desktop: cleaner, minimal section nav (no heavy rings) */
@media (min-width: 769px) {
  .section-nav {
    right: 1.5rem;
    gap: 0.5rem;
  }

  .section-dot {
    width: 6px;
    height: 12px;
    border-radius: 9999px;
    border: none;
    background: var(--color-text-muted);
    box-shadow: none;
    opacity: 0.5;
    transition: opacity 0.2s ease, background 0.2s ease, transform 0.2s ease;
  }

  .section-dot:hover {
    opacity: 0.9;
    background: var(--color-primary-light);
    transform: scale(1.1);
  }

  .section-dot.active {
    width: 8px;
    height: 20px;
    border-radius: 9999px;
    opacity: 1;
    background: var(--color-primary);
    transform: none;
  }

  .section-tooltip {
    right: 20px;
    font-size: 0.8125rem;
    padding: 0.375rem 0.625rem;
    border-radius: var(--radius);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .section-dot:hover .section-tooltip {
    right: 24px;
  }
}

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  bottom: calc(2rem + env(safe-area-inset-bottom, 0));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.3s ease;
  animation: bounce 2s infinite;
  z-index: 2;
}

.scroll-indicator:hover {
  color: var(--color-primary);
}

.scroll-indicator-text {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.scroll-indicator-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  40% {
    transform: translateX(-50%) translateY(-10px);
  }
  60% {
    transform: translateX(-50%) translateY(-5px);
  }
}

/* Sticky header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 0 1.5rem;
  padding-top: env(safe-area-inset-top, 0);
  min-height: 56px;
  height: calc(56px + env(safe-area-inset-top, 0));
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  z-index: 110;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-header.header-hidden {
  transform: translateY(-100%);
}

.mobile-header-logo {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text);
  flex-shrink: 0;
}

.mobile-header-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-muted);
  flex: 1;
  text-align: center;
  padding: 0 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-header-cta {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.2s;
}

.mobile-header-cta:hover {
  background: var(--color-primary-dark);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .mobile-header {
    padding: 0 1rem;
  }

  .mobile-header-logo {
    font-size: 0.9375rem;
    max-width: 30%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-header-title {
    font-size: 0.9375rem;
    padding: 0 0.5rem;
  }

  .mobile-header-cta {
    padding: 0.5rem 0.75rem;
  }

  .section-nav {
    display: none;
  }

  .scroll-indicator {
    bottom: 5rem;
    bottom: calc(5rem + env(safe-area-inset-bottom, 0));
  }
}

/* Enquete modal */
.enquete-modal {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 200;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.enquete-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
}

.enquete-modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.enquete-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-alt);
  border: none;
  border-radius: 50%;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s;
}

.enquete-close:hover {
  background: var(--color-border);
}

.enquete-modal-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 2rem;
}

.enquete-modal-content :deep(.page) {
  min-height: auto;
  padding-top: 0;
}

.enquete-modal-content :deep(.page-header) {
  display: none;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 190;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from {
  transform: translateY(100%);
}

.modal-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Hide footer in this mode */
.app :deep(footer) {
  display: none;
}

/* ===== Section Backgrounds - Subtils et complémentaires au thème ===== */

/* Accueil - Particules flottantes subtiles */
.section-bg-accueil {
  position: relative;
}

.section-bg-accueil::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 25%),
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.06) 0%, transparent 25%),
    radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.04) 0%, transparent 30%);
  pointer-events: none;
  animation: floatBubbles 20s ease-in-out infinite;
}

@keyframes floatBubbles {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.02); }
}

/* Comprendre - Dégradé animé très subtil */
.section-bg-comprendre {
  position: relative;
}

.section-bg-comprendre::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(-45deg,
    rgba(240, 249, 255, 0.5),
    rgba(224, 242, 254, 0.5),
    rgba(240, 253, 244, 0.5),
    rgba(236, 253, 245, 0.5)
  );
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
  pointer-events: none;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Options - Motif géométrique très léger */
.section-bg-options {
  position: relative;
}

.section-bg-options::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

/* Financement - Accent vert subtil */
.section-bg-aides {
  position: relative;
}

.section-bg-aides::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 0% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(5, 150, 105, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

/* FAQ - Fond doux */
.section-bg-faq {
  position: relative;
}

.section-bg-faq::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 10% 90%, rgba(16, 185, 129, 0.05) 0%, transparent 30%),
    radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.04) 0%, transparent 30%);
  pointer-events: none;
}

/* ===== Mobile Bottom Navigation ===== */
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border);
    padding-bottom: env(safe-area-inset-bottom, 0);
    z-index: 100;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem 0.25rem;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.625rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .bottom-nav-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 24px;
    height: 2px;
    background: var(--color-primary);
    border-radius: 0 0 2px 2px;
    transition: transform 0.2s ease;
  }

  .bottom-nav-item.active {
    color: var(--color-primary);
  }

  .bottom-nav-item.active::before {
    transform: translateX(-50%) scaleX(1);
  }

  .bottom-nav-item:active {
    background: var(--color-bg-alt);
  }

  .bottom-nav-label {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .bottom-nav-cta {
    color: var(--color-primary);
    background: var(--color-primary-light);
    border-radius: 0;
  }

  .bottom-nav-cta:active {
    background: var(--color-primary);
    color: white;
  }

  /* Ajuster le padding pour la barre de navigation en bas */
  .scroll-container {
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0));
  }

  .section-content {
    padding-bottom: 100px;
  }

  /* Cacher l'indicateur de scroll sur mobile car on a la bottom nav */
  .scroll-indicator {
    display: none;
  }
}
</style>
