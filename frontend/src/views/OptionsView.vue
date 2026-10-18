<script setup>
import { ref } from 'vue'

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
      'Pas de vote en AG : le syndic ne peut s\'y opposer qu\'en saisissant le tribunal sous 3 mois (délai minimal avant travaux)'
    ],
    cons: [
      'Coût plus élevé par installation',
      'Chaque résident doit faire sa propre démarche',
      'Un projet collectif voté ou en cours peut justifier de reporter l\'installation',
      'Risque de saturation électrique si beaucoup de demandes',
      'Pas d\'économies d\'échelle'
    ]
  },
  {
    id: 'operateur',
    name: 'Opérateur externe',
    subtitle: 'Opérateur de recharge (ex. Zeplug, izi by EDF...)',
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
      'Abonnement mensuel (ordre de grandeur : 20-40 euros/mois)',
      'Dépendance à l\'opérateur sur le long terme',
      'Conditions contractuelles parfois contraignantes',
      'Moins de flexibilité sur les tarifs'
    ]
  },
  {
    id: 'enedis',
    name: 'Colonne horizontale Enedis',
    subtitle: 'Solution recommandée',
    cost: 'Infrastructure sans coût pour la copropriété (hors frais annexes)',
    costType: 'one-time',
    autonomy: 4,
    evolution: 5,
    complexity: 2,
    recommended: true,
    pros: [
      'Infrastructure préfinancée par Enedis : pas d\'investissement pour la copropriété',
      'Chaque résident a son propre compteur Linky dédié',
      'Contrat d\'électricité avec le fournisseur de votre choix, via un compteur Linky dédié',
      'Le prestataire se finance sur la vente et l\'installation des bornes',
      'Infrastructure mutualisée, dimensionnée pour équiper toutes les places',
      'Plus il y a d\'intéressés, plus le projet est attractif pour les opérateurs'
    ],
    cons: [
      'Nécessite un vote en AG (majorité simple) pour signer la convention',
      'Délai : en général 12 à 18 mois entre la demande à Enedis et la mise en service, dont environ 6 mois de travaux après la signature de la convention',
      'Frais annexes éventuels (honoraires de suivi, adaptation du local électrique), chiffrés avant l\'AG',
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
  <div class="info-view">
      <header class="info-intro">
        <p>
          Comparatif des différentes solutions d'installation de bornes de recharge
          en copropriété.
        </p>
      </header>

      <section class="comparison-table">
        <h4>Tableau comparatif</h4>
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
                  <div class="rating" role="img" :aria-label="`${option.autonomy} sur 5`">
                    <span
                      v-for="(filled, i) in getRatingBars(option.autonomy)"
                      :key="i"
                      class="rating-bar"
                      :class="{ filled }"
                    ></span>
                  </div>
                </td>
                <td>
                  <div class="rating" role="img" :aria-label="`${option.evolution} sur 5`">
                    <span
                      v-for="(filled, i) in getRatingBars(option.evolution)"
                      :key="i"
                      class="rating-bar"
                      :class="{ filled }"
                    ></span>
                  </div>
                </td>
                <td>
                  <div class="rating" role="img" :aria-label="`${option.complexity} sur 5`">
                    <span
                      v-for="(filled, i) in getRatingBars(option.complexity)"
                      :key="i"
                      class="rating-bar"
                      :class="{ filled }"
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
          <strong>Complexité</strong> = difficulté de mise en oeuvre<br>
          Les coûts indiqués sont des ordres de grandeur, hors aides.
        </p>
      </section>

      <section class="options-detail">
        <h4>Détail des solutions</h4>

        <div class="option-cards">
          <div
            v-for="option in options"
            :key="option.id"
            class="option-card"
            :class="{ recommended: option.recommended, expanded: selectedOption === option.id }"
          >
            <button
              type="button"
              class="option-header"
              :aria-expanded="selectedOption === option.id ? 'true' : 'false'"
              :aria-controls="`option-${option.id}`"
              @click="selectedOption = selectedOption === option.id ? null : option.id"
            >
              <span class="option-head-text">
                <span class="option-name">{{ option.name }}</span>
                <span class="option-subtitle">{{ option.subtitle }}</span>
              </span>
              <span class="option-cost">
                {{ option.cost }}
                <span v-if="option.costType === 'subscription'" class="cost-note">+ mensuel</span>
              </span>
              <span class="option-sign" aria-hidden="true">{{ selectedOption === option.id ? '–' : '+' }}</span>
            </button>

            <div class="option-content" :id="`option-${option.id}`" v-show="selectedOption === option.id">
              <div class="pros-cons">
                <div class="pros">
                  <h5>Avantages</h5>
                  <ul>
                    <li v-for="pro in option.pros" :key="pro">{{ pro }}</li>
                  </ul>
                </div>
                <div class="cons">
                  <h5>Inconvénients</h5>
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
        <h4>Notre recommandation : la colonne Enedis</h4>
        <div class="recommendation-card">
          <div class="recommendation-content">
            <h5>Comment ça marche ?</h5>
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
            <h5>Financement de l'infrastructure</h5>
            <p>
              Enedis finance une grande partie de la colonne horizontale via le
              <strong>TURPE</strong> (Tarif d'Utilisation des Réseaux Publics d'Électricité).
              Ce coût est ensuite refinancé sur les factures d'électricité des utilisateurs,
              comme pour tout raccordement classique.
            </p>
          </div>

          <div class="mechanism-card">
            <div class="mechanism-number">2</div>
            <h5>Compteur Linky individuel</h5>
            <p>
              Chaque utilisateur souscrit son propre contrat d'électricité (EDF, Engie, TotalEnergies...)
              avec un compteur Linky dédié à sa borne. <strong>La copropriété n'a rien à gérer</strong> :
              pas de facturation, pas de relevés, pas de litiges.
            </p>
          </div>

          <div class="mechanism-card">
            <div class="mechanism-number">3</div>
            <h5>Le prestataire installateur</h5>
            <p>
              Un opérateur partenaire (électricien qualifié IRVE) installe les bornes individuelles.
              <strong>Il se rémunère sur la vente et l'installation des bornes</strong>, pas sur un abonnement.
              Vous êtes propriétaire de votre équipement.
            </p>
          </div>

          <div class="mechanism-card highlight">
            <h5>Coût pour la copropriété</h5>
            <p>
              L'infrastructure étant préfinancée par Enedis, elle ne coûte rien à la copropriété.
              D'éventuels frais annexes (honoraires de suivi, adaptation du local électrique) seront
              <strong>chiffrés avant l'AG</strong>. Seuls les utilisateurs effectifs payent leur
              raccordement, leur borne et leur électricité.
            </p>
          </div>
        </div>
      </section>

      <section class="participation-importance">
        <h4>Pourquoi votre participation compte</h4>
        <div class="importance-card">
          <div class="importance-content">
            <h5>Des chiffres réels pour préparer l'AG</h5>
            <p>
              Vos réponses servent à dimensionner le projet, à le présenter en AG avec des chiffres
              réels et à obtenir de meilleures offres des opérateurs. Les opérateurs et installateurs
              évaluent en effet la <strong>viabilité économique</strong> d'un projet en fonction du
              nombre de résidents intéressés.
            </p>
            <div class="importance-benefits">
              <div class="benefit">
                <strong>Meilleurs tarifs</strong>
                <span>Économies d'échelle sur l'installation</span>
              </div>
              <div class="benefit">
                <strong>Projet bien dimensionné</strong>
                <span>Le nombre de places à équiper est connu dès le départ</span>
              </div>
              <div class="benefit">
                <strong>Négociation facilitée</strong>
                <span>Plus de poids pour obtenir de bonnes conditions</span>
              </div>
            </div>
            <p class="importance-note">
              Même si vous n'avez pas encore de véhicule électrique, indiquer votre intérêt
              renforce le dossier présenté en AG.
            </p>
          </div>
        </div>
      </section>

  </div>
</template>

<style scoped>
.info-intro p {
  margin: 0 0 1.5rem;
  color: var(--muted);
}

.comparison-table,
.options-detail,
.recommendation,
.participation-importance {
  margin-bottom: 2.25rem;
}

h4 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--rule);
}

h5 {
  font-size: 1.1875rem;
  margin-bottom: 0.5rem;
}

table {
  min-width: 600px;
  font-size: 1rem;
}

tr {
  cursor: pointer;
}

tbody tr:hover {
  background: var(--place);
}

.badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0 0.4rem;
  border: 1px solid var(--ink);
  font-family: var(--font-title);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  vertical-align: 0.1em;
}

.rating {
  display: flex;
  gap: 3px;
}

.rating-bar {
  width: 16px;
  height: 8px;
  border: 1px solid var(--muted);
}

.rating-bar.filled {
  background: var(--ink);
  border-color: var(--ink);
}

.table-legend {
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  color: var(--muted);
}

.option-cards {
  border-bottom: 1px solid var(--rule);
}

.option-card {
  border-top: 1px solid var(--rule);
}

.option-header {
  display: flex;
  width: 100%;
  align-items: baseline;
  gap: 1rem;
  padding: 0.85rem 0;
  background: none;
  border: 0;
  font: inherit;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.option-head-text {
  flex: 1;
  min-width: 0;
}

.option-name {
  display: block;
  font-weight: 700;
}

.option-header:hover .option-name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.option-subtitle,
.cost-note {
  display: block;
  font-size: 1rem;
  color: var(--muted);
}

.option-cost {
  max-width: 45%;
  font-weight: 700;
  text-align: right;
}

.cost-note {
  font-weight: 400;
}

.option-sign {
  width: 1.25rem;
  flex-shrink: 0;
  text-align: center;
  color: var(--muted);
}

.option-content {
  padding: 0 0 1.25rem;
}

.pros-cons {
  display: grid;
  gap: 1rem 2rem;
}

@media (min-width: 640px) {
  .pros-cons {
    grid-template-columns: 1fr 1fr;
  }
}

.pros h5,
.cons h5 {
  font-size: 1rem;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.pros ul,
.cons ul,
.recommendation-content ul {
  margin: 0;
  padding-left: 1.25rem;
}

.pros li,
.cons li {
  margin-bottom: 0.4rem;
}

.recommendation-card {
  border-left: 3px solid var(--ink);
  padding: 0.25rem 0 0.25rem 1rem;
}

.recommendation-content p {
  margin: 0;
}

.mechanism-grid {
  display: grid;
  gap: 0 2rem;
  margin-top: 1.25rem;
}

@media (min-width: 768px) {
  .mechanism-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mechanism-card {
  border-top: 1px solid var(--ink);
  padding: 0.75rem 0 1.25rem;
}

.mechanism-number {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.5rem;
  line-height: 1;
  margin-bottom: 0.4rem;
}

.mechanism-card p {
  margin: 0;
}

.importance-content > p {
  margin: 0 0 1rem;
}

.importance-benefits {
  display: grid;
  gap: 0 2rem;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .importance-benefits {
    grid-template-columns: repeat(3, 1fr);
  }
}

.importance-benefits .benefit {
  border-top: 1px solid var(--rule);
  padding: 0.6rem 0;
}

.importance-benefits .benefit strong {
  display: block;
}

.importance-benefits .benefit span {
  font-size: 1rem;
  color: var(--muted);
}

.importance-note {
  margin: 0 !important;
  font-style: italic;
}
</style>
