<script setup>
import { ref, inject } from 'vue'

const openEnquete = inject('openEnquete')
const selectedOption = ref(null)

const options = [
  {
    id: 'individuelle',
    name: 'Installation individuelle',
    subtitle: 'Droit à la prise',
    cost: '2000 - 4000 euros',
    costType: 'one-time',
    autonomy: 5,
    evolution: 1,
    complexity: 3,
    pros: [
      'Liberté totale sur le choix de l\'équipement',
      'Pas de dépendance vis-à-vis de la copropriété',
      'Installation rapide (3 mois max après demande)'
    ],
    cons: [
      'Coût plus élevé par installation',
      'Chaque résident doit faire sa propre démarche',
      'Risque de saturation électrique si beaucoup de demandes',
      'Pas d\'économies d\'échelle'
    ]
  },
  {
    id: 'operateur',
    name: 'Opérateur externe',
    subtitle: 'Type Watt, Zeplug...',
    cost: '0 euros + abonnement',
    costType: 'subscription',
    autonomy: 2,
    evolution: 4,
    complexity: 1,
    pros: [
      'Aucun investissement initial pour la copropriété',
      'Installation et maintenance prises en charge',
      'Solution clé en main'
    ],
    cons: [
      'Abonnement mensuel (souvent 20-40 euros/mois)',
      'Dépendance à l\'opérateur sur le long terme',
      'Conditions contractuelles parfois contraignantes',
      'Moins de flexibilité sur les tarifs'
    ]
  },
  {
    id: 'enedis',
    name: 'Colonne horizontale Enedis',
    subtitle: 'Solution recommandée',
    cost: 'Faible à nul pour la copropriété',
    costType: 'one-time',
    autonomy: 4,
    evolution: 5,
    complexity: 2,
    recommended: true,
    pros: [
      'Coût quasi-nul pour la copropriété grâce au refinancement Enedis',
      'Chaque résident a son propre compteur Linky dédié',
      'Facturation individuelle directe par Enedis (comme votre logement)',
      'Le prestataire se finance sur la vente et l\'installation des bornes',
      'Infrastructure mutualisée, évolutive à l\'infini',
      'Plus il y a d\'intéressés, plus le projet est attractif pour les opérateurs'
    ],
    cons: [
      'Nécessite un vote en AG',
      'Délai de mise en oeuvre (6-12 mois)',
      'Travaux dans les parties communes'
    ]
  },
  {
    id: 'collective',
    name: 'Infrastructure collective privée',
    subtitle: 'Compteur unique copropriété',
    cost: '800 - 2000 euros/place',
    costType: 'one-time',
    autonomy: 4,
    evolution: 4,
    complexity: 4,
    pros: [
      'Contrôle total de la copropriété',
      'Possibilité de négocier les tarifs',
      'Gestion unifiée'
    ],
    cons: [
      'Gestion de la facturation par la copropriété',
      'Complexité administrative',
      'Investissement initial important',
      'Nécessite un système de supervision'
    ]
  }
]

const getRatingBars = (value, max = 5) => {
  return Array.from({ length: max }, (_, i) => i < value)
}
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <h1>Les options possibles</h1>
        <p>
          Comparatif des différentes solutions d'installation de bornes de recharge
          en copropriété.
        </p>
      </header>

      <section class="comparison-table">
        <h2>Tableau comparatif</h2>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Solution</th>
                <th>Coût indicatif</th>
                <th>Autonomie</th>
                <th>Évolutivité</th>
                <th>Complexité</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="option in options"
                :key="option.id"
                :class="{ recommended: option.recommended }"
                @click="selectedOption = option.id"
              >
                <td>
                  <strong>{{ option.name }}</strong>
                  <span v-if="option.recommended" class="badge">Recommandé</span>
                </td>
                <td>{{ option.cost }}</td>
                <td>
                  <div class="rating">
                    <span
                      v-for="(filled, i) in getRatingBars(option.autonomy)"
                      :key="i"
                      class="rating-bar"
                      :class="{ filled }"
                    ></span>
                  </div>
                </td>
                <td>
                  <div class="rating">
                    <span
                      v-for="(filled, i) in getRatingBars(option.evolution)"
                      :key="i"
                      class="rating-bar"
                      :class="{ filled }"
                    ></span>
                  </div>
                </td>
                <td>
                  <div class="rating">
                    <span
                      v-for="(filled, i) in getRatingBars(option.complexity)"
                      :key="i"
                      class="rating-bar"
                      :class="{ filled, warning: true }"
                    ></span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="table-legend">
          <strong>Autonomie</strong> = indépendance vis-à-vis d'un tiers |
          <strong>Évolutivité</strong> = facilité d'ajouter des bornes |
          <strong>Complexité</strong> = difficulté de mise en oeuvre
        </p>
      </section>

      <section class="options-detail">
        <h2>Détail des solutions</h2>

        <div class="option-cards">
          <div
            v-for="option in options"
            :key="option.id"
            class="option-card"
            :class="{ recommended: option.recommended, expanded: selectedOption === option.id }"
          >
            <div class="option-header" @click="selectedOption = selectedOption === option.id ? null : option.id">
              <div>
                <h3>{{ option.name }}</h3>
                <span class="option-subtitle">{{ option.subtitle }}</span>
              </div>
              <div class="option-cost">
                {{ option.cost }}
                <span v-if="option.costType === 'subscription'" class="cost-note">+ mensuel</span>
              </div>
            </div>

            <div class="option-content" v-show="selectedOption === option.id">
              <div class="pros-cons">
                <div class="pros">
                  <h4>Avantages</h4>
                  <ul>
                    <li v-for="pro in option.pros" :key="pro">{{ pro }}</li>
                  </ul>
                </div>
                <div class="cons">
                  <h4>Inconvénients</h4>
                  <ul>
                    <li v-for="con in option.cons" :key="con">{{ con }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="recommendation">
        <h2>Notre recommandation : la colonne Enedis</h2>
        <div class="recommendation-card">
          <div class="recommendation-icon">&#9889;</div>
          <div class="recommendation-content">
            <h3>Comment ça marche ?</h3>
            <p>
              La colonne horizontale Enedis est une infrastructure électrique installée dans le parking
              qui permet à chaque résident de disposer de son propre point de livraison avec un
              <strong>compteur Linky dédié</strong>.
            </p>
          </div>
        </div>

        <div class="mechanism-grid">
          <div class="mechanism-card">
            <div class="mechanism-number">1</div>
            <h4>Financement de l'infrastructure</h4>
            <p>
              Enedis finance une grande partie de la colonne horizontale via le
              <strong>TURPE</strong> (Tarif d'Utilisation des Réseaux Publics d'Électricité).
              Ce coût est ensuite refinancé sur les factures d'électricité des utilisateurs,
              comme pour tout raccordement classique.
            </p>
          </div>

          <div class="mechanism-card">
            <div class="mechanism-number">2</div>
            <h4>Compteur Linky individuel</h4>
            <p>
              Chaque utilisateur souscrit son propre contrat d'électricité (EDF, Engie, TotalEnergies...)
              avec un compteur Linky dédié à sa borne. <strong>La copropriété n'a rien à gérer</strong> :
              pas de facturation, pas de relevés, pas de litiges.
            </p>
          </div>

          <div class="mechanism-card">
            <div class="mechanism-number">3</div>
            <h4>Le prestataire installateur</h4>
            <p>
              Un opérateur partenaire (électricien qualifié IRVE) installe les bornes individuelles.
              <strong>Il se rémunère sur la vente et l'installation des bornes</strong>, pas sur un abonnement.
              Vous êtes propriétaire de votre équipement.
            </p>
          </div>

          <div class="mechanism-card highlight">
            <div class="mechanism-number">&#10003;</div>
            <h4>Coût pour la copropriété</h4>
            <p>
              Grâce au refinancement Enedis et aux aides (ADVENIR, prime colonne), le coût résiduel
              pour la copropriété est <strong>souvent proche de zéro</strong>. Seuls les utilisateurs
              effectifs payent leur borne et leur électricité.
            </p>
          </div>
        </div>
      </section>

      <section class="participation-importance">
        <h2>Pourquoi votre participation compte</h2>
        <div class="importance-card">
          <div class="importance-icon">&#128200;</div>
          <div class="importance-content">
            <h3>Plus on est nombreux, plus le projet avance !</h3>
            <p>
              Les opérateurs et installateurs évaluent la <strong>viabilité économique</strong> d'un projet
              en fonction du nombre de résidents intéressés. Un parking avec 20 personnes motivées
              sera beaucoup plus attractif qu'un projet avec seulement 3 ou 4 demandes isolées.
            </p>
            <div class="importance-benefits">
              <div class="benefit">
                <strong>Meilleurs tarifs</strong>
                <span>Économies d'échelle sur l'installation</span>
              </div>
              <div class="benefit">
                <strong>Priorité des opérateurs</strong>
                <span>Les projets viables sont traités en premier</span>
              </div>
              <div class="benefit">
                <strong>Négociation facilitée</strong>
                <span>Plus de poids pour obtenir de bonnes conditions</span>
              </div>
            </div>
            <p class="importance-note">
              Même si vous n'avez pas encore de véhicule électrique, indiquer votre intérêt
              renforce le dossier et prépare l'avenir !
            </p>
          </div>
        </div>
      </section>

      <div class="cta-box">
        <h3>Faites entendre votre voix !</h3>
        <p>Chaque réponse compte pour convaincre les opérateurs de lancer le projet.</p>
        <button @click="openEnquete" class="btn btn-primary btn-lg">
          Participer à l'enquête
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparison-table {
  margin-bottom: 3rem;
}

.comparison-table h2 {
  margin-bottom: 1rem;
}

table {
  min-width: 600px;
}

tr.recommended {
  background: var(--color-primary-light);
}

tr {
  cursor: pointer;
}

tr:hover {
  background: var(--color-bg-alt);
}

tr.recommended:hover {
  background: var(--color-primary-light);
}

.badge {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  margin-left: 0.5rem;
  vertical-align: middle;
}

.rating {
  display: flex;
  gap: 3px;
}

.rating-bar {
  width: 16px;
  height: 8px;
  background: var(--color-border);
  border-radius: 2px;
}

.rating-bar.filled {
  background: var(--color-primary);
}

.rating-bar.filled.warning {
  background: var(--color-warning);
}

.table-legend {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.options-detail h2 {
  margin-bottom: 1.5rem;
}

.option-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.option-card.recommended {
  border-color: var(--color-primary);
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  cursor: pointer;
  background: var(--color-bg-card);
}

.option-card.recommended .option-header {
  background: var(--color-primary-light);
}

.option-header:hover {
  background: var(--color-bg-alt);
}

.option-card.recommended .option-header:hover {
  background: var(--color-primary-light);
}

.option-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.option-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.option-cost {
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.cost-note {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.option-content {
  padding: 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-alt);
}

.pros-cons {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .pros-cons {
    grid-template-columns: 1fr 1fr;
  }
}

.pros h4,
.cons h4 {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.pros h4 {
  color: var(--color-success);
}

.cons h4 {
  color: var(--color-danger);
}

.pros ul,
.cons ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.pros li,
.cons li {
  margin-bottom: 0.5rem;
}

.recommendation {
  margin: 3rem 0;
}

.recommendation h2 {
  margin-bottom: 1rem;
}

.recommendation-card {
  display: flex;
  gap: 1.5rem;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg) 100%);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.recommendation-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.recommendation-content h3 {
  color: var(--color-primary-dark);
  margin-bottom: 0.5rem;
}

.recommendation-content p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}

.recommendation-content ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text);
}

.recommendation-content li {
  margin-bottom: 0.25rem;
}

.mechanism-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (min-width: 768px) {
  .mechanism-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mechanism-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.mechanism-card.highlight {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.mechanism-number {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 1rem;
}

.mechanism-card.highlight .mechanism-number {
  background: var(--color-primary-dark);
  font-size: 1.25rem;
}

.mechanism-card h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.mechanism-card p {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.9rem;
  line-height: 1.6;
}

.participation-importance {
  margin: 3rem 0;
}

.participation-importance h2 {
  margin-bottom: 1rem;
}

.importance-card {
  display: flex;
  gap: 1.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, var(--color-bg) 100%);
  border: 2px solid var(--color-warning);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.importance-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.importance-content h3 {
  color: var(--color-text);
  margin-bottom: 0.75rem;
}

.importance-content > p {
  color: var(--color-text-light);
  margin-bottom: 1.25rem;
}

.importance-benefits {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

@media (min-width: 640px) {
  .importance-benefits {
    grid-template-columns: repeat(3, 1fr);
  }
}

.importance-benefits .benefit {
  background: white;
  padding: 1rem;
  border-radius: var(--radius);
  text-align: center;
}

.importance-benefits .benefit strong {
  display: block;
  color: var(--color-primary-dark);
  margin-bottom: 0.25rem;
}

.importance-benefits .benefit span {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.importance-note {
  background: white;
  padding: 1rem;
  border-radius: var(--radius);
  font-style: italic;
  color: var(--color-text);
  margin: 0 !important;
}

.cta-box {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
}

.cta-box h3 {
  margin-bottom: 0.5rem;
}

.cta-box p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}
</style>
