<script setup>
import SvgIcon from '../components/SvgIcon.vue'
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <h1>Comprendre les IRVE</h1>
        <p>
          Tout ce qu'il faut savoir sur les infrastructures de recharge
          pour véhicules électriques en copropriété.
        </p>
      </header>

      <section class="content-section">
        <h2>Qu'est-ce qu'une IRVE ?</h2>
        <p>
          Une <strong>Infrastructure de Recharge pour Véhicules Électriques</strong> (IRVE)
          désigne l'ensemble des équipements permettant de recharger les véhicules électriques
          et hybrides rechargeables.
        </p>
        <p>En copropriété, plusieurs types de solutions existent :</p>

        <div class="comparison-cards">
          <div class="comparison-card">
            <h3>Prise renforcée</h3>
            <div class="power">3,7 kW</div>
            <ul>
              <li>Recharge lente (8-12h pour une charge complète)</li>
              <li>Installation simple</li>
              <li>Coût : 500-800 euros (ordre de grandeur)</li>
              <li>Idéal pour un usage quotidien domicile</li>
            </ul>
          </div>

          <div class="comparison-card featured">
            <h3>Borne de recharge</h3>
            <div class="power">7,4 - 22 kW</div>
            <ul>
              <li>Recharge normale à accélérée (2-6h)</li>
              <li>Fonctionnalités avancées (programmation, suivi)</li>
              <li>Coût : 1000-2500 euros installée (ordre de grandeur)</li>
              <li>Solution recommandée en copropriété</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="content-section">
        <h2>Le contexte réglementaire</h2>

        <div class="regulation-card">
          <h3>Ce que prévoit la loi pour une copropriété existante</h3>
          <ul class="regulation-list">
            <li>
              <strong>Droit à la prise :</strong> tout occupant peut faire installer,
              à ses frais, une recharge sur sa place (voir ci-dessous).
            </li>
            <li>
              <strong>Vote en AG à la majorité simple (article 24)</strong> pour l'équipement
              des places et pour une convention sans frais pour la copropriété avec Enedis
              ou un opérateur.
            </li>
            <li>
              <strong>Devis d'opérateur obligatoire :</strong> au moins un devis d'opérateur
              doit être présenté 2 mois avant l'AG qui vote une convention avec Enedis
              (décret n° 2022-1249).
            </li>
          </ul>
          <p>
            L'obligation de pré-équipement des parkings concerne les bâtiments résidentiels
            neufs et ceux qui font l'objet d'une rénovation importante, pas les copropriétés
            existantes en dehors de ces cas.
          </p>
        </div>

        <div class="regulation-card">
          <h3>Le droit à la prise</h3>
          <p>
            Tout occupant (propriétaire ou locataire) peut faire installer
            une borne de recharge à ses frais. Il notifie son projet au syndic
            par lettre recommandée avec accusé de réception, avec un descriptif et un plan.
          </p>
          <p>
            <strong>Délai :</strong> le syndic ne décide pas. Il dispose de 3 mois pour saisir
            le tribunal judiciaire s'il a un motif sérieux et légitime : impossibilité technique,
            ou projet collectif voté ou en cours (sous 6 mois). S'il ne saisit pas le tribunal,
            les travaux peuvent avoir lieu. Ces 3 mois sont donc un délai minimal avant travaux,
            pas une garantie de rapidité.
          </p>
          <p>
            Un projet collectif en cours peut justifier d'attendre la solution commune.
          </p>
        </div>

        <div class="regulation-card">
          <h3>Vote en Assemblée Générale</h3>
          <p>
            Pour une installation collective, le vote se fait à la
            <strong>majorité simple</strong> (article 24).
          </p>
        </div>
      </section>

      <section class="content-section">
        <h2>Pourquoi anticiper ?</h2>

        <div class="benefits-grid">
          <div class="benefit-item">
            <div class="benefit-icon">
              <SvgIcon name="chart-up" :size="40" />
            </div>
            <h4>Valorisation du patrimoine</h4>
            <p>
              Un immeuble équipé de bornes est plus attractif
              pour les acheteurs et locataires potentiels.
            </p>
          </div>

          <div class="benefit-item">
            <div class="benefit-icon">
              <SvgIcon name="people" :size="40" />
            </div>
            <h4>Économies d'échelle</h4>
            <p>
              Une installation collective coûte moins cher par
              point de charge qu'une installation individuelle.
            </p>
          </div>

          <div class="benefit-item">
            <div class="benefit-icon">
              <SvgIcon name="hand-help" :size="40" />
            </div>
            <h4>Aides financières</h4>
            <p>
              Le programme ADVENIR finance aussi l'infrastructure collective,
              et Enedis peut la préfinancer : ces dispositifs sont pensés
              pour les installations collectives.
            </p>
          </div>

          <div class="benefit-item">
            <div class="benefit-icon">
              <SvgIcon name="bolt" :size="40" />
            </div>
            <h4>Infrastructure optimisée</h4>
            <p>
              Une solution collective permet de mieux gérer la
              puissance électrique disponible.
            </p>
          </div>
        </div>
      </section>

      <section class="content-section">
        <h2>Les chiffres clés</h2>

        <div class="stats-highlight">
          <div class="stat-item">
            <div class="stat-number">2035</div>
            <div class="stat-text">Objectif européen 2035 : quasi-totalité des ventes neuves en électrique (règle en cours de révision)</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">41,1 %</div>
            <div class="stat-text">Des voitures neuves vendues en France en septembre 2026 étaient électriques (31 % sur neuf mois)</div>
          </div>
        </div>
        <p class="stats-source">
          Source :
          <a href="https://www.connaissancedesenergies.org/afp/train-bus-covoiturage-les-solutions-face-a-la-hantise-de-la-pompe-a-essence-261006" target="_blank" rel="noopener">AFP / Connaissance des Énergies, 06/10/2026</a>
        </p>
      </section>

    </div>
  </div>
</template>

<style scoped>
.content-section {
  margin-bottom: 3rem;
}

.content-section h2 {
  color: var(--color-text);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-primary);
}

.content-section p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}

.comparison-cards {
  display: grid;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

@media (min-width: 640px) {
  .comparison-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

.comparison-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.comparison-card.featured {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.comparison-card h3 {
  margin-bottom: 0.5rem;
}

.comparison-card .power {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.comparison-card ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text-light);
}

.comparison-card li {
  margin-bottom: 0.5rem;
}

.regulation-card {
  background: var(--color-bg-alt);
  border-left: 4px solid var(--color-primary);
  padding: 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0 var(--radius) var(--radius) 0;
}

.regulation-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.regulation-card p {
  margin-bottom: 0.5rem;
}

.regulation-card p:last-child {
  margin-bottom: 0;
}

.benefits-grid {
  display: grid;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

@media (min-width: 640px) {
  .benefits-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.benefit-item {
  text-align: center;
  padding: 1.5rem;
}

.benefit-icon {
  color: var(--color-primary);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: center;
}

.benefit-item h4 {
  margin-bottom: 0.5rem;
}

.benefit-item p {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin: 0;
}

.stats-highlight {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (min-width: 640px) {
  .stats-highlight {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stats-source {
  margin-top: 0.75rem;
  font-size: 0.85rem;
}

.regulation-list {
  margin: 0 0 0.75rem 1.25rem;
  color: var(--color-text-light);
}

.regulation-list li {
  margin-bottom: 0.5rem;
}

.stat-item {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-text {
  font-size: 0.875rem;
  opacity: 0.9;
}

</style>
