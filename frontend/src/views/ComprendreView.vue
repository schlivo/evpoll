<template>
  <div class="info-view">
      <header class="info-intro">
        <p>
          Tout ce qu'il faut savoir sur les infrastructures de recharge
          pour véhicules électriques en copropriété.
        </p>
      </header>

      <section class="content-section">
        <h4>Qu'est-ce qu'une IRVE ?</h4>
        <p>
          Une <strong>Infrastructure de Recharge pour Véhicules Électriques</strong> (IRVE)
          désigne l'ensemble des équipements permettant de recharger les véhicules électriques
          et hybrides rechargeables.
        </p>
        <p>En copropriété, plusieurs types de solutions existent :</p>

        <div class="comparison-cards">
          <div class="comparison-card">
            <h5>Prise renforcée</h5>
            <div class="power">3,7 kW</div>
            <ul>
              <li>Recharge lente (8-12h pour une charge complète)</li>
              <li>Installation simple</li>
              <li>Coût : 500-800 euros (ordre de grandeur)</li>
              <li>Idéal pour un usage quotidien domicile</li>
            </ul>
          </div>

          <div class="comparison-card featured">
            <h5>Borne de recharge</h5>
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
        <h4>Le contexte réglementaire</h4>

        <div class="regulation-card">
          <h5>Ce que prévoit la loi pour une copropriété existante</h5>
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
          <h5>Le droit à la prise</h5>
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
          <h5>Vote en Assemblée Générale</h5>
          <p>
            Pour une installation collective, le vote se fait à la
            <strong>majorité simple</strong> (article 24).
          </p>
        </div>
      </section>

      <section class="content-section">
        <h4>Pourquoi anticiper ?</h4>

        <div class="benefits-grid">
          <div class="benefit-item">
            <h5>Valorisation du patrimoine</h5>
            <p>
              Un immeuble équipé de bornes est plus attractif
              pour les acheteurs et locataires potentiels.
            </p>
          </div>

          <div class="benefit-item">
            <h5>Économies d'échelle</h5>
            <p>
              Une installation collective coûte moins cher par
              point de charge qu'une installation individuelle.
            </p>
          </div>

          <div class="benefit-item">
            <h5>Aides financières</h5>
            <p>
              Le programme ADVENIR finance aussi l'infrastructure collective,
              et Enedis peut la préfinancer : ces dispositifs sont pensés
              pour les installations collectives.
            </p>
          </div>

          <div class="benefit-item">
            <h5>Infrastructure optimisée</h5>
            <p>
              Une solution collective permet de mieux gérer la
              puissance électrique disponible.
            </p>
          </div>
        </div>
      </section>

      <section class="content-section">
        <h4>Les chiffres clés</h4>

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
</template>

<style scoped>
.info-intro p {
  margin: 0 0 1.5rem;
  color: var(--muted);
}

.content-section {
  margin-bottom: 2.25rem;
}

.content-section h4 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--rule);
}

.content-section h5 {
  font-size: 1.1875rem;
  margin-bottom: 0.5rem;
}

.content-section p {
  margin: 0 0 1rem;
}

.comparison-cards,
.benefits-grid,
.stats-highlight {
  display: grid;
  gap: 0 2rem;
  margin-top: 1rem;
}

@media (min-width: 640px) {
  .comparison-cards,
  .benefits-grid,
  .stats-highlight {
    grid-template-columns: repeat(2, 1fr);
  }
}

.comparison-card,
.benefit-item,
.stat-item {
  border-top: 1px solid var(--ink);
  padding: 0.75rem 0 1.25rem;
}

.comparison-card .power {
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.comparison-card ul,
.regulation-list {
  margin: 0;
  padding-left: 1.25rem;
}

.comparison-card li,
.regulation-list li {
  margin-bottom: 0.4rem;
}

.regulation-card {
  border-left: 3px solid var(--ink);
  padding: 0.25rem 0 0.25rem 1rem;
  margin-bottom: 1.5rem;
}

.regulation-card p:last-child,
.benefit-item p {
  margin-bottom: 0;
}

.regulation-list {
  margin-bottom: 0.75rem;
}

.stat-number {
  font-family: var(--font-title);
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.4rem;
}

.stats-source {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  color: var(--muted);
}

.stats-source a {
  color: var(--muted);
}
</style>
