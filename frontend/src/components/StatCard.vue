<script setup>
// Plain figure + label, ruled, no icon (kept for reuse; the home page
// now shows a progress bar instead of counters)
defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  suffix: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="stat-card">
    <div class="stat-value">
      {{ value }}<span class="stat-suffix" v-if="suffix">{{ suffix }}</span>
    </div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  border-top: 1px solid var(--rule);
  padding: 0.75rem 0;
}

.stat-value {
  font-family: var(--font-title);
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
}

.stat-suffix {
  font-size: 1.5rem;
  font-weight: 600;
}

.stat-label {
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 1rem;
}
</style>
