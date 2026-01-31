<script setup>
import { ref, onMounted, inject } from 'vue'
import StatCard from '../components/StatCard.vue'

const openEnquete = inject('openEnquete')
const navigateToSection = inject('navigateToSection')

const stats = ref({
  total_responses: 0,
  participation_rate: 0,
  interest: { oui: 0, 'peut-etre': 0 },
  has_ev: { oui: 0, projet: 0 }
})

const loading = ref(true)

onMounted(async () => {
  try {
    const response = await fetch('/api/stats')
    if (response.ok) {
      stats.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    loading.value = false
  }
})

const interestedCount = () => {
  return (stats.value.interest?.oui || 0) + (stats.value.interest?.['peut-etre'] || 0)
}

const evCount = () => {
  return (stats.value.has_ev?.oui || 0) + (stats.value.has_ev?.projet || 0)
}
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="container">
        <h1>Bornes de recharge électrique</h1>
        <p class="hero-subtitle">
          Participez à l'enquête sur l'installation d'infrastructures de recharge
          pour véhicules électriques dans notre copropriété.
        </p>
        <div class="hero-actions">
          <button @click="openEnquete" class="btn btn-primary btn-lg">
            Participer à l'enquête
          </button>
          <button @click="navigateToSection('comprendre')" class="btn btn-secondary btn-lg">
            En savoir plus
          </button>
        </div>
      </div>
    </section>

    <section class="stats-section">
      <div class="container">
        <h2 class="text-center mb-3">Participation en temps réel</h2>
        <div class="stats-grid" v-if="!loading">
          <StatCard
            :value="stats.total_responses"
            label="Réponses reçues"
            icon="&#128203;"
          />
          <StatCard
            :value="stats.participation_rate"
            suffix="%"
            label="Taux de participation"
            icon="&#128200;"
          />
          <StatCard
            :value="interestedCount()"
            label="Intéressés ou curieux"
            icon="&#9889;"
          />
          <StatCard
            :value="evCount()"
            label="Ont ou prévoient un VE"
            icon="&#128663;"
          />
        </div>
        <div class="stats-loading" v-else>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    </section>

    <section class="info-section">
      <div class="container">
        <h2>Pourquoi cette enquête ?</h2>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">&#127968;</div>
            <h3>Pour notre copropriété</h3>
            <p>
              Évaluer l'intérêt des copropriétaires et locataires pour
              l'installation de solutions de recharge collective.
            </p>
          </div>
          <div class="info-card">
            <div class="info-icon">&#128176;</div>
            <h3>Optimiser les coûts</h3>
            <p>
              Une installation collective permet de mutualiser les coûts
              et de bénéficier d'aides financières plus importantes.
            </p>
          </div>
          <div class="info-card">
            <div class="info-icon">&#127793;</div>
            <h3>Préparer l'avenir</h3>
            <p>
              Anticiper la transition vers la mobilité électrique et
              valoriser notre patrimoine immobilier.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="timeline-section">
      <div class="container">
        <h2>Les étapes du projet</h2>
        <div class="timeline">
          <div class="timeline-item active">
            <div class="timeline-marker">1</div>
            <div class="timeline-content">
              <h4>Enquête de besoins</h4>
              <p>Recensement des besoins et de l'intérêt des résidents</p>
              <span class="timeline-status">En cours</span>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">2</div>
            <div class="timeline-content">
              <h4>Analyse technique</h4>
              <p>Étude de faisabilité et choix de la solution adaptée</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">3</div>
            <div class="timeline-content">
              <h4>Vote en AG</h4>
              <p>Présentation du projet et vote des copropriétaires</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-marker">4</div>
            <div class="timeline-content">
              <h4>Installation</h4>
              <p>Mise en place de l'infrastructure et des bornes</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-card">
          <h2>Plus on est nombreux, plus le projet avance !</h2>
          <p>
            Les opérateurs lancent les projets en fonction du nombre d'intéressés.
            Chaque réponse compte pour rendre notre copropriété prioritaire.
          </p>
          <div class="cta-highlight">
            Même sans véhicule électrique aujourd'hui, votre intérêt futur compte !
          </div>
          <button @click="openEnquete" class="btn btn-primary btn-lg">
            Participer à l'enquête (2 min)
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg) 100%);
  padding: 4rem 0;
  text-align: center;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-light);
  max-width: 600px;
  margin: 0 auto 2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .hero {
    padding: 6rem 0;
  }

  .hero h1 {
    font-size: 3rem;
  }
}

.stats-section {
  padding: 3rem 0;
  background: var(--color-bg-alt);
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stats-loading {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.info-section {
  padding: 3rem 0;
}

.info-section h2 {
  text-align: center;
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.info-card {
  text-align: center;
  padding: 2rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.info-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.info-card h3 {
  margin-bottom: 0.75rem;
}

.info-card p {
  color: var(--color-text-light);
  margin: 0;
}

.timeline-section {
  padding: 3rem 0;
  background: var(--color-bg-alt);
}

.timeline-section h2 {
  text-align: center;
  margin-bottom: 2rem;
}

.timeline {
  max-width: 600px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  padding-bottom: 2rem;
  position: relative;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 19px;
  top: 40px;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-border);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.timeline-item.active .timeline-marker {
  background: var(--color-primary);
  color: white;
}

.timeline-content h4 {
  margin: 0 0 0.25rem;
}

.timeline-content p {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.timeline-status {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.cta-section {
  padding: 3rem 0;
}

.cta-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: var(--radius-xl);
  text-align: center;
}

.cta-card h2 {
  color: white;
  margin-bottom: 0.75rem;
}

.cta-card p {
  opacity: 0.9;
  max-width: 500px;
  margin: 0 auto 1rem;
}

.cta-highlight {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.cta-card .btn {
  background: white;
  color: var(--color-primary-dark);
}

.cta-card .btn:hover {
  background: var(--color-bg-alt);
}
</style>
