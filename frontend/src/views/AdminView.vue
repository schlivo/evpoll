<script setup>
import { ref, onMounted, computed } from 'vue'
import SvgIcon from '../components/SvgIcon.vue'

const isAuthenticated = ref(false)
const password = ref('')
const authToken = ref('') // Store auth token for API calls
const tokenExpiry = ref(null)
const passwordError = ref('')
const stats = ref(null)
const loading = ref(false)
const loginLoading = ref(false)
const error = ref('')

// Token storage keys
const TOKEN_STORAGE_KEY = 'irve_admin_token'
const TOKEN_EXPIRY_KEY = 'irve_admin_token_expiry'

const login = async () => {
  loginLoading.value = true
  passwordError.value = ''
  try {
    const response = await fetch('/api/stats/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value })
    })
    const data = await response.json()
    if (response.ok && data.success) {
      isAuthenticated.value = true
      authToken.value = data.token
      tokenExpiry.value = data.expiresAt
      // Store token in sessionStorage (cleared when browser closes)
      sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      sessionStorage.setItem(TOKEN_EXPIRY_KEY, data.expiresAt)
      password.value = '' // Clear password from memory
      loadStats()
    } else {
      passwordError.value = data.error || 'Mot de passe incorrect'
    }
  } catch (err) {
    passwordError.value = 'Impossible de se connecter au serveur'
  } finally {
    loginLoading.value = false
  }
}

const logout = async () => {
  // Notify server to revoke token
  if (authToken.value) {
    try {
      await fetch('/api/stats/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })
    } catch (e) {
      // Ignore logout errors
    }
  }
  // Clear local state
  isAuthenticated.value = false
  authToken.value = ''
  tokenExpiry.value = null
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  stats.value = null
}

// Check if token is still valid
const isTokenValid = () => {
  if (!tokenExpiry.value) return false
  return new Date(tokenExpiry.value) > new Date()
}

const loadStats = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/stats')
    if (response.ok) {
      stats.value = await response.json()
    } else {
      error.value = 'Erreur lors du chargement des statistiques'
    }
  } catch (err) {
    error.value = 'Impossible de se connecter au serveur'
  } finally {
    loading.value = false
  }
}

const exportCSV = async () => {
  try {
    const response = await fetch('/api/stats/export', {
      headers: { 'Authorization': `Bearer ${authToken.value}` }
    })
    if (response.ok) {
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enquete-irve-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (response.status === 404) {
      alert('Export indisponible. Vérifiez que le backend tourne sur le port 3000.')
    } else if (response.status === 401) {
      alert('Session expirée. Veuillez vous reconnecter.')
      logout()
    } else {
      alert('Erreur lors de l\'export')
    }
  } catch (err) {
    alert('Erreur lors de l\'export. Le backend est-il démarré (port 3000) ?')
  }
}

// Chart helpers
const maxValue = (obj) => Math.max(...Object.values(obj || {}), 1)
const percentage = (value, max) => (value / max) * 100
const sumValues = (obj) => Object.values(obj || {}).reduce((a, b) => a + (Number(b) || 0), 0)
const hasRespondents = (obj) => sumValues(obj) > 0

/** Turn stats object into [{ key, value }] with value > 0 for v-for without v-if. */
const toFilteredEntries = (obj) => {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj)
    .filter(([, v]) => (Number(v) || 0) > 0)
    .map(([key, value]) => ({ key, value: Number(value) || 0 }))
}

const filteredInterest = computed(() => toFilteredEntries(stats.value?.interest))
const filteredHasEv = computed(() => toFilteredEntries(stats.value?.has_ev))
const filteredByStatus = computed(() => toFilteredEntries(stats.value?.by_status))
const filteredByBuilding = computed(() => toFilteredEntries(stats.value?.by_building))
const filteredPreferredSolution = computed(() => toFilteredEntries(stats.value?.preferred_solution))
const filteredTimeline = computed(() => toFilteredEntries(stats.value?.timeline))

const interestLabels = {
  'oui': 'Intéressé',
  'peut-etre': 'Peut-être',
  'non': 'Pas intéressé'
}

const evLabels = {
  'oui': 'Possède un VE',
  'projet': 'Projet d\'achat',
  'non': 'Pas de VE'
}

const statusLabels = {
  'proprietaire': 'Propriétaire',
  'locataire': 'Locataire'
}

const solutionLabels = {
  'enedis': 'Colonne Enedis',
  'operateur': 'Opérateur externe',
  'individuelle': 'Installation individuelle',
  'sans_avis': 'Sans avis'
}

const timelineLabels = {
  '6mois': 'Dans les 6 mois',
  '1an': 'Dans l\'année',
  '2ans': 'Dans les 2 ans',
  'plus': 'Plus tard / Ne sait pas'
}

const interestColor = {
  'oui': 'var(--color-success)',
  'peut-etre': 'var(--color-warning)',
  'non': 'var(--color-danger)'
}

const evColor = {
  'oui': 'var(--color-primary)',
  'projet': 'var(--color-secondary)',
  'non': 'var(--color-text-muted)'
}

onMounted(() => {
  // Check for existing valid token in sessionStorage
  const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY)
  const storedExpiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)

  if (storedToken && storedExpiry) {
    // Check if token is still valid
    if (new Date(storedExpiry) > new Date()) {
      authToken.value = storedToken
      tokenExpiry.value = storedExpiry
      isAuthenticated.value = true
      loadStats()
    } else {
      // Token expired, clear storage
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
    }
  }
})
</script>

<template>
  <div class="admin-page">
    <!-- Login form -->
    <div v-if="!isAuthenticated" class="login-container">
      <div class="login-card">
        <div class="login-icon">
          <SvgIcon name="shield" :size="48" />
        </div>
        <h1>Administration</h1>
        <p>Accès réservé au conseil syndical</p>
        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              v-model="password"
              class="form-input"
              placeholder="Entrez le mot de passe"
              autocomplete="current-password"
            />
            <span v-if="passwordError" class="form-error">{{ passwordError }}</span>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" :disabled="loginLoading">
            {{ loginLoading ? 'Connexion...' : 'Accéder' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-else class="dashboard">
      <header class="dashboard-header">
        <div class="dashboard-title">
          <h1>Tableau de bord</h1>
          <p>Suivi de l'enquête IRVE</p>
        </div>
        <div class="dashboard-actions">
          <button @click="loadStats" class="btn btn-secondary" :disabled="loading">
            <SvgIcon name="chart-up" :size="18" />
            Actualiser
          </button>
          <button @click="exportCSV" class="btn btn-secondary">
            <SvgIcon name="clipboard" :size="18" />
            Export CSV
          </button>
          <button @click="logout" class="btn btn-secondary">
            Déconnexion
          </button>
        </div>
      </header>

      <div v-if="loading" class="loading">
        <p>Chargement des statistiques...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="loadStats" class="btn btn-primary">Réessayer</button>
      </div>

      <div v-else-if="stats" class="dashboard-content">
        <!-- Key metrics -->
        <section class="metrics-row">
          <div class="metric-card primary">
            <div class="metric-value">{{ stats.total_responses }}</div>
            <div class="metric-label">Réponses</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">{{ stats.participation_rate }}%</div>
            <div class="metric-label">Participation</div>
            <div class="metric-detail">sur {{ stats.total_lots }} lots</div>
          </div>
          <div class="metric-card success">
            <div class="metric-value">{{ (stats.interest?.oui || 0) + (stats.interest?.['peut-etre'] || 0) }}</div>
            <div class="metric-label">Intéressés</div>
            <div class="metric-detail">oui + peut-être</div>
          </div>
          <div class="metric-card info">
            <div class="metric-value">{{ (stats.has_ev?.oui || 0) + (stats.has_ev?.projet || 0) }}</div>
            <div class="metric-label">VE actuels/prévus</div>
          </div>
        </section>

        <!-- Charts grid -->
        <div class="charts-grid">
          <!-- Interest chart -->
          <div v-if="hasRespondents(stats.interest)" class="chart-card">
            <h3>Niveau d'intérêt</h3>
            <div class="bar-chart">
              <div
                v-for="item in filteredInterest"
                :key="item.key"
                class="bar-item"
              >
                <div class="bar-label">{{ interestLabels[item.key] || item.key }}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar-fill"
                    :style="{
                      width: percentage(item.value, maxValue(stats.interest)) + '%',
                      background: interestColor[item.key] || 'var(--color-primary)'
                    }"
                  ></div>
                </div>
                <div class="bar-value">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- EV ownership chart -->
          <div v-if="hasRespondents(stats.has_ev)" class="chart-card">
            <h3>Véhicules électriques</h3>
            <div class="bar-chart">
              <div
                v-for="item in filteredHasEv"
                :key="item.key"
                class="bar-item"
              >
                <div class="bar-label">{{ evLabels[item.key] || item.key }}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar-fill"
                    :style="{
                      width: percentage(item.value, maxValue(stats.has_ev)) + '%',
                      background: evColor[item.key] || 'var(--color-primary)'
                    }"
                  ></div>
                </div>
                <div class="bar-value">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- Status chart -->
          <div v-if="hasRespondents(stats.by_status)" class="chart-card">
            <h3>Statut</h3>
            <div class="donut-chart">
              <div class="donut-stats">
                <div
                  v-for="item in filteredByStatus"
                  :key="item.key"
                  class="donut-item"
                >
                  <span class="donut-color" :class="item.key"></span>
                  <span class="donut-label">{{ statusLabels[item.key] || item.key }}</span>
                  <span class="donut-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Building chart -->
          <div v-if="hasRespondents(stats.by_building)" class="chart-card">
            <h3>Par bâtiment</h3>
            <div class="bar-chart horizontal">
              <div
                v-for="item in filteredByBuilding"
                :key="item.key"
                class="bar-item"
              >
                <div class="bar-label">Bât. {{ item.key }}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar-fill"
                    :style="{
                      width: percentage(item.value, maxValue(stats.by_building)) + '%'
                    }"
                  ></div>
                </div>
                <div class="bar-value">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- Solution preference -->
          <div v-if="hasRespondents(stats.preferred_solution)" class="chart-card wide">
            <h3>Solution préférée</h3>
            <div class="bar-chart">
              <div
                v-for="item in filteredPreferredSolution"
                :key="item.key"
                class="bar-item"
              >
                <div class="bar-label">{{ solutionLabels[item.key] || item.key }}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar-fill"
                    :style="{
                      width: percentage(item.value, maxValue(stats.preferred_solution)) + '%',
                      background: item.key === 'enedis' ? 'var(--color-primary)' : 'var(--color-text-muted)'
                    }"
                  ></div>
                </div>
                <div class="bar-value">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div v-if="hasRespondents(stats.timeline)" class="chart-card wide">
            <h3>Horizon temporel</h3>
            <div class="bar-chart">
              <div
                v-for="item in filteredTimeline"
                :key="item.key"
                class="bar-item"
              >
                <div class="bar-label">{{ timelineLabels[item.key] || item.key }}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar-fill"
                    :style="{
                      width: percentage(item.value, maxValue(stats.timeline)) + '%'
                    }"
                  ></div>
                </div>
                <div class="bar-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional stats (only show section and items with > 0 respondents) -->
        <section
          v-if="(stats.with_parking || 0) > 0 || (stats.with_comments || 0) > 0 || (stats.with_consent || 0) > 0"
          class="additional-stats"
        >
          <div v-if="(stats.with_parking || 0) > 0" class="stat-item">
            <SvgIcon name="ev-car" :size="24" />
            <span>{{ stats.with_parking }} répondant(s) avec place de parking identifiée</span>
          </div>
          <div v-if="(stats.with_comments || 0) > 0" class="stat-item">
            <SvgIcon name="clipboard" :size="24" />
            <span>{{ stats.with_comments }} répondant(s) ont laissé un commentaire</span>
          </div>
          <div v-if="(stats.with_consent || 0) > 0" class="stat-item">
            <SvgIcon name="check" :size="24" />
            <span>{{ stats.with_consent }} répondant(s) souhaitent être contactés</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  height: 100vh;
  min-height: 0;
  background: var(--color-bg-alt);
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* Login */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 3rem 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.login-icon {
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}

.login-card h1 {
  margin-bottom: 0.5rem;
}

.login-card > p {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.login-form {
  text-align: left;
}

.login-form .btn {
  width: 100%;
  margin-top: 1rem;
}

/* Dashboard */
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
  padding-bottom: calc(3rem + env(safe-area-inset-bottom, 0));
  min-height: 100vh;
  box-sizing: border-box;
}

.dashboard-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
}

.dashboard-title h1 {
  margin-bottom: 0.25rem;
}

.dashboard-title p {
  color: var(--color-text-muted);
  margin: 0;
}

.dashboard-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dashboard-actions .btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Metrics */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .metrics-row {
    grid-template-columns: repeat(4, 1fr);
  }
}

.metric-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  text-align: center;
}

.metric-card.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.metric-card.success {
  border-color: var(--color-success);
}

.metric-card.success .metric-value {
  color: var(--color-success);
}

.metric-card.info {
  border-color: var(--color-secondary);
}

.metric-card.info .metric-value {
  color: var(--color-secondary);
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.metric-card.primary .metric-value {
  color: white;
}

.metric-label {
  font-weight: 500;
  color: var(--color-text);
}

.metric-card.primary .metric-label {
  color: rgba(255, 255, 255, 0.9);
}

.metric-detail {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

.metric-card.primary .metric-detail {
  color: rgba(255, 255, 255, 0.7);
}

/* Charts grid */
.charts-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.chart-card.wide {
  grid-column: 1 / -1;
}

.chart-card h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: var(--color-text);
}

/* Bar chart */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bar-item {
  display: grid;
  grid-template-columns: 120px 1fr 40px;
  align-items: center;
  gap: 0.75rem;
}

.bar-label {
  font-size: 0.875rem;
  color: var(--color-text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-wrapper {
  height: 24px;
  background: var(--color-bg-alt);
  border-radius: var(--radius);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius);
  transition: width 0.5s ease;
  min-width: 4px;
}

.bar-value {
  font-weight: 600;
  font-size: 0.875rem;
  text-align: right;
}

/* Donut chart (simplified as list) */
.donut-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.donut-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.donut-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--color-primary);
}

.donut-color.proprietaire {
  background: var(--color-primary);
}

.donut-color.locataire {
  background: var(--color-secondary);
}

.donut-label {
  flex: 1;
  font-size: 0.875rem;
}

.donut-value {
  font-weight: 600;
}

/* Additional stats */
.additional-stats {
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .dashboard {
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0));
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-light);
}

.stat-item svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

/* Loading & Error */
.loading,
.error-message {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.error-message .btn {
  margin-top: 1rem;
}

/* Form styles */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-error {
  display: block;
  color: var(--color-danger);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
