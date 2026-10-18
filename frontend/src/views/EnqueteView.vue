<script setup>
import { ref, computed, inject, onMounted, watch, nextTick } from 'vue'
import SvgIcon from '../components/SvgIcon.vue'
import PlanPicker from '../components/PlanPicker.vue'
import { fetchPlan } from '../planAccess.js'
import { parkingSpotError } from '../utils/parking.js'

const closeEnquete = inject('closeEnquete')
const openPrivacy = inject('openPrivacy', () => {})
// 'express' (one screen) or 'full' (4 steps), chosen by App.vue
const enqueteMode = inject('enqueteMode', ref('express'))
const entryParams = inject('entryParams', ref({}))

const openPrivacyPolicy = () => {
  openPrivacy()
}

const currentStep = ref(1)
const totalSteps = 4
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')
const configLoading = ref(true)
const hasExistingSubmission = ref(false)
// Marker of the answer given on this device ({ spots, id, token, token_expires_at })
const existingMarker = ref(null)
// Set after an answer (or from the marker) so later edits update it instead of adding a new one
const editContext = ref(null)
const lastSubmitWasExpress = ref(false)
// Answer from the server after submission (conflict, verification)
const submitResult = ref(null)
// True while the express form edits an existing answer ("Modifier ma réponse")
const isEditing = ref(false)
const editError = ref('')

// Anti-bot: hidden field that people never fill, and time spent on the form
const honeypot = ref('')
const formShownAt = ref(Date.now())
// Signed server timestamp, required to send a new answer (one token per answer)
const formToken = ref('')

const fetchFormToken = async () => {
  try {
    const response = await fetch('/api/survey/form-token', { cache: 'no-store' })
    if (response.ok) formToken.value = (await response.json()).form_token
  } catch (e) {
    // The server will ask to reload the page if the token is missing
  }
}
// Place code printed on the windshield flyer (?p=83&c=K7M4QX)
const placeCode = ref('')
// Campaign key of the generic documents (QR code / short URL /r/KEY -> ?k=KEY)
const campaignKey = ref('')
// Code typed by people who arrived without a QR code (place code or campaign key)
const typedCode = ref('')
const codeRequired = ref(false)
const CAMPAIGN_KEY_STORAGE = 'evpoll_campaign_key_in'
const hasPrintedCode = computed(() => !!(placeCode.value || campaignKey.value))
// Spots of the windshield flyer the place code belongs to (?p=83-84)
const codeSpots = ref([])
const sameSpots = (a, b) => a.length === b.length && a.every(x => b.includes(x))
// The place code only verifies the answer for the spots printed on that flyer
const placeCodeApplies = computed(() =>
  !!placeCode.value && !formData.value.no_parking && sameSpots(typedSpots.value, codeSpots.value)
)

const plan = ref(null)
// The plan is public, or sent only with a printed code (see planAccess.js)
const planPublic = ref(false)
const showPlanPicker = computed(() => !!plan.value || (planPublic.value && parkingSpots.value > 0))
const lots = ref([])

// Optional "keep me informed" block on the thank-you screen of an express answer
const contactForm = ref({ email: '', consent: false })
const contactError = ref('')
const contactSaving = ref(false)
const contactSaved = ref(false)

const formData = ref({
  building: '',
  apartment: '',
  parking_spot: '',
  no_parking: false,
  status: '',
  has_ev: '',
  interested: '',
  preferred_solution: '',
  timeline: '',
  email: '',
  consent_contact: false,
  consent_timestamp: null
})

const errors = ref({})
// Building / staircase choices from the instance config
const buildingChoices = ref(['A', 'B', 'C', 'D'].map(id => ({ id, label: `Bâtiment ${id}` })))
const buildingQuestion = ref('Votre bâtiment')
const parkingSpots = ref(null)
const multiSpotLots = ref([])
const privacy = ref({})
// Spots for which the respondent answered the "both spots?" question
const answeredLotPrompts = ref([])
const contactEmail = ref('')
const syndicEmail = ref('')

// Storage key for submission marker
const SUBMISSION_STORAGE_KEY = 'irve_survey_submission'

// Check for an answer already given on this device
const checkExistingSubmission = () => {
  try {
    const stored = localStorage.getItem(SUBMISSION_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const tokenValid = data.token && data.token_expires_at && new Date(data.token_expires_at) > new Date()
      // Without a valid token the marker only lasts 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      if (tokenValid || new Date(data.timestamp) > thirtyDaysAgo) {
        hasExistingSubmission.value = true
        existingMarker.value = data
        if (tokenValid) editContext.value = { id: data.id, token: data.token }
        return true
      }
    }
  } catch (e) {
    // Invalid data, ignore
  }
  return false
}

// Save the submission marker (also read by the home page to light up the spot)
const saveSubmissionMarker = (data) => {
  try {
    const previous = existingMarker.value || {}
    const marker = {
      timestamp: new Date().toISOString(),
      building: formData.value.building,
      spots: typedSpots.value,
      id: data.id ?? previous.id,
      token: data.edit_token ?? previous.token,
      token_expires_at: data.edit_token_expires_at ?? previous.token_expires_at,
      submitted: true
    }
    localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(marker))
    existingMarker.value = marker
  } catch (e) {
    // localStorage not available, continue without marker
  }
}

const markerSpotsText = computed(() => (existingMarker.value?.spots || []).join('-'))

// Watch consent checkbox to record timestamp
watch(() => formData.value.consent_contact, (newValue) => {
  if (newValue && !formData.value.consent_timestamp) {
    formData.value.consent_timestamp = new Date().toISOString()
  }
})

const resetAnswers = () => {
  Object.assign(formData.value, {
    building: '', apartment: '', parking_spot: '', no_parking: false, status: '',
    has_ev: '', interested: '', preferred_solution: '', timeline: '',
    email: '', consent_contact: false, consent_timestamp: null
  })
  answeredLotPrompts.value = []
  errors.value = {}
  submitError.value = ''
  formShownAt.value = Date.now()
  fetchFormToken()
}

// "Modifier ma réponse": load the answer with the edit token and reopen the express form
const editExistingAnswer = async () => {
  editError.value = ''
  if (!editContext.value) {
    editError.value = 'Cette réponse ne peut plus être modifiée depuis cet appareil. Contactez le conseil syndical.'
    return
  }
  try {
    const response = await fetch(`/api/survey/${editContext.value.id}`, {
      headers: { 'X-Edit-Token': editContext.value.token }
    })
    if (!response.ok) throw new Error('forbidden')
    const data = await response.json()
    const answer = data.response || data
    resetAnswers()
    for (const key of Object.keys(formData.value)) {
      if (answer[key] !== undefined && answer[key] !== null) formData.value[key] = answer[key]
    }
    formData.value.no_parking = !!answer.no_parking
    formData.value.consent_contact = !!answer.consent_contact
    answeredLotPrompts.value = typedSpots.value
    isEditing.value = true
    hasExistingSubmission.value = false
    enqueteMode.value = 'express'
  } catch (e) {
    editError.value = 'Cette réponse ne peut plus être modifiée en ligne. Contactez le conseil syndical.'
  }
}

// "Répondre pour une autre place": a new, separate answer
const answerAnotherSpot = () => {
  resetAnswers()
  editContext.value = null
  isEditing.value = false
  hasExistingSubmission.value = false
  enqueteMode.value = 'express'
}

// Fetch configuration from API
onMounted(async () => {
  // Check for existing submission first
  checkExistingSubmission()

  // Windshield flyer QR code: ?p=83&c=K7M4QX prefills the spot and carries the place code
  // (App.vue passes them along, as it cleans the address bar when opening the survey)
  const params = new URLSearchParams(location.search)
  for (const [key, value] of Object.entries(entryParams.value || {})) {
    if (value && !params.has(key)) params.set(key, value)
  }
  if (params.get('p')) {
    codeSpots.value = params.get('p').split(/[-,\s]+/).map(Number).filter(Boolean)
  }
  if (params.get('p') && !hasExistingSubmission.value) {
    formData.value.parking_spot = params.get('p').replace(/-/g, ', ')
  }
  if (params.get('c')) placeCode.value = params.get('c').toUpperCase().slice(0, 12)
  try {
    if (params.get('k')) sessionStorage.setItem(CAMPAIGN_KEY_STORAGE, params.get('k').toUpperCase().slice(0, 12))
    campaignKey.value = sessionStorage.getItem(CAMPAIGN_KEY_STORAGE) || ''
  } catch (e) {
    campaignKey.value = (params.get('k') || '').toUpperCase().slice(0, 12)
  }
  if (params.has('p') || params.has('c') || params.has('k')) {
    params.delete('p')
    params.delete('c')
    params.delete('k')
    const query = params.toString()
    history.replaceState(history.state, '', location.pathname + (query ? '?' + query : '') + location.hash)
  }

  loadPlan(placeCode.value ? { code: placeCode.value, spot: codeSpots.value.join(',') } : (campaignKey.value ? { code: campaignKey.value } : undefined))
  fetchFormToken()

  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      const config = await response.json()
      if (config.building_choices) {
        buildingChoices.value = config.building_choices
      } else if (config.buildings) {
        buildingChoices.value = config.buildings.map(id => ({ id, label: `Bâtiment ${id}` }))
      }
      buildingQuestion.value = config.building_question || buildingQuestion.value
      parkingSpots.value = config.parking_spots || null
      multiSpotLots.value = config.multi_spot_lots || []
      lots.value = config.lots || config.multi_spot_lots || []
      privacy.value = config.privacy || {}
      codeRequired.value = !!config.campaign_key_required
      planPublic.value = config.plan_requires_code === false
      // Empty when the instance has no real address configured: then nothing is shown
      contactEmail.value = config.contact_email === 'conseil-syndical@exemple.fr' ? '' : (config.contact_email || '')
      syndicEmail.value = config.syndic_email === 'syndic@exemple.fr' ? '' : (config.syndic_email || '')
    }
  } catch (err) {
    console.warn('Could not load config, using defaults')
  } finally {
    configLoading.value = false
  }
})

const progress = computed(() => (currentStep.value / totalSteps) * 100)

const spotPlaceholder = computed(() =>
  parkingSpots.value ? `Entre 1 et ${parkingSpots.value}, ex : 45 ou 83, 84` : 'Ex : 45 ou 83, 84'
)

// Typing a spot number unticks "no spot", and vice versa
watch(() => formData.value.parking_spot, (value) => {
  if (value?.trim()) formData.value.no_parking = false
})
watch(() => formData.value.no_parking, (value) => {
  if (value) formData.value.parking_spot = ''
})

const typedSpots = computed(() =>
  (formData.value.parking_spot || '').split(/[,;/\s]+|\bet\b/i).map(p => parseInt(p, 10)).filter(Boolean)
)

// First typed spot belonging to a multi-spot lot whose other spots are missing
const lotPrompt = computed(() => {
  for (const spot of typedSpots.value) {
    if (answeredLotPrompts.value.includes(spot)) continue
    const lot = multiSpotLots.value.find(l => l.places.includes(spot))
    if (lot && !lot.places.every(p => typedSpots.value.includes(p))) {
      return { spot, lot, others: lot.places.filter(p => !typedSpots.value.includes(p)) }
    }
  }
  return null
})

const answerLotPrompt = (includeAll) => {
  const prompt = lotPrompt.value
  if (!prompt) return
  answeredLotPrompts.value.push(...prompt.lot.places)
  if (includeAll) {
    const spots = [...new Set([...typedSpots.value, ...prompt.lot.places])].sort((a, b) => a - b)
    formData.value.parking_spot = spots.join(', ')
  }
}

// "Place 82 · lot n°144 · place simple" under the big spot number
const spotDescription = computed(() => {
  const spots = typedSpots.value
  if (!spots.length || parkingSpotError(formData.value.parking_spot, parkingSpots.value)) return null
  const lot = lots.value.find(l => l.places.includes(spots[0]))
  return {
    places: spots.join('-'),
    plural: spots.length > 1,
    lot: lot?.lot,
    type: lot ? (lot.places.length > 1 ? `lot double ${lot.places.join('-')}` : 'place simple') : ''
  }
})

// Tapping a spot on the plan replaces the typed number
const selectOnPlan = (spot) => {
  formData.value.parking_spot = String(spot)
  answeredLotPrompts.value = []
}

// Full plan with the chosen spot still highlighted, to check where it is in the car park
const loadPlan = async (access) => {
  const result = await fetchPlan(access)
  if (result) plan.value = result
}

// A code typed by hand also opens the plan (place code: with the typed spot)
let typedCodeTimer = null
watch([typedCode, typedSpots], ([code]) => {
  clearTimeout(typedCodeTimer)
  if (plan.value || code.replace(/[^a-z0-9]/gi, '').length < 6) return
  typedCodeTimer = setTimeout(() => loadPlan({ code: code.trim(), spot: typedSpots.value.join(',') }), 400)
})

const showFullPlan = ref(false)
const planBox = ref(null)

const toggleFullPlan = async () => {
  showFullPlan.value = !showFullPlan.value
  if (!showFullPlan.value) return
  await nextTick()
  // Scroll the (horizontally scrollable) plan so the chosen spot is centred
  const box = planBox.value
  const spotEl = box?.querySelector(`[data-place="${typedSpots.value[0]}"]`)
  if (box && spotEl) {
    const b = box.getBoundingClientRect()
    const r = spotEl.getBoundingClientRect()
    box.scrollLeft += (r.left + r.width / 2) - (b.left + b.width / 2)
  }
}

// Typing another number goes back to the zoomed view
watch(() => formData.value.parking_spot, () => { showFullPlan.value = false })

const expressComplete = computed(() =>
  (formData.value.no_parking || (typedSpots.value.length && !parkingSpotError(formData.value.parking_spot, parkingSpots.value))) &&
  !!formData.value.has_ev && !!formData.value.interested &&
  (!codeRequired.value || hasPrintedCode.value || typedCode.value.trim().length >= 6)
)

const retentionText = computed(() => {
  const days = privacy.value.retention_days || 730
  return days % 365 === 0 ? `${days / 365} an${days >= 730 ? 's' : ''}` : `${days} jours`
})

const validateParkingSpot = () => {
  const { parking_spot, no_parking } = formData.value
  if (!parking_spot?.trim() && !no_parking) {
    errors.value.parking_spot = 'Indiquez votre numéro de place, ou cochez « Je n\'ai pas de place / je ne sais pas »'
    return
  }
  const error = parkingSpotError(parking_spot, parkingSpots.value)
  if (error) errors.value.parking_spot = error
}

const validateExpress = () => {
  errors.value = {}
  validateParkingSpot()
  if (!formData.value.has_ev) {
    errors.value.has_ev = 'Veuillez répondre à cette question'
  }
  if (!formData.value.interested) {
    errors.value.interested = 'Veuillez indiquer votre intérêt'
  }
  return Object.keys(errors.value).length === 0
}

const validateStep = (step) => {
  errors.value = {}

  if (step === 1) {
    validateParkingSpot()
    if (!formData.value.status) {
      errors.value.status = 'Veuillez indiquer votre statut'
    }
  }

  if (step === 2) {
    if (!formData.value.has_ev) {
      errors.value.has_ev = 'Veuillez répondre à cette question'
    }
  }

  if (step === 3) {
    if (!formData.value.interested) {
      errors.value.interested = 'Veuillez indiquer votre intérêt'
    }
  }

  return Object.keys(errors.value).length === 0
}

const nextStep = () => {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < totalSteps) {
      currentStep.value++
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const sendAnswers = async (express) => {
  isSubmitting.value = true
  submitError.value = ''

  // Completing (full form after express) or editing (Modifier ma réponse) updates the same answer
  const completing = (!express || isEditing.value) && editContext.value
  const url = completing ? `/api/survey/${editContext.value.id}` : '/api/survey'
  const antiBot = {
    website: honeypot.value,
    form_token: formToken.value,
    form_elapsed_ms: Date.now() - formShownAt.value,
    code: placeCode.value || typedCode.value.trim() || undefined,
    campaign_key: campaignKey.value || undefined
  }
  const payload = completing
    ? { ...formData.value, express: express || undefined, edit_token: editContext.value.token }
    : express
      ? { ...formData.value, email: '', consent_contact: false, consent_timestamp: null, express, ...antiBot }
      : { ...formData.value, express, ...antiBot }

  try {
    const response = await fetch(url, {
      method: completing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (response.ok) {
      saveSubmissionMarker(data)
      if (data.edit_token) editContext.value = { id: data.id, token: data.edit_token }
      submitResult.value = data
      if (!completing) fetchFormToken()
      lastSubmitWasExpress.value = express
      isEditing.value = false
      isSubmitted.value = true
    } else if (data.error === 'code_required') {
      submitError.value = data.message
    } else if (data.error === 'form_token') {
      // Expired (page left open for hours) or already used: get a new one, the person can resend
      await fetchFormToken()
      submitError.value = data.message
    } else if (response.status === 409 && data.error === 'duplicate') {
      // Duplicate submission detected by server
      submitError.value = data.message || 'Une réponse similaire a déjà été enregistrée.'
    } else {
      submitError.value = data.errors?.join(', ') || data.message || 'Une erreur est survenue'
    }
  } catch (error) {
    submitError.value = 'Impossible de soumettre le formulaire. Veuillez réessayer.'
  } finally {
    isSubmitting.value = false
  }
}

const submitExpress = async () => {
  if (!validateExpress() || isSubmitting.value) return
  await sendAnswers(true)
}

const submitForm = async () => {
  if (!validateStep(currentStep.value)) return
  await sendAnswers(false)
}

const saveContact = async () => {
  contactError.value = ''
  const email = contactForm.value.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    contactError.value = 'Veuillez saisir une adresse e-mail valide'
    return
  }
  if (!contactForm.value.consent) {
    contactError.value = 'Cochez la case pour accepter d\'être contacté'
    return
  }
  contactSaving.value = true
  const consentTimestamp = new Date().toISOString()
  try {
    const response = await fetch(`/api/survey/${editContext.value.id}/contact`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edit_token: editContext.value.token,
        email,
        consent_contact: true,
        consent_timestamp: consentTimestamp
      })
    })
    const data = await response.json()
    if (response.ok) {
      contactSaved.value = true
      // Keep the full form consistent if the respondent completes it afterwards
      formData.value.email = email
      formData.value.consent_contact = true
      formData.value.consent_timestamp = consentTimestamp
    } else {
      contactError.value = data.errors?.join(', ') || data.message || 'Une erreur est survenue'
    }
  } catch (error) {
    contactError.value = 'Impossible d\'enregistrer votre e-mail. Veuillez réessayer.'
  } finally {
    contactSaving.value = false
  }
}

// Switch to the full form, prefilled with the express answers
const completeAnswers = () => {
  isSubmitted.value = false
  enqueteMode.value = 'full'
  currentStep.value = 1
  errors.value = {}
  submitError.value = ''
}

const switchToFull = () => {
  enqueteMode.value = 'full'
  errors.value = {}
  submitError.value = ''
}

</script>

<template>
  <div class="page enquete" :class="{ 'is-express': enqueteMode === 'express' && !isSubmitted && !hasExistingSubmission }">
    <div class="container">
      <p class="indicative">
        Consultation indicative : seule l'assemblée générale décide. Une réponse par place ;
        en cas de réponses contradictoires, le conseil syndical vérifie.
      </p>

      <!-- Already answered on this device -->
      <div v-if="hasExistingSubmission && !isSubmitted" class="state-card fade-in">
        <h2 class="state-title">
          Merci, votre réponse
          <template v-if="markerSpotsText">pour la place {{ markerSpotsText }}</template>
          est enregistrée
        </h2>
        <p>Vous pouvez la modifier jusqu'à la date limite de la consultation.</p>
        <button type="button" class="btn-signal" @click="editExistingAnswer">
          Modifier ma réponse
        </button>
        <p v-if="editError" class="form-error">{{ editError }}</p>
        <p class="state-links">
          <a href="#" @click.prevent="answerAnotherSpot">Répondre pour une autre place</a>
          <span aria-hidden="true">·</span>
          <a href="#" @click.prevent="closeEnquete">Retour à l'accueil</a>
        </p>
      </div>

      <!-- Success state -->
      <div v-else-if="isSubmitted" class="state-card fade-in">
        <h2 class="state-title">
          Merci !
          <template v-if="typedSpots.length">Votre réponse pour la place {{ typedSpots.join('-') }} est enregistrée.</template>
          <template v-else>Votre réponse est enregistrée.</template>
        </h2>
        <p v-if="submitResult?.verification === 'verifiee'" class="verified-line">
          ✓ Réponse vérifiée par le code du papillon
        </p>
        <p v-if="submitResult?.conflict" class="state-note">
          Une autre réponse existe déjà pour ce lot : le conseil syndical vérifiera.
        </p>
        <p v-else>Elle aidera à dimensionner le projet présenté en assemblée générale.</p>

        <div v-if="lastSubmitWasExpress && editContext" class="contact-block">
          <template v-if="!contactSaved">
            <h3>Être informé de la suite (facultatif)</h3>
            <div class="form-group">
              <label class="form-label" for="contact_email">Votre e-mail</label>
              <input
                type="email"
                id="contact_email"
                v-model="contactForm.email"
                class="form-input"
                autocomplete="email"
                placeholder="votre@email.com"
              />
            </div>
            <label class="plain-check">
              <input type="checkbox" v-model="contactForm.consent" />
              <span>
                <strong>J'accepte d'être contacté.</strong>
                Mon e-mail sert uniquement à m'informer de l'avancement du projet IRVE.
                Je peux retirer mon consentement à tout moment.
              </span>
            </label>
            <span v-if="contactError" class="form-error">{{ contactError }}</span>
            <button
              type="button"
              class="btn-outline contact-submit"
              :disabled="contactSaving"
              @click="saveContact"
            >
              {{ contactSaving ? 'Enregistrement...' : 'M\'informer' }}
            </button>
          </template>
          <p v-else class="contact-saved">
            C'est noté : vous serez informé de la suite du projet.
          </p>
        </div>

        <div class="state-actions">
          <button
            v-if="lastSubmitWasExpress && editContext"
            @click="completeAnswers"
            class="btn-outline"
          >
            Compléter mes réponses (facultatif)
          </button>
          <button @click="closeEnquete" class="btn-signal">
            Retour à l'accueil
          </button>
        </div>
      </div>

      <!-- Express answer: one screen, mobile first -->
      <div v-else-if="enqueteMode === 'express'" class="express fade-in">
        <h1 class="express-title">Votre place<br>en 30 secondes</h1>
        <p v-if="isEditing" class="state-note">Vous modifiez votre réponse.</p>

        <div class="form-group">
          <label class="form-label" for="express_parking_spot">Numéro de votre place</label>
          <div class="spot-floor" :class="{ disabled: formData.no_parking }">
            <input
              type="text"
              id="express_parking_spot"
              v-model="formData.parking_spot"
              class="spot-input"
              :class="{ long: formData.parking_spot.length > 3 }"
              inputmode="numeric"
              autocomplete="off"
              :placeholder="parkingSpots ? `1 à ${parkingSpots}` : 'N°'"
              :disabled="formData.no_parking"
              aria-describedby="spot-help"
            />
          </div>
          <p v-if="spotDescription" class="spot-line" aria-live="polite">
            Place{{ spotDescription.plural ? 's' : '' }} {{ spotDescription.places }}
            <template v-if="spotDescription.lot"> · <strong>lot n°{{ spotDescription.lot }}</strong> · {{ spotDescription.type }}</template>
          </p>
          <p v-else id="spot-help" class="form-hint">{{ showPlanPicker ? 'Touchez votre place sur le plan ou tapez son numéro.' : 'Tapez le numéro de votre place.' }} Plusieurs places : séparez-les par une virgule.</p>
          <!-- Where the answer comes from (validated by the server only when sending) -->
          <p v-if="placeCode && placeCodeApplies" class="origin-line">
            Lien du papillon de la place {{ codeSpots.join('-') }}
          </p>
          <p v-else-if="placeCode && codeSpots.length" class="origin-line warn">
            Le code de votre papillon vaut pour la place {{ codeSpots.join('-') }} : pour une autre place,
            la réponse sera simplement déclarative.
          </p>
          <p v-else-if="campaignKey" class="origin-line">Lien d'un document de la résidence</p>

          <div v-if="lotPrompt" class="lot-prompt">
            <p>
              Place {{ lotPrompt.spot }} – lot double {{ lotPrompt.lot.places.join('-') }}
              (lot n°{{ lotPrompt.lot.lot }}). Vos deux places sont-elles concernées ?
            </p>
            <div class="segmented compact">
              <button type="button" @click="answerLotPrompt(true)">Oui, les deux</button>
              <button type="button" @click="answerLotPrompt(false)">Non, la {{ lotPrompt.spot }} seule</button>
            </div>
          </div>

          <div v-if="!formData.no_parking && showPlanPicker" ref="planBox" class="plan-box" :class="{ mini: typedSpots.length && !showFullPlan }">
            <PlanPicker
              :plan="plan"
              :parking-spots="parkingSpots || 0"
              :lots="multiSpotLots"
              :selected="typedSpots"
              :focus-selected="typedSpots.length > 0 && !showFullPlan"
              interactive
              label="Plan du parking : touchez votre place"
              @select="selectOnPlan"
            />
          </div>
          <button
            v-if="typedSpots.length && !formData.no_parking && showPlanPicker"
            type="button"
            class="link-button"
            :aria-pressed="showFullPlan"
            @click="toggleFullPlan"
          >
            {{ showFullPlan ? 'Revenir au zoom sur ma place' : 'Voir ma place sur tout le plan' }}
          </button>

          <label class="plain-check">
            <input type="checkbox" v-model="formData.no_parking" />
            <span>Je n'ai pas de place / je ne sais pas</span>
          </label>
          <span v-if="errors.parking_spot" class="form-error">{{ errors.parking_spot }}</span>
        </div>

        <fieldset class="form-group">
          <legend class="form-label">Véhicule électrique ou hybride rechargeable ?</legend>
          <div class="segmented">
            <label
              v-for="opt in [{ v: 'oui', l: 'Oui' }, { v: 'projet', l: 'En projet' }, { v: 'non', l: 'Non' }]"
              :key="opt.v"
              :class="{ selected: formData.has_ev === opt.v }"
            >
              <input type="radio" v-model="formData.has_ev" :value="opt.v" name="express_has_ev" />
              {{ opt.l }}
            </label>
          </div>
          <span v-if="errors.has_ev" class="form-error">{{ errors.has_ev }}</span>
        </fieldset>

        <fieldset class="form-group">
          <legend class="form-label">Intéressé par une borne sur votre place ?</legend>
          <div class="segmented">
            <label
              v-for="opt in [{ v: 'oui', l: 'Oui' }, { v: 'peut-etre', l: 'Peut-être' }, { v: 'non', l: 'Non' }]"
              :key="opt.v"
              :class="{ selected: formData.interested === opt.v }"
            >
              <input type="radio" v-model="formData.interested" :value="opt.v" name="express_interested" />
              {{ opt.l }}
            </label>
          </div>
          <span v-if="errors.interested" class="form-error">{{ errors.interested }}</span>
        </fieldset>

        <!-- People arriving without a QR code: the code printed under it on their document -->
        <div v-if="!hasPrintedCode && !isEditing" class="form-group">
          <label class="form-label" for="printed_code">
            Code imprimé sous le QR code de votre document{{ codeRequired ? '' : ' (facultatif)' }}
          </label>
          <input
            id="printed_code"
            v-model="typedCode"
            type="text"
            class="form-input code-input"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            maxlength="12"
            placeholder="Ex. K7M4QX"
          />
          <p class="form-hint">Sur la note, le flyer ou le papillon de pare-brise. Il confirme que la réponse vient de la résidence.</p>
        </div>

        <!-- Honeypot: hidden from people and assistive tech, bots fill it -->
        <div class="hp" aria-hidden="true">
          <label for="website">Ne pas remplir</label>
          <input id="website" v-model="honeypot" type="text" name="website" tabindex="-1" autocomplete="off" />
        </div>

        <p class="data-line">
          Réponse non anonyme, jamais affichée individuellement.
          <a href="#" @click.prevent="openPrivacyPolicy">Vos données</a>
        </p>

        <div v-if="submitError" class="alert alert-error">
          {{ submitError }}
        </div>

        <p v-if="!isEditing" class="full-link">
          <button type="button" class="link-button" @click="switchToFull">
            Préférez-vous le questionnaire complet (4 étapes) ?
          </button>
        </p>

        <div class="sticky-submit">
          <button
            type="button"
            class="btn-signal btn-block"
            :disabled="!expressComplete || isSubmitting"
            @click="submitExpress"
          >
            {{ isSubmitting ? 'Envoi en cours...' : (isEditing ? 'Enregistrer' : 'Envoyer') }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <div v-else-if="!hasExistingSubmission" class="survey-form">
        <!-- Progress bar -->
        <div class="progress-container">
          <div class="progress-info">
            <span>Étape {{ currentStep }} sur {{ totalSteps }}</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>

        <!-- Step 1: Identification -->
        <div v-show="currentStep === 1" class="form-step fade-in">
          <h2>Votre situation</h2>
          <p class="step-description">
            Votre numéro de place permet de savoir quelles places équiper.
            Il ne sera jamais publié individuellement.
          </p>

          <div class="form-group">
            <label class="form-label" for="parking_spot">
              Votre numéro de place de parking <span class="required">*</span>
            </label>
            <input
              type="text"
              id="parking_spot"
              v-model="formData.parking_spot"
              class="form-input"
              inputmode="numeric"
              autocomplete="off"
              :placeholder="spotPlaceholder"
              :disabled="formData.no_parking"
            />
            <span class="form-hint">Plusieurs places ? Séparez-les par une virgule.</span>
            <label class="checkbox-option compact" :class="{ selected: formData.no_parking }">
              <input type="checkbox" v-model="formData.no_parking" />
              <span class="checkbox-label">
                <strong>Je n'ai pas de place / je ne sais pas</strong>
              </span>
            </label>
            <div v-if="lotPrompt" class="lot-prompt">
              <p>
                Place {{ lotPrompt.spot }} – lot double {{ lotPrompt.lot.places.join('-') }}
                (lot n°{{ lotPrompt.lot.lot }}). Vos deux places sont-elles concernées ?
              </p>
              <div class="lot-prompt-actions">
                <button type="button" class="btn btn-secondary btn-sm" @click="answerLotPrompt(true)">
                  Oui, ajouter la place {{ lotPrompt.others.join(', ') }}
                </button>
                <button type="button" class="btn btn-link btn-sm" @click="answerLotPrompt(false)">
                  Non, seulement la {{ lotPrompt.spot }}
                </button>
              </div>
            </div>
            <span v-if="errors.parking_spot" class="form-error">{{ errors.parking_spot }}</span>
          </div>

          <div class="form-group" v-if="buildingChoices.length">
            <label class="form-label">
              {{ buildingQuestion }} (optionnel)
            </label>
            <div class="radio-group">
              <label
                v-for="b in buildingChoices"
                :key="b.id"
                class="radio-option"
                :class="{ selected: formData.building === b.id }"
              >
                <input
                  type="radio"
                  v-model="formData.building"
                  :value="b.id"
                  name="building"
                />
                <span class="radio-label">
                  <strong>{{ b.label }}</strong>
                  <span v-if="b.address">{{ b.address }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="apartment">
              Numéro d'appartement (optionnel)
            </label>
            <input
              type="text"
              id="apartment"
              v-model="formData.apartment"
              class="form-input"
              placeholder="Ex: 12, A3..."
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              Vous êtes : <span class="required">*</span>
            </label>
            <div class="radio-group">
              <label
                class="radio-option"
                :class="{ selected: formData.status === 'proprietaire' }"
              >
                <input
                  type="radio"
                  v-model="formData.status"
                  value="proprietaire"
                  name="status"
                />
                <span class="radio-label">
                  <strong>Propriétaire</strong>
                  <span>Vous possédez le logement</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.status === 'locataire' }"
              >
                <input
                  type="radio"
                  v-model="formData.status"
                  value="locataire"
                  name="status"
                />
                <span class="radio-label">
                  <strong>Locataire</strong>
                  <span>Vous louez le logement</span>
                </span>
              </label>
            </div>
            <span v-if="errors.status" class="form-error">{{ errors.status }}</span>
          </div>
        </div>

        <!-- Step 2: Current situation -->
        <div v-show="currentStep === 2" class="form-step fade-in">
          <h2>Votre véhicule</h2>
          <p class="step-description">
            Aidez-nous à évaluer les besoins actuels et futurs.
          </p>

          <div class="form-group">
            <label class="form-label">
              Avez-vous un véhicule électrique ou hybride rechargeable ? <span class="required">*</span>
            </label>
            <div class="radio-group">
              <label
                class="radio-option"
                :class="{ selected: formData.has_ev === 'oui' }"
              >
                <input
                  type="radio"
                  v-model="formData.has_ev"
                  value="oui"
                  name="has_ev"
                />
                <span class="radio-label">
                  <strong>Oui, j'en ai un</strong>
                  <span>Je possède déjà un VE ou hybride rechargeable</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.has_ev === 'projet' }"
              >
                <input
                  type="radio"
                  v-model="formData.has_ev"
                  value="projet"
                  name="has_ev"
                />
                <span class="radio-label">
                  <strong>Non, mais c'est prévu</strong>
                  <span>J'envisage d'en acquérir un prochainement</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.has_ev === 'non' }"
              >
                <input
                  type="radio"
                  v-model="formData.has_ev"
                  value="non"
                  name="has_ev"
                />
                <span class="radio-label">
                  <strong>Non, pas pour l'instant</strong>
                  <span>Je n'ai pas de projet d'achat à court terme</span>
                </span>
              </label>
            </div>
            <span v-if="errors.has_ev" class="form-error">{{ errors.has_ev }}</span>
          </div>

        </div>

        <!-- Step 3: Interest -->
        <div v-show="currentStep === 3" class="form-step fade-in">
          <h2>Votre intérêt</h2>
          <p class="step-description">
            Indiquez votre niveau d'intérêt pour une solution de recharge collective.
          </p>

          <div class="form-group">
            <label class="form-label">
              Seriez-vous intéressé par l'installation d'une infrastructure de recharge ? <span class="required">*</span>
            </label>
            <div class="radio-group">
              <label
                class="radio-option"
                :class="{ selected: formData.interested === 'oui' }"
              >
                <input
                  type="radio"
                  v-model="formData.interested"
                  value="oui"
                  name="interested"
                />
                <span class="radio-label">
                  <strong>Oui, je suis intéressé</strong>
                  <span>Je souhaite pouvoir recharger dans la copropriété</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.interested === 'peut-etre' }"
              >
                <input
                  type="radio"
                  v-model="formData.interested"
                  value="peut-etre"
                  name="interested"
                />
                <span class="radio-label">
                  <strong>Peut-être, je souhaite en savoir plus</strong>
                  <span>J'aimerais plus d'informations avant de décider</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.interested === 'non' }"
              >
                <input
                  type="radio"
                  v-model="formData.interested"
                  value="non"
                  name="interested"
                />
                <span class="radio-label">
                  <strong>Non, cela ne m'intéresse pas</strong>
                  <span>Je n'ai pas besoin de cette infrastructure</span>
                </span>
              </label>
            </div>
            <span v-if="errors.interested" class="form-error">{{ errors.interested }}</span>
          </div>

          <div class="form-group" v-if="formData.interested !== 'non'">
            <label class="form-label">
              Quelle solution préféreriez-vous ?
            </label>
            <div class="radio-group">
              <label
                class="radio-option"
                :class="{ selected: formData.preferred_solution === 'enedis' }"
              >
                <input
                  type="radio"
                  v-model="formData.preferred_solution"
                  value="enedis"
                  name="preferred_solution"
                />
                <span class="radio-label">
                  <strong>Colonne horizontale Enedis</strong>
                  <span>Compteur individuel, contrat avec le fournisseur de votre choix</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.preferred_solution === 'operateur' }"
              >
                <input
                  type="radio"
                  v-model="formData.preferred_solution"
                  value="operateur"
                  name="preferred_solution"
                />
                <span class="radio-label">
                  <strong>Opérateur de recharge (ex. Zeplug, izi by EDF…)</strong>
                  <span>Solution clé en main avec abonnement</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.preferred_solution === 'individuelle' }"
              >
                <input
                  type="radio"
                  v-model="formData.preferred_solution"
                  value="individuelle"
                  name="preferred_solution"
                />
                <span class="radio-label">
                  <strong>Installation individuelle</strong>
                  <span>Je préfère faire ma propre installation</span>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.preferred_solution === 'sans_avis' }"
              >
                <input
                  type="radio"
                  v-model="formData.preferred_solution"
                  value="sans_avis"
                  name="preferred_solution"
                />
                <span class="radio-label">
                  <strong>Sans avis</strong>
                  <span>Je n'ai pas de préférence particulière</span>
                </span>
              </label>
            </div>
          </div>

          <div class="form-group" v-if="formData.interested !== 'non'">
            <label class="form-label">
              Dans quel délai pensez-vous avoir besoin d'une borne ?
            </label>
            <div class="radio-group">
              <label
                class="radio-option"
                :class="{ selected: formData.timeline === '6mois' }"
              >
                <input
                  type="radio"
                  v-model="formData.timeline"
                  value="6mois"
                  name="timeline"
                />
                <span class="radio-label">
                  <strong>Dans les 6 prochains mois</strong>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.timeline === '1an' }"
              >
                <input
                  type="radio"
                  v-model="formData.timeline"
                  value="1an"
                  name="timeline"
                />
                <span class="radio-label">
                  <strong>Dans l'année</strong>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.timeline === '2ans' }"
              >
                <input
                  type="radio"
                  v-model="formData.timeline"
                  value="2ans"
                  name="timeline"
                />
                <span class="radio-label">
                  <strong>Dans les 2 ans</strong>
                </span>
              </label>
              <label
                class="radio-option"
                :class="{ selected: formData.timeline === 'plus' }"
              >
                <input
                  type="radio"
                  v-model="formData.timeline"
                  value="plus"
                  name="timeline"
                />
                <span class="radio-label">
                  <strong>Plus tard / Je ne sais pas</strong>
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 4: Contact (no free-text field: nothing beyond what the survey needs) -->
        <div v-show="currentStep === 4" class="form-step fade-in">
          <h2>Pour finir</h2>
          <p class="step-description">
            Indiquez si vous souhaitez être tenu informé de la suite du projet.
          </p>

          <div class="form-group">
            <label class="form-label" for="email">
              Votre email (optionnel)
            </label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              class="form-input"
              placeholder="votre@email.com"
            />
            <span class="form-hint">
              Uniquement si vous souhaitez être informé de l'avancement du projet
            </span>
          </div>

          <div class="form-group" v-if="formData.email">
            <label class="checkbox-option" :class="{ selected: formData.consent_contact }">
              <input
                type="checkbox"
                v-model="formData.consent_contact"
              />
              <span class="checkbox-label">
                <strong>J'accepte d'être contacté</strong>
                <span>
                  Je consens à ce que mon email soit conservé pour être informé
                  de l'avancement du projet IRVE. Je pourrai me désinscrire à tout moment.
                </span>
              </span>
            </label>
          </div>

          <div class="rgpd-notice">
            <h4>Protection de vos données (RGPD)</h4>
            <p>
              <strong>Responsable :</strong>
              <span v-if="privacy.controller">{{ privacy.controller }}.</span>
              <span v-else class="privacy-missing">[à compléter].</span>
              <strong>Finalité :</strong> évaluer les besoins en bornes de recharge et préparer la décision de l'AG.
            </p>
            <p>
              <strong>Base légale :</strong> intérêt légitime pour vos réponses ; consentement pour votre e-mail.
              Vos réponses ne sont pas anonymes (le n° de place se rattache à un lot) et ne sont diffusées que de façon agrégée.
            </p>
            <p>
              <strong>Conservation :</strong> {{ retentionText }} au plus après votre réponse.
              <strong>Stockage local :</strong> un marqueur anti-doublon est enregistré sur votre appareil.
            </p>
            <p>
              <strong>Vos droits :</strong> accès, rectification, suppression, opposition ; retrait du consentement et portabilité pour l'e-mail.
              Contact : <a :href="'mailto:' + contactEmail">{{ contactEmail }}</a>. Réclamation possible auprès de la CNIL.
            </p>
            <p>
              <strong>Sécurité :</strong> données chiffrées en transit (HTTPS)<span v-if="privacy.host">, hébergeur : {{ privacy.host }}</span>.
              <a href="#" @click.prevent="openPrivacyPolicy" class="privacy-link">Voir la politique complète</a>
            </p>
          </div>

          <div v-if="submitError" class="alert alert-error">
            {{ submitError }}
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="form-navigation">
          <button
            v-if="currentStep > 1"
            type="button"
            class="btn btn-secondary"
            @click="prevStep"
          >
            Précédent
          </button>
          <div v-else></div>

          <button
            v-if="currentStep < totalSteps"
            type="button"
            class="btn btn-primary"
            @click="nextStep"
          >
            Suivant
          </button>
          <button
            v-else
            type="button"
            class="btn btn-primary"
            :disabled="isSubmitting"
            @click="submitForm"
          >
            {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer mes réponses' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.survey-form {
  max-width: 640px;
  margin: 0 auto;
}

.progress-container {
  margin-bottom: 2rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.form-step {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.form-step h2 {
  margin-bottom: 0.5rem;
}

.step-description {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.form-navigation {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.privacy-missing {
  color: var(--color-warning);
  font-style: italic;
}

.form-input:disabled {
  opacity: 0.5;
}

.rgpd-notice {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1rem;
  margin-top: 1.5rem;
}

.rgpd-notice h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.rgpd-notice p {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

.rgpd-notice p:last-child {
  margin-bottom: 0;
}

.rgpd-notice .privacy-link {
  display: inline-block;
  margin-top: 0.25rem;
  color: var(--color-primary);
  text-decoration: underline;
}

.rgpd-notice .privacy-link:hover {
  color: var(--color-primary-dark);
}
/* ===== Theme: express form, states (brief §3.9) ===== */
.enquete {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-text);
  font-size: 18px;
}

.enquete .container {
  max-width: 640px;
}

.indicative {
  font-size: 0.85rem;
  color: var(--muted);
  border-left: 3px solid var(--signal);
  padding-left: 0.75rem;
  margin: 0 0 1.5rem;
}

.express-title,
.state-title {
  font-family: var(--font-title);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 1.05;
  color: var(--ink);
}

.express-title {
  font-size: 2.1rem;
  margin: 0 0 1.25rem;
}

.express .form-group {
  margin-bottom: 1.5rem;
  border: 0;
  padding: 0;
}

.express .form-label {
  display: block;
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
  padding: 0;
}

/* Spot number painted on an asphalt "floor" between two white lines */
.spot-floor {
  background: var(--asphalt);
  border-left: 6px solid var(--paint);
  border-right: 6px solid var(--paint);
  padding: 0.75rem 1rem 1.25rem;
  position: relative;
}

.spot-floor::after {
  content: "";
  position: absolute;
  left: 25%;
  right: 25%;
  bottom: 0.9rem;
  border-bottom: 3px dashed #ffffff55;
}

.spot-floor.disabled {
  opacity: 0.45;
}

.spot-input {
  width: 100%;
  background: transparent;
  border: 0;
  color: var(--paint);
  font-family: var(--font-stencil);
  font-weight: 800;
  font-size: 6rem;
  line-height: 1.1;
  text-align: center;
  caret-color: var(--signal);
}

.spot-input.long {
  font-size: 3.5rem;
}

.spot-input::placeholder {
  color: #ffffff40;
  font-size: 2.25rem;
}

.spot-input:focus {
  outline: 3px solid var(--signal);
  outline-offset: 4px;
}

.spot-line {
  margin: 0.6rem 0 0;
  font-size: 1rem;
}

.spot-line strong {
  color: var(--rose);
}

.express .form-hint {
  font-size: 0.9rem;
  color: var(--muted);
  margin: 0.5rem 0 0;
}

.plan-box {
  margin-top: 0.75rem;
  border: 1px solid var(--rule);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Full plan: horizontal scroll on phones; mini-map once a spot is chosen */
.plan-box :deep(.plan-picker) {
  min-width: 640px;
}

.plan-box.mini :deep(.plan-picker) {
  min-width: 0;
  max-height: 180px;
}

.link-button {
  background: none;
  border: 0;
  padding: 0;
  margin-top: 0.5rem;
  color: var(--ink);
  text-decoration: underline;
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
}

/* Neutral checkbox: must not look pre-selected */
.plain-check {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin-top: 0.9rem;
  font-size: 1rem;
  cursor: pointer;
}

.plain-check input {
  width: 22px;
  height: 22px;
  margin-top: 0.1rem;
  flex-shrink: 0;
  accent-color: var(--ink);
}

/* Segmented buttons bordered in black, ink fill when selected */
.segmented {
  display: flex;
  border: 2px solid var(--ink);
}

.segmented label,
.segmented button {
  flex: 1;
  position: relative;
  text-align: center;
  padding: 0.8rem 0.25rem;
  font-weight: 700;
  font-size: 1.05rem;
  cursor: pointer;
  background: #fff;
  color: var(--ink);
  border: 0;
  font-family: inherit;
}

.segmented label + label,
.segmented button + button {
  border-left: 2px solid var(--ink);
}

.segmented label.selected {
  background: var(--ink);
  color: var(--paint);
}

.segmented input {
  position: absolute;
  opacity: 0;
  inset: 0;
  cursor: pointer;
}

.segmented label:focus-within {
  outline: 3px solid var(--signal);
  outline-offset: -3px;
}

.segmented.compact label,
.segmented.compact button {
  font-size: 0.95rem;
  padding: 0.6rem 0.25rem;
}

.lot-prompt {
  margin-top: 0.75rem;
  border: 1px solid var(--rule);
  border-left: 4px solid var(--rose);
  padding: 0.75rem 1rem;
  background: #fff;
  font-size: 1rem;
}

.lot-prompt p {
  margin: 0 0 0.6rem;
}

.origin-line {
  font-size: 0.95rem;
  margin: 0.4rem 0 0;
  padding-left: 0.6rem;
  border-left: 3px solid var(--ink);
}

.origin-line.warn {
  border-left-color: var(--rose);
}

.verified-line {
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.code-input {
  font-family: var(--font-title);
  font-size: 1.4rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  max-width: 14rem;
}

.hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.data-line {
  font-size: 0.9rem;
  color: var(--muted);
}

.data-line a {
  color: var(--ink);
}

.full-link {
  margin: 0.5rem 0 1rem;
}

.btn-signal,
.btn-outline {
  font-family: var(--font-title);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 1.25rem;
  padding: 0.9rem 1.5rem;
  cursor: pointer;
  border: 2px solid var(--ink);
}

.btn-signal {
  background: var(--signal);
  color: var(--asphalt);
  border-color: var(--signal);
}

.btn-signal:disabled {
  background: var(--rule);
  border-color: var(--rule);
  color: var(--muted);
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  color: var(--ink);
}

.btn-block {
  width: 100%;
}

/* Send button stuck to the bottom of the screen on phones */
.sticky-submit {
  position: sticky;
  bottom: 0;
  background: var(--paper);
  border-top: 1px solid var(--rule);
  padding: 0.75rem 0 calc(0.75rem + env(safe-area-inset-bottom, 0));
  margin: 0 -1rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

.state-card {
  border-top: 3px solid var(--ink);
  padding-top: 1.25rem;
}

.state-title {
  font-size: 1.9rem;
  margin: 0 0 0.75rem;
}

.state-note {
  border-left: 4px solid var(--signal);
  padding-left: 0.75rem;
}

.state-links {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.state-links a {
  color: var(--ink);
}

.state-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.contact-block {
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  padding: 1.25rem 0;
  margin-top: 1.25rem;
}

.contact-block h3 {
  font-family: var(--font-title);
  text-transform: uppercase;
  font-size: 1.2rem;
  margin: 0 0 0.75rem;
}

.contact-submit {
  margin-top: 0.75rem;
  width: 100%;
}

.contact-saved {
  font-weight: 700;
  margin: 0;
}

@media (min-width: 640px) {
  .state-actions {
    flex-direction: row;
  }
  .sticky-submit {
    position: static;
    border-top: 0;
    margin: 0;
    padding: 0;
  }
}
</style>
