<script setup>
// Row of N parking "bays" filling from left to right.
// It shows a TOTAL only: bay i is lit if i < filled, never the real spot position.
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  filled: { type: Number, default: 0 }
})

const count = computed(() => Math.max(0, Math.min(props.total, 400)))
const lit = computed(() => Math.max(0, Math.min(props.filled, count.value)))

// Two rows on desktop, four on phones (capped so bays stay visible)
const colsDesktop = computed(() => Math.min(50, Math.ceil(count.value / 2)) || 1)
const colsMobile = computed(() => Math.min(25, Math.ceil(count.value / 4)) || 1)
</script>

<template>
  <div
    class="bays"
    aria-hidden="true"
    :style="{ '--cols': colsDesktop, '--cols-m': colsMobile }"
  >
    <span v-for="i in count" :key="i" class="bay" :class="{ on: i <= lit }"></span>
  </div>
</template>

<style scoped>
.bays {
  display: grid;
  grid-template-columns: repeat(var(--cols-m), 1fr);
  gap: 3px;
  max-width: 900px;
}

@media (min-width: 768px) {
  .bays {
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 4px;
  }
}

.bay {
  height: 18px;
  border: 2px solid #ffffff55;
  border-top: 0;
}

@media (min-width: 768px) {
  .bay { height: 22px; }
}

.bay.on {
  background: var(--signal);
  border-color: var(--signal);
}
</style>
