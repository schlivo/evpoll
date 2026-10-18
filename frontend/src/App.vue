<script setup>
import { ref, provide, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import HomeView from './views/HomeView.vue'
import EnqueteView from './views/EnqueteView.vue'

const route = useRoute()
const router = useRouter()
const isStandalonePage = computed(() => route.meta?.standalone === true)

const isEnqueteOpen = ref(false)
const isPrivacyOpen = ref(false)
const coproName = ref('')
// Public instance config (/api/config), shared with the views
const instanceConfig = ref({})

const fetchConfig = async () => {
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      const config = await response.json()
      coproName.value = config.copro_name || ''
      instanceConfig.value = config
    }
  } catch (error) {
    console.error('Failed to load config:', error)
  }
}

provide('coproName', coproName)
provide('instanceConfig', instanceConfig)

const privacy = computed(() => instanceConfig.value.privacy || {})
const retentionText = computed(() => {
  const days = privacy.value.retention_days || 730
  return days % 365 === 0 ? `${days / 365} an${days >= 730 ? 's' : ''}` : `${days} jours`
})

// ---- Privacy policy (modal, reachable from the home page and the survey)
const privacyCloseButton = ref(null)
let privacyReturnFocus = null

const openPrivacy = async () => {
  privacyReturnFocus = document.activeElement
  isPrivacyOpen.value = true
  document.body.style.overflow = 'hidden'
  await nextTick()
  privacyCloseButton.value?.focus()
}

const closePrivacy = () => {
  isPrivacyOpen.value = false
  document.body.style.overflow = ''
  privacyReturnFocus?.focus?.()
}
provide('openPrivacy', openPrivacy)

// ---- Survey: a full-screen page of its own, not an overlay of the home page
// Opens on the one-screen express answer; the full form is one click away
const enqueteMode = ref('express')
provide('enqueteMode', enqueteMode)
// Lets the home page refresh its totals and "your place" after the survey closes
provide('isEnqueteOpen', isEnqueteOpen)

let homeScrollY = 0

const showEnquete = (mode) => {
  enqueteMode.value = mode === 'full' ? 'full' : 'express'
  if (!isEnqueteOpen.value) homeScrollY = window.scrollY
  isEnqueteOpen.value = true
  window.scrollTo(0, 0)
}

const hideEnquete = async () => {
  if (!isEnqueteOpen.value) return
  isEnqueteOpen.value = false
  await nextTick()
  window.scrollTo(0, homeScrollY)
}

// A history entry is pushed so that the phone's Back button closes the survey
const openEnquete = (mode = 'express') => {
  if (!isEnqueteOpen.value) {
    history.pushState({ ...(history.state || {}), irveEnquete: true }, '')
  }
  showEnquete(mode)
}
provide('openEnquete', openEnquete)

const closeEnquete = () => {
  if (history.state?.irveEnquete) {
    history.back() // popstate hides the survey
  } else {
    hideEnquete()
  }
}
provide('closeEnquete', closeEnquete)

const onPopState = () => {
  if (isEnqueteOpen.value && !history.state?.irveEnquete) hideEnquete()
}

/** Flyer QR codes link to /?express=1 (or /enquete?express=1): open the survey directly. */
const openEnqueteFromUrl = () => {
  const params = new URLSearchParams(location.search)
  if (params.get('express') !== '1' && location.pathname !== '/enquete') return
  showEnquete('express')
  // Drop the query so closing the survey doesn't reopen it on reload
  // (after the router's initial navigation, which would otherwise restore it)
  params.delete('express')
  const hash = location.hash
  router.isReady().then(() => router.replace({ path: '/', query: Object.fromEntries(params), hash }))
}

// ---- "En savoir plus" panels: top bar links, #hash and /comprendre, /faq… routes
const INFO_IDS = ['comprendre', 'options', 'aides', 'faq']
const infoRequest = ref(null)
let infoRequestCount = 0
provide('infoRequest', infoRequest)

const openInfo = (id) => {
  if (!INFO_IDS.includes(id)) return
  if (isEnqueteOpen.value) hideEnquete()
  infoRequest.value = { id, n: ++infoRequestCount }
  history.replaceState(history.state, '', '#' + id)
}
provide('openInfo', openInfo)

const openInfoFromHash = () => {
  const id = location.hash.slice(1)
  if (INFO_IDS.includes(id)) infoRequest.value = { id, n: ++infoRequestCount }
}

watch(() => route.name, (name) => {
  if (INFO_IDS.includes(name)) infoRequest.value = { id: name, n: ++infoRequestCount }
})

// ---- Top bar, x.com style: hides when scrolling down, comes back as soon as
// the user scrolls up, always visible at the top of the page and on the survey
const headerHidden = ref(false)
const SCROLL_THRESHOLD = 8 // px, avoids flicker on tiny scroll moves
const TOP_ZONE = 60
let lastScrollY = 0
let scrollTicking = false

const updateHeader = () => {
  scrollTicking = false
  const y = window.scrollY
  if (isEnqueteOpen.value || y < TOP_ZONE) {
    headerHidden.value = false
    lastScrollY = y
    return
  }
  const delta = y - lastScrollY
  if (Math.abs(delta) < SCROLL_THRESHOLD) return
  headerHidden.value = delta > 0
  lastScrollY = y
}

const onScroll = () => {
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(updateHeader)
}

watch(isEnqueteOpen, () => {
  headerHidden.value = false
  lastScrollY = window.scrollY
})

const onKeydown = (event) => {
  if (event.key === 'Escape' && isPrivacyOpen.value) closePrivacy()
}

onMounted(() => {
  fetchConfig()
  openEnqueteFromUrl()
  openInfoFromHash()
  window.addEventListener('popstate', onPopState)
  window.addEventListener('hashchange', openInfoFromHash)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState)
  window.removeEventListener('hashchange', openInfoFromHash)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <!-- Standalone pages (admin, etc.) -->
  <router-view v-if="isStandalonePage" />

  <template v-else>
    <!-- Survey: full-screen page with a minimal top bar -->
    <div v-if="isEnqueteOpen" class="enquete-page">
      <Navigation minimal @close="closeEnquete" />
      <main class="enquete-main">
        <EnqueteView />
      </main>
    </div>

    <!-- Home page -->
    <div v-show="!isEnqueteOpen" class="home-page">
      <Navigation :hidden="headerHidden" />
      <main>
        <HomeView />
      </main>
      <Footer />
    </div>

    <!-- Privacy policy -->
    <div
      v-if="isPrivacyOpen"
      class="privacy-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
    >
      <div class="privacy-modal-header">
        <h2 id="privacy-title">Politique de confidentialité</h2>
        <button ref="privacyCloseButton" type="button" class="privacy-close" @click="closePrivacy">
          Fermer <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div class="privacy-modal-content">
        <div class="privacy-section">
          <h3>Responsable du traitement</h3>
          <p v-if="privacy.controller">{{ privacy.controller }}</p>
          <p v-else class="privacy-missing">[Responsable du traitement à compléter dans la configuration de l'instance]</p>
          <p v-if="instanceConfig.contact_email">Contact : <a :href="'mailto:' + instanceConfig.contact_email">{{ instanceConfig.contact_email }}</a></p>
        </div>

        <div class="privacy-section">
          <h3>Finalité et base légale</h3>
          <p>Les données collectées servent uniquement à évaluer les besoins en bornes de recharge pour véhicules électriques (IRVE), à savoir quelles places équiper et à préparer la décision de l'assemblée générale.</p>
          <ul>
            <li><strong>Réponses à l'enquête :</strong> intérêt légitime (préparer la décision de l'assemblée générale sur l'équipement du parking)</li>
            <li><strong>Prévention des réponses multiples :</strong> intérêt légitime (fiabilité des résultats de la consultation)</li>
            <li><strong>Adresse e-mail :</strong> votre consentement, que vous pouvez retirer à tout moment</li>
          </ul>
        </div>

        <div class="privacy-section">
          <h3>Données collectées</h3>
          <p>
            Vos réponses <strong>ne sont pas anonymes</strong> : le numéro de place permet de les rattacher à un lot.
            Elles ne sont consultées que par le responsable de l'enquête et ne sont diffusées que sous forme agrégée
            (nombre de places intéressées, sans nom).
          </p>
          <ul>
            <li><strong>Identification :</strong> numéro de place de parking, escalier ou bâtiment (optionnel), numéro d'appartement (optionnel), statut (propriétaire/locataire)</li>
            <li><strong>Besoins :</strong> possession d'un véhicule électrique, niveau d'intérêt, solution préférée, horizon</li>
            <li><strong>Contact :</strong> e-mail (optionnel, uniquement si vous souhaitez être informé)</li>
            <li><strong>Technique :</strong> date de réponse et type de navigateur (user agent). L'adresse IP n'est pas enregistrée avec votre réponse ; elle figure seulement dans le journal de sécurité.</li>
          </ul>
        </div>

        <div class="privacy-section">
          <h3>Prévention des réponses multiples</h3>
          <p>Pour limiter les réponses en double, deux indicateurs techniques sont utilisés :</p>
          <ul>
            <li><strong>Empreinte d'adresse IP :</strong> une empreinte chiffrée (HMAC) de votre adresse IP est associée à la réponse. L'adresse IP elle-même n'est pas conservée avec la réponse. L'empreinte est conservée {{ privacy.ip_hash_retention_days || 30 }} jours, puis supprimée.</li>
            <li><strong>Code de place (facultatif) :</strong> code imprimé sur les papillons distribués dans le parking. Il est lié à une place, pas à une personne.</li>
          </ul>
        </div>

        <div class="privacy-section">
          <h3>Stockage local</h3>
          <p>Après votre réponse, le stockage local de votre navigateur (localStorage) garde, uniquement sur votre appareil : le ou les numéros de place indiqués, la date, le numéro de votre réponse et un jeton qui vous permet de la modifier jusqu'à la date limite de la consultation. Ces informations ne sont transmises à personne ; elles servent à afficher votre place sur le plan et à éviter les réponses en double. Vous pouvez les effacer à tout moment en vidant les données du site dans votre navigateur.</p>
        </div>

        <div class="privacy-section">
          <h3>Durée de conservation</h3>
          <ul>
            <li><strong>Réponses :</strong> {{ retentionText }} au plus après votre réponse, puis suppression automatique</li>
            <li><strong>Empreinte d'adresse IP :</strong> {{ privacy.ip_hash_retention_days || 30 }} jours, puis suppression automatique</li>
            <li><strong>Journal de sécurité (adresses IP) :</strong> {{ privacy.audit_retention_days || 365 }} jours, puis suppression automatique</li>
          </ul>
        </div>

        <div class="privacy-section">
          <h3>Vos droits</h3>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
            <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos réponses</li>
            <li><strong>Retrait du consentement et portabilité :</strong> pour votre adresse e-mail</li>
          </ul>
          <p>Pour exercer ces droits, écrivez <template v-if="instanceConfig.contact_email">à <a :href="'mailto:' + instanceConfig.contact_email">{{ instanceConfig.contact_email }}</a></template><template v-else>au conseil syndical</template>. Vous pouvez aussi introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).</p>
        </div>

        <div class="privacy-section">
          <h3>Sécurité et hébergement</h3>
          <ul>
            <li>Données chiffrées en transit (HTTPS)</li>
            <li v-if="privacy.host">Hébergeur : {{ privacy.host }}. Aucune transmission à d'autres tiers.</li>
            <li v-else>Aucune transmission à des tiers autres que l'hébergeur</li>
            <li>Mots de passe administrateur hashés (bcrypt)</li>
            <li>Protection contre les attaques par force brute</li>
          </ul>
        </div>

        <div class="privacy-section">
          <h3>Cookies</h3>
          <p>Ce site n'utilise pas de cookies tiers, de trackers publicitaires ni d'outils d'analyse. Seul le stockage local du navigateur est utilisé pour des fonctions techniques (prévention des doublons, authentification administrateur).</p>
        </div>

        <div class="privacy-footer">
          <p v-if="privacy.last_updated">Dernière mise à jour : {{ privacy.last_updated }}</p>
          <p v-if="instanceConfig.texts?.footer">{{ instanceConfig.texts.footer }}</p>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.home-page,
.enquete-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
}

.home-page > main,
.enquete-main {
  flex: 1;
}

.enquete-main {
  width: 100%;
}

/* Privacy policy: full-screen sheet */
.privacy-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  background: var(--paper);
}

.privacy-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  padding-top: max(0.75rem, env(safe-area-inset-top));
  background: var(--asphalt);
  color: var(--paint);
  border-bottom: 3px solid var(--signal);
}

@media (min-width: 768px) {
  .privacy-modal-header { padding: 0.875rem 2.5rem; }
}

.privacy-modal-header h2 {
  margin: 0;
  color: var(--paint);
  font-size: 1.25rem;
  letter-spacing: 0.08em;
}

.privacy-close {
  background: none;
  border: 0;
  color: var(--paint);
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0.375rem 0;
}

.privacy-close:hover {
  color: var(--signal);
}

.privacy-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1rem 3rem;
}

.privacy-modal-content > * {
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
}

.privacy-section {
  padding-top: 1rem;
  margin-bottom: 1.25rem;
  border-top: 1px solid var(--rule);
}

.privacy-section h3 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}

.privacy-section p {
  margin: 0 0 0.5rem;
}

.privacy-section ul {
  margin: 0;
  padding-left: 1.25rem;
}

.privacy-section li {
  margin-bottom: 0.5rem;
}

.privacy-missing {
  color: var(--color-warning);
  font-style: italic;
}

.privacy-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--rule);
}

.privacy-footer p {
  margin: 0;
  font-size: 1rem;
  color: var(--muted);
}
</style>
