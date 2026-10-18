<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import SvgIcon from '../components/SvgIcon.vue'
import { parkingSpotError } from '../utils/parking.js'

const closeEnquete = inject('closeEnquete')
const openPrivacy = inject('openPrivacy', () => {})
// 'express' (one screen) or 'full' (4 steps), chosen by App.vue
const enqueteMode = inject('enqueteMode', ref('express'))

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
const existingSubmissionBuilding = ref('')
// Set after an express answer so the full form completes it instead of adding a new one
const editContext = ref(null)
const lastSubmitWasExpress = ref(false)

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
  comments: '',
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
const contactEmail = ref('conseil-syndical@exemple.fr')
const syndicEmail = ref('syndic@exemple.fr')

// Storage key for submission marker
const SUBMISSION_STORAGE_KEY = 'irve_survey_submission'

// Check for existing submission in localStorage
const checkExistingSubmission = () => {
  try {
    const stored = localStorage.getItem(SUBMISSION_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      // Check if submission was within 30 days
      const submissionDate = new Date(data.timestamp)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      if (submissionDate > thirtyDaysAgo) {
        hasExistingSubmission.value = true
        existingSubmissionBuilding.value = data.building || ''
        return true
      }
    }
  } catch (e) {
    // Invalid data, ignore
  }
  return false
}

// Save submission marker to localStorage
const saveSubmissionMarker = (building) => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      building,
      submitted: true
    }
    localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // localStorage not available, continue without marker
  }
}

// Watch consent checkbox to record timestamp
watch(() => formData.value.consent_contact, (newValue) => {
  if (newValue && !formData.value.consent_timestamp) {
    formData.value.consent_timestamp = new Date().toISOString()
  }
})

// Allow user to proceed despite existing submission
const proceedAnyway = () => {
  hasExistingSubmission.value = false
}

// Fetch configuration from API
onMounted(async () => {
  // Check for existing submission first
  checkExistingSubmission()

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
      privacy.value = config.privacy || {}
      contactEmail.value = config.contact_email || contactEmail.value
      syndicEmail.value = config.syndic_email || syndicEmail.value
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

  const completing = !express && editContext.value
  const url = completing ? `/api/survey/${editContext.value.id}` : '/api/survey'
  const payload = completing
    ? { ...formData.value, edit_token: editContext.value.token }
    : express
      ? { ...formData.value, email: '', consent_contact: false, consent_timestamp: null, express }
      : { ...formData.value, express }

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
      // Save submission marker to localStorage
      saveSubmissionMarker(formData.value.building)
      editContext.value = express && data.edit_token ? { id: data.id, token: data.edit_token } : null
      lastSubmitWasExpress.value = express
      isSubmitted.value = true
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
  if (!validateExpress()) return
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
  <div class="page">
    <div class="container">
      <header class="page-header">
        <h1>Participer à l'enquête</h1>
        <p>
          Répondez à quelques questions pour nous aider à dimensionner
          le projet de bornes de recharge.
        </p>
      </header>

      <!-- Already submitted warning -->
      <div v-if="hasExistingSubmission && !isSubmitted" class="warning-card fade-in">
        <div class="warning-icon">
          <SvgIcon name="shield" :size="40" />
        </div>
        <h2>Vous avez déjà participé</h2>
        <p>
          Une réponse a été enregistrée depuis cet appareil
          <span v-if="existingSubmissionBuilding">(Bâtiment {{ existingSubmissionBuilding }})</span>.
        </p>
        <p class="text-muted">
          Si vous souhaitez modifier votre réponse, veuillez contacter le conseil syndical.
        </p>
        <div class="warning-actions">
          <button @click="closeEnquete" class="btn btn-secondary">
            Retour à l'accueil
          </button>
          <button @click="proceedAnyway" class="btn btn-primary">
            Soumettre une nouvelle réponse
          </button>
        </div>
      </div>

      <!-- Success state -->
      <div v-else-if="isSubmitted" class="success-card fade-in">
        <div class="success-icon">
          <SvgIcon name="check" :size="40" />
        </div>
        <h2>Merci pour votre participation !</h2>
        <p>
          Votre réponse a été enregistrée. Elle nous aidera à définir
          la meilleure solution pour notre copropriété.
        </p>
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
            <label class="checkbox-option compact" :class="{ selected: contactForm.consent }">
              <input type="checkbox" v-model="contactForm.consent" />
              <span class="checkbox-label">
                <strong>J'accepte d'être contacté</strong>
                <span>
                  Mon e-mail sert uniquement à m'informer de l'avancement du projet IRVE.
                  Je peux retirer mon consentement à tout moment.
                </span>
              </span>
            </label>
            <span v-if="contactError" class="form-error">{{ contactError }}</span>
            <button
              type="button"
              class="btn btn-secondary contact-submit"
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
        <div class="success-actions">
          <button
            v-if="lastSubmitWasExpress && editContext"
            @click="completeAnswers"
            class="btn btn-secondary"
          >
            Compléter mes réponses (facultatif)
          </button>
          <button @click="closeEnquete" class="btn btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>

      <!-- Express answer: one screen -->
      <div v-else-if="enqueteMode === 'express'" class="survey-form">
        <div class="form-step express-card fade-in">
          <h2>Répondre en 30 secondes</h2>
          <p class="step-description">
            Trois questions suffisent. Votre numéro de place permet de préparer
            le raccordement de votre emplacement, même sans véhicule électrique aujourd'hui.
          </p>

          <div class="form-group">
            <label class="form-label" for="express_parking_spot">
              Votre numéro de place de parking <span class="required">*</span>
            </label>
            <input
              type="text"
              id="express_parking_spot"
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

          <div class="form-group">
            <label class="form-label">
              Véhicule électrique ou hybride rechargeable ? <span class="required">*</span>
            </label>
            <div class="pill-group">
              <label
                v-for="opt in [{ v: 'oui', l: 'Oui' }, { v: 'projet', l: 'En projet' }, { v: 'non', l: 'Non' }]"
                :key="opt.v"
                class="pill-option"
                :class="{ selected: formData.has_ev === opt.v }"
              >
                <input type="radio" v-model="formData.has_ev" :value="opt.v" name="express_has_ev" />
                {{ opt.l }}
              </label>
            </div>
            <span v-if="errors.has_ev" class="form-error">{{ errors.has_ev }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">
              Intéressé par une borne sur votre place ? <span class="required">*</span>
            </label>
            <div class="pill-group">
              <label
                v-for="opt in [{ v: 'oui', l: 'Oui' }, { v: 'peut-etre', l: 'Peut-être' }, { v: 'non', l: 'Non' }]"
                :key="opt.v"
                class="pill-option"
                :class="{ selected: formData.interested === opt.v }"
              >
                <input type="radio" v-model="formData.interested" :value="opt.v" name="express_interested" />
                {{ opt.l }}
              </label>
            </div>
            <span v-if="errors.interested" class="form-error">{{ errors.interested }}</span>
          </div>

          <div class="rgpd-notice">
            <p>
              <strong>Données :</strong> votre réponse n'est pas anonyme (le n° de place se rattache à un lot).
              Elle sert uniquement au projet IRVE, n'est diffusée que de façon agrégée et est conservée
              {{ retentionText }} au plus. Accès, rectification, suppression, opposition :
              <a :href="'mailto:' + contactEmail">{{ contactEmail }}</a>.
              <a href="#" @click.prevent="openPrivacyPolicy" class="privacy-link">Politique complète</a>
            </p>
          </div>

          <div v-if="submitError" class="alert alert-error">
            {{ submitError }}
          </div>
        </div>

        <div class="form-navigation">
          <button type="button" class="btn btn-link" @click="switchToFull">
            Questionnaire complet (4 étapes)
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="isSubmitting"
            @click="submitExpress"
          >
            {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer' }}
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

        <!-- Step 4: Comments & Contact -->
        <div v-show="currentStep === 4" class="form-step fade-in">
          <h2>Pour finir</h2>
          <p class="step-description">
            Partagez vos remarques et indiquez si vous souhaitez être tenu informé.
          </p>

          <div class="form-group">
            <label class="form-label" for="comments">
              Avez-vous des remarques ou questions ?
            </label>
            <textarea
              id="comments"
              v-model="formData.comments"
              class="form-textarea"
              placeholder="Vos commentaires, suggestions ou questions..."
              rows="4"
            ></textarea>
            <span class="form-hint">Optionnel - 1000 caractères maximum</span>
          </div>

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

.lot-prompt {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-primary-light);
  border-radius: var(--radius);
  font-size: 0.9rem;
}

.lot-prompt p {
  margin-bottom: 0.5rem;
}

.lot-prompt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.btn-sm {
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
}

.privacy-missing {
  color: var(--color-warning);
  font-style: italic;
}

.express-card h2 {
  color: var(--color-primary);
}

.pill-group {
  display: flex;
  gap: 0.5rem;
}

.pill-option {
  flex: 1;
  position: relative;
  text-align: center;
  padding: 0.75rem 0.5rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  font-weight: 600;
  transition: border-color 0.15s, background 0.15s;
}

.pill-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.pill-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.checkbox-option.compact {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
}

.form-input:disabled {
  opacity: 0.5;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  text-decoration: underline;
  padding-left: 0;
  padding-right: 0;
}

.contact-block {
  text-align: left;
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
  margin-bottom: 1.5rem;
}

.contact-block h3 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.contact-block .form-group {
  margin-bottom: 0;
}

.contact-submit {
  margin-top: 0.75rem;
  width: 100%;
}

.contact-saved {
  text-align: center;
  color: var(--color-success);
  font-weight: 600;
  margin: 0;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

@media (min-width: 480px) {
  .success-actions {
    flex-direction: row;
    justify-content: center;
  }
}

.success-card,
.warning-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.warning-card {
  border-color: var(--color-warning);
}

.warning-icon {
  width: 80px;
  height: 80px;
  background: var(--color-warning);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.warning-card h2 {
  color: var(--color-warning);
  margin-bottom: 0.75rem;
}

.warning-card p {
  color: var(--color-text-light);
  margin-bottom: 0.75rem;
}

.warning-card .text-muted {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.warning-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (min-width: 480px) {
  .warning-actions {
    flex-direction: row;
    justify-content: center;
  }
}

.success-icon {
  width: 80px;
  height: 80px;
  background: var(--color-success);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.success-card h2 {
  color: var(--color-success);
  margin-bottom: 0.75rem;
}

.success-card p {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
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
</style>
