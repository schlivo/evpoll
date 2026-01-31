<script setup>
import { ref, computed, inject } from 'vue'
import SvgIcon from '../components/SvgIcon.vue'

const closeEnquete = inject('closeEnquete')

const currentStep = ref(1)
const totalSteps = 4
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const submitError = ref('')

const formData = ref({
  building: '',
  apartment: '',
  parking_spot: '',
  status: '',
  has_ev: '',
  interested: '',
  preferred_solution: '',
  timeline: '',
  comments: '',
  email: '',
  consent_contact: false
})

const errors = ref({})

const progress = computed(() => (currentStep.value / totalSteps) * 100)

const validateStep = (step) => {
  errors.value = {}

  if (step === 1) {
    if (!formData.value.building) {
      errors.value.building = 'Veuillez sélectionner votre bâtiment'
    }
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

const submitForm = async () => {
  if (!validateStep(currentStep.value)) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = await fetch('/api/survey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData.value)
    })

    const data = await response.json()

    if (response.ok) {
      isSubmitted.value = true
    } else {
      submitError.value = data.errors?.join(', ') || data.message || 'Une erreur est survenue'
    }
  } catch (error) {
    submitError.value = 'Impossible de soumettre le formulaire. Veuillez réessayer.'
  } finally {
    isSubmitting.value = false
  }
}

const buildings = ['A', 'B', 'C', 'D']
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

      <!-- Success state -->
      <div v-if="isSubmitted" class="success-card fade-in">
        <div class="success-icon">
          <SvgIcon name="check" :size="40" />
        </div>
        <h2>Merci pour votre participation !</h2>
        <p>
          Votre réponse a été enregistrée. Elle nous aidera à définir
          la meilleure solution pour notre copropriété.
        </p>
        <button @click="closeEnquete" class="btn btn-primary">
          Retour à l'accueil
        </button>
      </div>

      <!-- Form -->
      <div v-else class="survey-form">
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
            Ces informations permettent d'avoir une vue globale par bâtiment,
            sans identifier les personnes.
          </p>

          <div class="form-group">
            <label class="form-label">
              Dans quel bâtiment habitez-vous ? <span class="required">*</span>
            </label>
            <div class="radio-group">
              <label
                v-for="b in buildings"
                :key="b"
                class="radio-option"
                :class="{ selected: formData.building === b }"
              >
                <input
                  type="radio"
                  v-model="formData.building"
                  :value="b"
                  name="building"
                />
                <span class="radio-label">
                  <strong>Bâtiment {{ b }}</strong>
                </span>
              </label>
            </div>
            <span v-if="errors.building" class="form-error">{{ errors.building }}</span>
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
            <label class="form-label" for="parking_spot">
              Numéro de place de parking (optionnel)
            </label>
            <input
              type="text"
              id="parking_spot"
              v-model="formData.parking_spot"
              class="form-input"
              placeholder="Ex: 45, P12..."
            />
            <span class="form-hint">Laissez vide si vous n'avez pas de place de parking</span>
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
                  <span>Compteur individuel, facturation directe</span>
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
                  <strong>Opérateur externe (Watt, Zeplug...)</strong>
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
            <h4>Informations RGPD</h4>
            <p>
              Les données collectées sont traitées par la copropriété dans le cadre de l'enquête
              sur le projet IRVE. Elles sont conservées jusqu'à la fin du projet + 1 an.
              Vous disposez d'un droit d'accès, de rectification et de suppression de vos données
              en contactant le conseil syndical.
            </p>
            <p>
              <strong>Aucune donnée n'est transmise à des tiers.</strong>
              L'hébergement est réalisé en France sur un serveur privé.
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

.success-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
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
</style>
