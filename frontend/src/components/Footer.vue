<script setup>
// Simple page footer: copro address, parking access, instance footer text.
import { inject, ref } from 'vue'

const instanceConfig = inject('instanceConfig', ref({}))
const openPrivacy = inject('openPrivacy', () => {})
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <p v-if="instanceConfig.copro_name || instanceConfig.copro_address">
        <strong v-if="instanceConfig.copro_name">{{ instanceConfig.copro_name }}</strong>
        <template v-if="instanceConfig.copro_name && instanceConfig.copro_address"> – </template>
        {{ instanceConfig.copro_address }}
      </p>
      <p v-if="instanceConfig.parking_address">Parking : {{ instanceConfig.parking_address }}</p>
      <p v-if="instanceConfig.texts?.footer">{{ instanceConfig.texts.footer }}</p>
      <p class="footer-links">
        <button type="button" class="footer-link" @click="openPrivacy">Mentions légales et confidentialité</button>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--rule);
  color: var(--muted);
  font-size: 1rem;
}

.footer-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 1.75rem 1rem 2.5rem;
  padding-bottom: max(2.5rem, env(safe-area-inset-bottom));
}

@media (min-width: 768px) {
  .footer-inner { padding: 2rem 2.5rem 3rem; }
}

.footer p {
  margin: 0 0 0.25rem;
}

.footer strong {
  color: var(--ink);
}

.footer-links {
  margin-top: 0.75rem !important;
}

.footer-link {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.footer-link:hover {
  color: var(--rose);
}
</style>
