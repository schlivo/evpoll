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
              <li>Coût : 500-800 euros</li>
              <li>Idéal pour un usage quotidien domicile</li>
            </ul>
          </div>

          <div class="comparison-card featured">
            <h3>Borne de recharge</h3>
            <div class="power">7,4 - 22 kW</div>
            <ul>
              <li>Recharge normale à accélérée (2-6h)</li>
              <li>Fonctionnalités avancées (programmation, suivi)</li>
              <li>Coût : 1000-2500 euros installée</li>
              <li>Solution recommandée en copropriété</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="content-section">
        <h2>Le contexte réglementaire</h2>

        <div class="regulation-card">
          <h3>Loi Climat et Résilience (2021)</h3>
          <p>
            Depuis 2021, les copropriétés doivent pré-équiper les parkings
            lors de travaux importants. D'ici 2025, tous les parkings de plus
            de 20 places devront disposer d'un pré-équipement.
          </p>
        </div>

        <div class="regulation-card">
          <h3>Le droit à la prise</h3>
          <p>
            Tout occupant (propriétaire ou locataire) peut demander
            l'installation d'une borne de recharge à ses frais.
            Le syndic ne peut s'y opposer que pour des motifs sérieux
            et légitimes (impossibilité technique, par exemple).
          </p>
          <p>
            <strong>Délai :</strong> Le syndic dispose de 3 mois pour
            notifier sa décision à partir de la demande.
          </p>
        </div>

        <div class="regulation-card">
          <h3>Vote en Assemblée Générale</h3>
          <p>
            Pour une installation collective, le vote se fait à la
            <strong>majorité simple</strong> (article 24) si le projet
            n'affecte pas les parties communes de manière significative.
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
              Les dispositifs d'aide (ADVENIR, Enedis) sont plus
              avantageux pour les installations collectives.
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
            <div class="stat-text">Fin de vente des véhicules thermiques neufs en Europe</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">90%</div>
            <div class="stat-text">Des recharges se font à domicile ou au travail</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">+47%</div>
            <div class="stat-text">De véhicules électriques immatriculés en 2023</div>
          </div>
        </div>
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
    grid-template-columns: repeat(3, 1fr);
  }
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
