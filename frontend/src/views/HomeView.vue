<script setup>
import { ref, computed, onMounted, inject, watch, nextTick } from 'vue'
import PlanPicker from '../components/PlanPicker.vue'
import { fetchPlan } from '../planAccess.js'
import HeroProgress from '../components/HeroProgress.vue'
import Accordion from '../components/Accordion.vue'
import ComprendreView from './ComprendreView.vue'
import OptionsView from './OptionsView.vue'
import AidesView from './AidesView.vue'
import FaqView from './FaqView.vue'

const openEnquete = inject('openEnquete')
const instanceConfig = inject('instanceConfig', ref({}))
const coproName = inject('coproName', ref(''))
// { id, n } set by the top bar / route when a "En savoir plus" panel must open
const infoRequest = inject('infoRequest', ref(null))

const stats = ref({})
const plan = ref(null)
const planLoaded = ref(false)

// Spots answered from THIS device only (marker written by the survey form)
const mySpots = ref([])

const readSubmissionMarker = () => {
  try {
    const marker = JSON.parse(localStorage.getItem('irve_survey_submission') || 'null')
    const spots = Array.isArray(marker?.spots) ? marker.spots : []
    mySpots.value = spots.map(Number).filter(n => Number.isInteger(n) && n > 0)
  } catch {
    mySpots.value = []
  }
}

const loadStats = async () => {
  try {
    const response = await fetch('/api/stats')
    if (response.ok) stats.value = await response.json()
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// Back from the survey page: refresh the totals and this device's place
const isEnqueteOpen = inject('isEnqueteOpen', ref(false))
watch(isEnqueteOpen, (open) => {
  if (open) return
  readSubmissionMarker()
  loadStats()
  if (!plan.value) loadPlan()
})

// The plan may need a printed code (QR code of a document, or code typed in the survey)
const entryParams = inject('entryParams', ref({}))
const loadPlan = async () => {
  const { p, c, k } = entryParams.value || {}
  plan.value = await fetchPlan(c ? { code: c, spot: p } : (k ? { code: k } : undefined))
  planLoaded.value = true
}
watch(entryParams, () => { if (!plan.value) loadPlan() })

onMounted(() => {
  readSubmissionMarker()
  loadStats()
  loadPlan()
})

const texts = computed(() => instanceConfig.value.texts || {})

const kicker = computed(() => {
  if (texts.value.hero_kicker) return texts.value.hero_kicker
  const address = instanceConfig.value.parking_address
  return address ? `Parking · ${address}` : 'Parking'
})

const heroTitle = computed(() => texts.value.hero_title || 'Qui veut pouvoir recharger sa voiture ?')

const parkingSpots = computed(() =>
  Number(instanceConfig.value.parking_spots || stats.value.parking_spots || 0)
)
const declaredSpots = computed(() => Number(stats.value.declared_spots || 0))
const totalLots = computed(() => Number(stats.value.total_lots || 0))

const deadlineText = computed(() => {
  const raw = instanceConfig.value.campaign_deadline
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw || '')
  if (!m) return ''
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('fr-FR', sameYear
    ? { day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long', year: 'numeric' })
})

const responses = computed(() => Number(stats.value.total_responses || 0))
const interested = computed(() => {
  // Public stats only carry totals; small counts come back as "moins de 5"
  const value = stats.value.interested_count
  if (value === undefined || value === null) return null
  return value
})

const signature = computed(() => instanceConfig.value.campaign_signature || '')

const monthYear = new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

// Without the plan geometry, the numbered grid is only drawn when the plan is public
const showPlan = computed(() => planLoaded.value &&
  (plan.value?.places || (instanceConfig.value.plan_requires_code === false && parkingSpots.value > 0)))
const planCaption = computed(() => {
  if (texts.value.plan_caption) return texts.value.plan_caption
  return coproName.value ? `${coproName.value} – sous-sol` : 'Parking – sous-sol'
})
const mySpotsLabel = computed(() => mySpots.value.join('-'))

// Section numbers follow what is actually shown (the plan may be absent)
const sectionNumber = (key) => {
  const order = [showPlan.value && 'plan', 'why', 'more'].filter(Boolean)
  return String(order.indexOf(key) + 1).padStart(2, '0')
}

const infoPanels = [
  { id: 'comprendre', title: 'Comprendre la recharge en copropriété', component: ComprendreView },
  { id: 'options', title: 'Les options et leur coût', component: OptionsView },
  { id: 'aides', title: 'Aides 2026', component: AidesView },
  { id: 'faq', title: 'Questions fréquentes', component: FaqView }
]
const openPanels = ref({})

watch(infoRequest, async (request) => {
  if (!request?.id || !infoPanels.some(p => p.id === request.id)) return
  openPanels.value[request.id] = true
  await nextTick()
  document.getElementById(`info-${request.id}`)?.scrollIntoView({ block: 'start' })
}, { immediate: true })
</script>

<template>
  <div class="home">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-inner">
        <p class="hero-kicker">{{ kicker }}</p>
        <h1 id="hero-title">{{ heroTitle }}</h1>
        <p class="hero-lead">
          La copropriété étudie l'équipement du parking. Indiquez votre numéro de place,
          même sans véhicule électrique aujourd'hui. Consultation indicative : seule l'AG décide.
        </p>

        <div class="hero-progress">
          <HeroProgress v-if="parkingSpots" :total="parkingSpots" :filled="declaredSpots" />
          <p class="progress-text">
            <template v-if="parkingSpots">
              <b>{{ declaredSpots }}</b> {{ declaredSpots > 1 ? 'places déclarées' : 'place déclarée' }} sur {{ parkingSpots }}
            </template>
            <template v-else>
              <b>{{ responses }}</b> {{ responses > 1 ? 'réponses' : 'réponse' }}
            </template>
            <template v-if="deadlineText"> · réponses jusqu'au {{ deadlineText }}</template>
          </p>
          <p v-if="parkingSpots && responses" class="progress-sub">
            {{ responses }} {{ responses > 1 ? 'réponses' : 'réponse' }}<template v-if="interested !== null"> · {{ interested }} {{ typeof interested === 'number' && interested <= 1 ? 'intéressé ou curieux' : 'intéressés ou curieux' }}</template>
          </p>
        </div>

        <div class="hero-cta">
          <button type="button" class="cta" @click="openEnquete('express')">Indiquer ma place · 30 s</button>
          <p v-if="signature" class="hero-sig">— <b>{{ signature }}</b></p>
        </div>
      </div>
    </section>

    <section v-if="showPlan" class="sec" aria-labelledby="sec-plan">
      <h2 id="sec-plan" class="sec-label"><span class="sec-num">{{ sectionNumber('plan') }}</span> Le parking</h2>
      <div class="sec-body">
        <div class="plan-scroll">
          <div class="plan-frame">
            <PlanPicker
              :plan="plan"
              :parking-spots="parkingSpots"
              :selected="mySpots"
              :lots="instanceConfig.multi_spot_lots || []"
              :label="mySpots.length ? `Plan du parking, votre place ${mySpotsLabel} est mise en évidence` : 'Plan du parking'"
            />
            <div class="cartouche" aria-hidden="true">
              <div class="cart-title">{{ planCaption }}</div>
              <div>{{ parkingSpots || Object.keys(plan?.places || {}).length }} places<template v-if="totalLots"> · {{ totalLots }} lots</template></div>
              <div>{{ monthYear }}</div>
              <div v-if="signature" class="cart-wide">{{ signature }}</div>
            </div>
          </div>
        </div>
        <p v-if="mySpots.length" class="my-spot">
          Votre place ({{ mySpotsLabel }}) est enregistrée sur cet appareil.
        </p>
        <p v-if="(instanceConfig.multi_spot_lots || []).length" class="plan-note">Contour épais : lot double (deux places en enfilade)</p>
        <p class="plan-note">Le plan ne montre aucune réponse : seuls des totaux sont publiés.</p>
      </div>
    </section>

    <section class="sec" aria-labelledby="sec-why">
      <h2 id="sec-why" class="sec-label"><span class="sec-num">{{ sectionNumber('why') }}</span> Pourquoi maintenant</h2>
      <div class="sec-body">
        <ul class="why">
          <li>
            Le gazole a dépassé <strong>2 € le litre</strong> en mars 2026,
            avec un pic à 2,40 € le 20 septembre.
          </li>
          <li>
            L'électrique a représenté <strong>41,1 % des voitures neuves</strong>
            vendues en France en septembre 2026 (31 % sur neuf mois).
          </li>
          <li>
            Rouler en électrique revient <strong>2 à 3 fois moins cher</strong> qu'au gazole,
            à condition de pouvoir recharger chez soi.
          </li>
        </ul>
        <p class="src">
          Source :
          <a
            href="https://www.connaissancedesenergies.org/afp/train-bus-covoiturage-les-solutions-face-a-la-hantise-de-la-pompe-a-essence-261006"
            target="_blank"
            rel="noopener"
          >AFP / Connaissance des Énergies, 6 octobre 2026</a>
        </p>
      </div>
    </section>

    <section class="sec" aria-labelledby="sec-more">
      <h2 id="sec-more" class="sec-label"><span class="sec-num">{{ sectionNumber('more') }}</span> En savoir plus</h2>
      <div class="sec-body accordions">
        <div v-for="panel in infoPanels" :id="`info-${panel.id}`" :key="panel.id" class="info-anchor">
          <Accordion v-model:open="openPanels[panel.id]" :title="panel.title">
            <component :is="panel.component" />
          </Accordion>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero: asphalt with vertical bay lines, hazard stripe at the bottom */
.hero {
  background: var(--asphalt) repeating-linear-gradient(90deg, transparent 0 118px, #ffffff18 118px 121px);
  color: var(--paint);
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 10px;
  background: var(--hazard);
}

.hero-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2.25rem 1rem 2.75rem;
}

@media (min-width: 768px) {
  .hero-inner { padding: 3.5rem 2.5rem 3.5rem; }
}

.hero-kicker {
  margin: 0;
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--signal);
}

.hero h1 {
  color: var(--paint);
  font-size: 2.5rem;
  line-height: 1.02;
  letter-spacing: 0.01em;
  margin: 0.6rem 0 1.1rem;
  max-width: 820px;
}

@media (min-width: 768px) {
  .hero h1 { font-size: 4rem; }
}

.hero-lead {
  max-width: 640px;
  margin: 0;
  color: #e6e2d6;
  font-size: 1.1875rem;
}

.hero-progress {
  margin-top: 1.75rem;
}

.progress-text {
  margin: 0.6rem 0 0;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.375rem;
  letter-spacing: 0.04em;
  line-height: 1.25;
}

.progress-text b {
  color: var(--signal);
  font-size: 1.875rem;
}

.progress-sub {
  margin: 0.25rem 0 0;
  font-size: 1rem;
  color: #d8d3c4;
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.4rem;
  margin-top: 1.6rem;
}

.cta {
  background: var(--signal);
  color: var(--asphalt);
  border: 0;
  padding: 0.95rem 1.75rem;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.cta:hover {
  background: #e5b41f;
}

.cta:focus-visible {
  outline: 3px solid var(--paint);
  outline-offset: 3px;
}

@media (max-width: 479px) {
  .cta { width: 100%; }
}

.hero-sig {
  margin: 0;
  color: #d8d3c4;
  font-size: 1rem;
}

.hero-sig b {
  color: var(--paint);
}

/* Numbered sections: label column on the left */
.sec {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1rem;
  border-top: 1px solid var(--rule);
  display: grid;
  gap: 1rem;
}

.hero + .sec {
  border-top: 0;
}

@media (min-width: 900px) {
  .sec {
    grid-template-columns: 200px 1fr;
    gap: 2rem;
    padding: 2.25rem 2.5rem;
  }
}

.sec-label {
  margin: 0;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.sec-num {
  display: block;
  font-family: var(--font-stencil);
  font-weight: 800;
  font-size: 2.75rem;
  line-height: 1.05;
  letter-spacing: 0;
  color: var(--ink);
}

.sec-body {
  min-width: 0;
}

/* Plan: horizontal scroll on phones so the numbers stay readable */
.plan-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--rule);
  background: #fff;
}

.plan-frame {
  position: relative;
  min-width: 700px;
  padding: 0.75rem 0.75rem 6.5rem;
}

.cartouche {
  position: absolute;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: auto auto;
  background: #fff;
  border-left: 1px solid var(--ink);
  border-top: 1px solid var(--ink);
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink);
}

.cartouche > div {
  padding: 0.3rem 0.65rem;
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.cartouche .cart-title,
.cartouche .cart-wide {
  grid-column: 1 / 3;
}

.cartouche .cart-title {
  font-size: 0.9375rem;
}

.my-spot {
  margin: 0.75rem 0 0;
  font-weight: 700;
}

.plan-note {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  color: var(--muted);
}

/* Why now */
.why {
  margin: 0;
  padding-left: 1.25rem;
}

.why li {
  margin: 0.25rem 0;
}

.src {
  margin: 0.5rem 0 0;
  font-size: 0.9375rem;
  color: var(--muted);
}

.src a {
  color: var(--muted);
}

/* Accordions */
.accordions {
  border-bottom: 1px solid var(--rule);
}

.info-anchor {
  /* Land below the sticky top bar */
  scroll-margin-top: 4.5rem;
}
</style>
