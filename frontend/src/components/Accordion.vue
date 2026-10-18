<script setup>
// Disclosure panel: a real <button> with aria-expanded / aria-controls,
// so it opens with Enter / Space and is announced by screen readers.
import { useId } from 'vue'

defineProps({
  title: { type: String, required: true },
  // 'section' (Barlow, uppercase) or 'question' (Atkinson, for FAQ entries)
  variant: { type: String, default: 'section' },
  // Heading level wrapping the button
  level: { type: Number, default: 3 }
})

const open = defineModel('open', { type: Boolean, default: false })

const uid = useId()
const buttonId = `acc-btn-${uid}`
const panelId = `acc-panel-${uid}`
</script>

<template>
  <div class="acc" :class="[`acc-${variant}`, { 'is-open': open }]">
    <component :is="`h${level}`" class="acc-heading">
      <button
        :id="buttonId"
        type="button"
        class="acc-button"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="panelId"
        @click="open = !open"
      >
        <span class="acc-title">{{ title }}</span>
        <span class="acc-sign" aria-hidden="true">{{ open ? '–' : '+' }}</span>
      </button>
    </component>
    <div
      v-show="open"
      :id="panelId"
      class="acc-panel"
      role="region"
      :aria-labelledby="buttonId"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.acc {
  border-top: 1px solid var(--rule);
}

.acc-heading {
  margin: 0;
  font: inherit;
  text-transform: none;
  letter-spacing: normal;
}

.acc-button {
  display: flex;
  width: 100%;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 0;
  background: none;
  border: 0;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.acc-section .acc-button {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.375rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.acc-question .acc-button {
  font-family: var(--font-text);
  font-weight: 700;
  font-size: 1.125rem;
  line-height: 1.4;
}

.acc-button:hover .acc-title {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.acc-sign {
  flex-shrink: 0;
  font-family: var(--font-text);
  font-weight: 400;
  font-size: 1.375rem;
  line-height: 1;
  color: var(--muted);
  width: 1.25rem;
  text-align: center;
}

.acc-panel {
  padding: 0 0 1.5rem;
}

.acc-question .acc-panel {
  padding-bottom: 1rem;
}
</style>
