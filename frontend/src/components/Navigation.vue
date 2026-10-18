<script setup>
// Asphalt top bar. Home: copro name + links that open the matching
// "En savoir plus" accordion. Survey page (minimal): copro name + close button.
import { inject, ref } from 'vue'

defineProps({
  minimal: { type: Boolean, default: false },
  // Slid out of view while scrolling down (state owned by App.vue)
  hidden: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const coproName = inject('coproName', ref(''))
const openInfo = inject('openInfo', () => {})

const links = [
  { id: 'comprendre', label: 'Comprendre' },
  { id: 'aides', label: 'Aides' },
  { id: 'faq', label: 'FAQ' }
]

const go = (event, id) => {
  event.preventDefault()
  openInfo(id)
}
</script>

<template>
  <header class="topbar" :class="{ minimal, 'is-hidden': hidden }">
    <div class="topbar-inner">
      <span class="topbar-title">
        {{ coproName || 'Recharge au parking' }}<span v-if="!minimal" class="topbar-suffix"> · Bornes de recharge</span>
      </span>

      <nav v-if="!minimal" class="topbar-links" aria-label="En savoir plus">
        <a v-for="link in links" :key="link.id" :href="`#${link.id}`" @click="go($event, link.id)">
          {{ link.label }}
        </a>
      </nav>

      <button v-else type="button" class="topbar-close" @click="emit('close')">
        Fermer <span aria-hidden="true">✕</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  transition: transform 0.2s ease;
  background: var(--asphalt);
  color: var(--paint);
  border-bottom: 3px solid var(--signal);
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.topbar.is-hidden {
  transform: translateY(-100%);
}

/* Keyboard users tabbing into the bar always see it */
.topbar.is-hidden:focus-within {
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .topbar { transition: none; }
}

.topbar-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  padding-top: max(0.75rem, env(safe-area-inset-top));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem 1.5rem;
}

@media (min-width: 768px) {
  .topbar-inner { padding: 0.875rem 2.5rem; }
}

.topbar-title {
  min-width: 0;
}

.topbar-suffix {
  display: none;
}

@media (min-width: 640px) {
  .topbar-suffix { display: inline; }
}

.topbar-links {
  display: flex;
  gap: 1.25rem;
}

.topbar-links a,
.topbar-close {
  color: var(--paint);
  text-decoration: none;
  padding: 0.25rem 0;
}

.topbar-links a:hover {
  color: var(--signal);
}

.topbar-close {
  background: none;
  border: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
  padding: 0.375rem 0;
}

.topbar-close:hover {
  color: var(--signal);
}
</style>
