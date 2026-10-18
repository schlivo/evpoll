<script setup>
// Admin-only view of the plan coloured by answer (protected route, never public)
import { computed } from 'vue'
import PlanPicker from './PlanPicker.vue'

const props = defineProps({
  // Highest spot number (spots are 1..parkingSpots)
  parkingSpots: { type: Number, required: true },
  // [{ spot, responses: [{ id, interested, has_ev, status }] }] from /admin/spots
  spots: { type: Array, default: () => [] },
  // Plan geometry from the instance, or null for the grid fallback
  plan: { type: Object, default: null },
  // Lots from the instance ([{ lot, places }]), to outline double lots
  lots: { type: Array, default: () => [] }
})

const STATUS_LABELS = {
  oui: 'Intéressé',
  'peut-etre': 'Peut-être',
  non: 'Pas intéressé',
  none: 'Pas de réponse'
}

const statusBySpot = computed(() => {
  const result = {}
  for (const { spot, responses } of props.spots) {
    // Most favourable answer wins when several responses claim the same spot
    result[spot] = ['oui', 'peut-etre', 'non'].find(o => responses.some(r => r.interested === o)) || 'non'
  }
  return result
})

const legend = computed(() => {
  const counts = { oui: 0, 'peut-etre': 0, non: 0 }
  Object.values(statusBySpot.value).forEach(s => { counts[s]++ })
  const answered = Object.keys(statusBySpot.value).length
  return [
    ...Object.entries(counts).map(([key, count]) => ({ key, label: STATUS_LABELS[key], count })),
    { key: 'none', label: STATUS_LABELS.none, count: props.parkingSpots - answered }
  ]
})
</script>

<template>
  <div class="parking-plan">
    <PlanPicker
      :plan="plan"
      :parking-spots="parkingSpots"
      :status-by-spot="statusBySpot"
      :lots="lots"
      label="Plan des places, coloré selon les réponses"
    />
    <ul class="plan-legend">
      <li v-for="item in legend" :key="item.key">
        <span :class="['swatch', 'swatch-' + item.key]"></span>
        {{ item.label }} ({{ item.count }})
      </li>
    </ul>
    <p v-if="lots.some(l => l.places.length > 1)" class="plan-note">
      Contour épais : lot double (deux places en enfilade, un seul propriétaire).
    </p>
    <p v-if="!plan" class="plan-note">
      Disposition en grille : ajoutez <code>plan/places.json</code> à l'instance pour afficher le plan réel.
    </p>
  </div>
</template>

<style scoped>
.parking-plan :deep(.plan-picker) {
  max-height: 70vh;
  border: 1px solid var(--rule);
}

.plan-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.plan-legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.swatch {
  width: 14px;
  height: 14px;
  border: 1px solid var(--muted);
}

.swatch-oui { background: var(--ink); }
.swatch-peut-etre { background: var(--signal); }
.swatch-non { background: #c9c4b6; }
.swatch-none { background: var(--place); }

.plan-note {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
