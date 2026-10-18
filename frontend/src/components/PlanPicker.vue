<script setup>
// Parking plan drawn from the instance geometry (GET /api/plan).
// Used neutral on the home page, as a picker in the survey, and with
// per-spot colours in the admin only (statusBySpot is never public data).
import { computed, ref } from 'vue'

const props = defineProps({
  // { viewBox: [x, y, w, h], places: { "1": [[x, y], ...] }, walls: [...] } or null
  plan: { type: Object, default: null },
  // Highest spot number, used for the grid fallback when there is no plan
  parkingSpots: { type: Number, default: 0 },
  // Spots drawn as selected (rose)
  selected: { type: Array, default: () => [] },
  // Clickable / keyboard-selectable spots
  interactive: { type: Boolean, default: false },
  // Crop the view around the selected spots (mini-map)
  focusSelected: { type: Boolean, default: false },
  // Admin only: { [spot]: 'oui' | 'peut-etre' | 'non' }
  statusBySpot: { type: Object, default: null },
  // [{ lot, places: [83, 84] }]: multi-spot lots get one common outline
  lots: { type: Array, default: () => [] },
  label: { type: String, default: 'Plan du parking' }
})

const emit = defineEmits(['select'])

const GRID_COLS = 12
const CELL_W = 44
const CELL_H = 56
const GAP = 6

// Polygons keyed by spot number, from the plan or a numbered grid
const places = computed(() => {
  if (props.plan?.places) {
    return Object.entries(props.plan.places).map(([spot, points]) => ({ spot: Number(spot), points }))
  }
  return Array.from({ length: props.parkingSpots }, (_, i) => {
    const x = (i % GRID_COLS) * (CELL_W + GAP)
    const y = Math.floor(i / GRID_COLS) * (CELL_H + GAP)
    return { spot: i + 1, points: [[x, y], [x + CELL_W, y], [x + CELL_W, y + CELL_H], [x, y + CELL_H]] }
  })
})

const shapes = computed(() => places.value.map(({ spot, points }) => {
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const w = Math.max(...xs) - Math.min(...xs)
  const h = Math.max(...ys) - Math.min(...ys)
  return {
    spot,
    d: 'M' + points.map(p => p.join(',')).join('L') + 'Z',
    cx: xs.reduce((a, b) => a + b, 0) / xs.length,
    cy: ys.reduce((a, b) => a + b, 0) / ys.length,
    box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    fontSize: Math.max(10, Math.min(w, h) * 0.32)
  }
}))

/** Convex hull (monotone chain) of a point list */
const hull = (points) => {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list) => {
    const out = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  return [...half(pts), ...half([...pts].reverse())]
}

const doubleSpots = computed(() => new Set(props.lots.filter(l => l.places.length > 1).flatMap(l => l.places)))

// One thick outline around all the spots of a multi-spot lot (tandem / double places)
const lotOutlines = computed(() => {
  const bySpot = new Map(places.value.map(p => [p.spot, p.points]))
  return props.lots
    .filter(l => l.places.length > 1 && l.places.every(p => bySpot.has(p)))
    .map(l => ({
      lot: l.lot,
      d: 'M' + hull(l.places.flatMap(p => bySpot.get(p))).map(p => p.join(',')).join('L') + 'Z'
    }))
})

const wallPaths = computed(() =>
  (props.plan?.walls || []).map(w => 'M' + w.map(p => p.join(',')).join('L'))
)

const fullViewBox = computed(() => {
  if (props.plan?.viewBox) return props.plan.viewBox
  const rows = Math.ceil(props.parkingSpots / GRID_COLS)
  return [0, 0, GRID_COLS * (CELL_W + GAP) - GAP, Math.max(rows, 1) * (CELL_H + GAP) - GAP]
})

const viewBox = computed(() => {
  const chosen = shapes.value.filter(s => props.selected.includes(s.spot))
  if (!props.focusSelected || !chosen.length) return fullViewBox.value.join(' ')
  // Window around the selection, keeping a wide aspect ratio for a strip-like mini-map
  const [x0, y0, x1, y1] = chosen.reduce((b, s) => [
    Math.min(b[0], s.box[0]), Math.min(b[1], s.box[1]), Math.max(b[2], s.box[2]), Math.max(b[3], s.box[3])
  ], [Infinity, Infinity, -Infinity, -Infinity])
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const [fx, fy, fw, fh] = fullViewBox.value
  const h = Math.min(Math.max((y1 - y0) * 2.6, fh / 6), fh)
  const w = Math.min(Math.max((x1 - x0) * 2.6, h * 2.2), fw)
  // Keep the window inside the plan so a spot at the end of a row is not shown against blank space
  const clamp = (start, size, min, total) => Math.min(Math.max(start, min), min + total - size)
  return [clamp(cx - w / 2, w, fx, fw), clamp(cy - h / 2, h, fy, fh), w, h].join(' ')
})

const isSelected = (spot) => props.selected.includes(spot)

const statusClass = (spot) => {
  if (isSelected(spot)) return 'is-selected'
  const status = props.statusBySpot?.[spot]
  return status ? `status-${status}` : ''
}

const select = (spot) => {
  if (props.interactive) emit('select', spot)
}

const svgRef = ref(null)

// Arrow keys move the focus to the nearest spot in that direction
const onKeydown = (event, shape) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    select(shape.spot)
    return
  }
  const dirs = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }
  const dir = dirs[event.key]
  if (!dir) return
  event.preventDefault()
  let best = null
  for (const other of shapes.value) {
    if (other.spot === shape.spot) continue
    const dx = other.cx - shape.cx
    const dy = other.cy - shape.cy
    const along = dx * dir[0] + dy * dir[1]
    if (along <= 0) continue
    const across = Math.abs(dx * dir[1] - dy * dir[0])
    const score = along + across * 2
    if (!best || score < best.score) best = { spot: other.spot, score }
  }
  if (best) svgRef.value?.querySelector(`[data-place="${best.spot}"]`)?.focus()
}
</script>

<template>
  <svg
    ref="svgRef"
    :viewBox="viewBox"
    class="plan-picker"
    :class="{ interactive }"
    role="img"
    :aria-label="label"
    preserveAspectRatio="xMidYMid meet"
  >
    <path v-for="(d, i) in wallPaths" :key="'w' + i" :d="d" class="wall" />
    <g
      v-for="shape in shapes"
      :key="shape.spot"
      class="place"
      :class="[statusClass(shape.spot), { 'in-double': doubleSpots.has(shape.spot) }]"
      :data-place="shape.spot"
      :tabindex="interactive ? 0 : undefined"
      :role="interactive ? 'button' : undefined"
      :aria-label="`Place ${shape.spot}`"
      :aria-pressed="interactive ? isSelected(shape.spot) : undefined"
      @click="select(shape.spot)"
      @keydown="onKeydown($event, shape)"
    >
      <path :d="shape.d" />
      <text :x="shape.cx" :y="shape.cy" :font-size="shape.fontSize" dominant-baseline="central" text-anchor="middle">
        {{ shape.spot }}
      </text>
    </g>
    <path v-for="o in lotOutlines" :key="'lot' + o.lot" :d="o.d" class="lot-outline" />
  </svg>
</template>

<style scoped>
.plan-picker {
  display: block;
  width: 100%;
  height: auto;
  background: #fff;
}

.wall {
  fill: none;
  stroke: var(--muted);
  stroke-width: 3;
  stroke-linecap: square;
}

.place path {
  fill: var(--place);
  stroke: var(--muted);
  stroke-width: 1.5;
}

.place text {
  font-family: var(--font-title);
  font-weight: 600;
  fill: var(--ink);
  pointer-events: none;
}

.interactive .place {
  cursor: pointer;
}

.interactive .place:hover path {
  fill: #e4dfcf;
}

.place:focus {
  outline: none;
}

.place:focus-visible path {
  stroke: var(--ink);
  stroke-width: 4;
}

.place.is-selected path {
  fill: var(--rose);
  stroke: var(--rose);
}

.place.is-selected text {
  fill: #fff;
}

/* Double lots: shared thick outline, dashed separation between the two spots */
.place.in-double path {
  stroke-dasharray: 5 4;
}

/* Tint only when no selection or admin colour applies */
.place.in-double:not(.is-selected):not([class*="status-"]) path {
  fill: #e2dccb;
}

.lot-outline {
  fill: none;
  stroke: var(--ink);
  stroke-width: 5;
  stroke-linejoin: round;
  pointer-events: none;
}

/* Admin colours (statusBySpot) */
.place.status-oui path { fill: var(--ink); }
.place.status-oui text { fill: var(--paint); }
.place.status-peut-etre path { fill: var(--signal); }
.place.status-non path { fill: #c9c4b6; }
</style>
