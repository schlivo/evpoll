<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'

// Import all views as components
import HomeView from './views/HomeView.vue'
import ComprendreView from './views/ComprendreView.vue'
import OptionsView from './views/OptionsView.vue'
import AidesView from './views/AidesView.vue'
import FaqView from './views/FaqView.vue'
import EnqueteView from './views/EnqueteView.vue'

const sections = [
  { id: 'accueil', label: 'Accueil', component: HomeView },
  { id: 'comprendre', label: 'Comprendre', component: ComprendreView },
  { id: 'options', label: 'Options', component: OptionsView },
  { id: 'aides', label: 'Aides', component: AidesView },
  { id: 'faq', label: 'FAQ', component: FaqView },
]

const currentSection = ref(0)
const isEnqueteOpen = ref(false)
const scrollContainer = ref(null)
const isScrolling = ref(false)

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

const scrollToSection = (index) => {
  if (scrollContainer.value && !isScrolling.value) {
    isScrolling.value = true
    const section = scrollContainer.value.children[index]
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
      currentSection.value = index
      setTimeout(() => {
        isScrolling.value = false
      }, 800)
    }
  }
}

const handleScroll = () => {
  if (scrollContainer.value && !isScrolling.value) {
    const scrollTop = scrollContainer.value.scrollTop
    const sectionHeight = window.innerHeight
    const newSection = Math.round(scrollTop / sectionHeight)
    if (newSection !== currentSection.value && newSection >= 0 && newSection < sections.length) {
      currentSection.value = newSection
    }
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
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app" :class="{ 'enquete-open': isEnqueteOpen }">
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

    <!-- Floating CTA button -->
    <button
      class="floating-cta"
      @click="openEnquete"
      v-if="!isEnqueteOpen"
    >
      <span class="floating-cta-icon">&#128203;</span>
      <span class="floating-cta-text">Participer</span>
      <span class="floating-cta-pulse"></span>
    </button>

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
        :class="{ active: currentSection === index }"
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
          <span class="scroll-indicator-arrow">&#8595;</span>
        </button>
      </section>
    </div>

    <!-- Enquete modal -->
    <Transition name="modal">
      <div v-if="isEnqueteOpen" class="enquete-modal">
        <div class="enquete-modal-header">
          <h2>Participer à l'enquête</h2>
          <button class="enquete-close" @click="closeEnquete">
            <span>&#10005;</span>
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

/* Scroll container with snap */
.scroll-container {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.full-section {
  min-height: 100vh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  position: relative;
  display: flex;
  flex-direction: column;
}

.section-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
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

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
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
  font-size: 1.5rem;
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

/* Floating CTA button */
.floating-cta {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  z-index: 90;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-cta:hover {
  transform: translateX(-50%) scale(1.05);
  box-shadow: 0 6px 30px rgba(16, 185, 129, 0.5);
}

.floating-cta-icon {
  font-size: 1.25rem;
}

.floating-cta-pulse {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--color-primary);
  animation: pulse 2s infinite;
  z-index: -1;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .section-nav {
    right: 0.5rem;
    gap: 0.5rem;
  }

  .section-dot {
    width: 10px;
    height: 10px;
  }

  .section-tooltip {
    display: none;
  }

  .floating-cta {
    bottom: 1.5rem;
    padding: 0.875rem 1.5rem;
    font-size: 0.9rem;
  }

  .scroll-indicator {
    bottom: 5rem;
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
  font-size: 1.25rem;
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
</style>
