<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Highest spot number (spots are 1..parkingSpots)
  parkingSpots: { type: Number, required: true },
  // [{ lot, places, type }] from the instance config (may be empty)
  lots: { type: Array, default: () => [] },
  // [{ spot, responses: [{ id, interested, has_ev, status }] }] from /admin/spots
  spots: { type: Array, default: () => [] },
  // Optional instance plan: { width, height, spots: { "1": { x, y, w, h } } }
  plan: { type: Object, default: null }
})

const STATUS_LABELS = {
  oui: 'Intéressé',
  'peut-etre': 'Peut-être',
  non: 'Pas intéressé',
  none: 'Pas de réponse'
}

const spotStatus = computed(() => {
  const byNumber = new Map()
  for (const { spot, responses } of props.spots) {
    // Most favourable answer wins when several responses claim the same spot
    const order = ['oui', 'peut-etre', 'non']
    const best = order.find(o => responses.some(r => r.interested === o)) || 'non'
    byNumber.set(spot, { status: best, responses })
  }
  return byNumber
})

const lotBySpot = computed(() => new Map(props.lots.flatMap(l => l.places.map(p => [p, l]))))

// Grid fallback: one cell per spot, double lots drawn as joined cells
const GRID_COLS = 12
const CELL_W = 44
const CELL_H = 56
const GAP = 6

const cells = computed(() => {
  const coords = props.plan?.spots
  return Array.from({ length: props.parkingSpots }, (_, i) => {
    const spot = i + 1
    const pos = coords?.[spot] || {
      x: (i % GRID_COLS) * (CELL_W + GAP),
      y: Math.floor(i / GRID_COLS) * (CELL_H + GAP),
      w: CELL_W,
      h: CELL_H
    }
    const lot = lotBySpot.value.get(spot)
    const info = spotStatus.value.get(spot)
    return {
      spot,
      ...pos,
      lot,
      status: info?.status || 'none',
      responses: info?.responses || [],
      title: [
        `Place ${spot}`,
        lot ? `lot n°${lot.lot}${lot.places.length > 1 ? ` (double ${lot.places.join('-')})` : ''}` : '',
        STATUS_LABELS[info?.status || 'none'],
        info ? `réponse${info.responses.length > 1 ? 's' : ''} #${info.responses.map(r => r.id).join(', #')}` : ''
      ].filter(Boolean).join(' · ')
    }
  })
})

const viewBox = computed(() => {
  if (props.plan?.width && props.plan?.height) return `0 0 ${props.plan.width} ${props.plan.height}`
  const rows = Math.ceil(props.parkingSpots / GRID_COLS)
  return `0 0 ${GRID_COLS * (CELL_W + GAP) - GAP} ${rows * (CELL_H + GAP) - GAP}`
})

// Links between the spots of a double lot (only meaningful when they sit side by side)
const lotLinks = computed(() => {
  const byNumber = new Map(cells.value.map(c => [c.spot, c]))
  return props.lots
    .filter(l => l.places.length > 1)
    .map(l => {
      const [a, b] = l.places.map(p => byNumber.get(p))
      if (!a || !b) return null
      return { lot: l.lot, x1: a.x + a.w / 2, y1: a.y + a.h / 2, x2: b.x + b.w / 2, y2: b.y + b.h / 2 }
    })
    .filter(Boolean)
})

const legend = computed(() =>
  Object.entries(STATUS_LABELS).map(([key, label]) => ({
    key,
    label,
    count: cells.value.filter(c => c.status === key).length
  }))
)
</script>

<template>
  <div class="parking-plan">
    <svg :viewBox="viewBox" class="plan-svg" role="img" aria-label="Plan des places de parking">
      <line
        v-for="link in lotLinks"
        :key="'lot-' + link.lot"
        :x1="link.x1" :y1="link.y1" :x2="link.x2" :y2="link.y2"
        class="lot-link"
      />
      <g v-for="cell in cells" :key="cell.spot" :class="['spot', 'spot-' + cell.status]">
        <title>{{ cell.title }}</title>
        <rect :x="cell.x" :y="cell.y" :width="cell.w" :height="cell.h" rx="5" />
        <text :x="cell.x + cell.w / 2" :y="cell.y + cell.h / 2" dominant-baseline="middle" text-anchor="middle">
          {{ cell.spot }}
        </text>
      </g>
    </svg>
    <ul class="plan-legend">
      <li v-for="item in legend" :key="item.key">
        <span :class="['swatch', 'spot-' + item.key]"></span>
        {{ item.label }} ({{ item.count }})
      </li>
      <li v-if="lots.some(l => l.places.length > 1)">
        <span class="swatch-link"></span> Lot double
      </li>
    </ul>
    <p v-if="!plan" class="plan-note">
      Disposition en grille : ajoutez <code>plan/parking.json</code> à l'instance pour afficher le plan réel.
    </p>
  </div>
</template>

<style scoped>
.plan-svg {
  width: 100%;
  height: auto;
  max-height: 70vh;
}

.spot rect {
  stroke: var(--color-border);
  stroke-width: 1.5;
}

.spot text {
  font-size: 15px;
  font-weight: 600;
  fill: var(--color-text);
  pointer-events: none;
}

.spot-oui rect, .swatch.spot-oui { fill: #22c55e; background: #22c55e; }
.spot-peut-etre rect, .swatch.spot-peut-etre { fill: #fbbf24; background: #fbbf24; }
.spot-non rect, .swatch.spot-non { fill: #cbd5e1; background: #cbd5e1; }
.spot-none rect, .swatch.spot-none { fill: var(--color-bg-card); background: var(--color-bg-card); }

.spot-oui text {
  fill: white;
}

.lot-link {
  stroke: var(--color-primary-dark);
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0.35;
}

.plan-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.plan-legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
}

.swatch-link {
  width: 18px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-primary-dark);
  opacity: 0.35;
}

.plan-note {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
