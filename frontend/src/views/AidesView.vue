<script setup>
import SvgIcon from '../components/SvgIcon.vue'
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <h1>Comment ça se finance ?</h1>
        <p>
          Avec la solution colonne horizontale Enedis, le coût pour la copropriété
          est nul. Seuls les utilisateurs payent, et ils bénéficient d'aides.
        </p>
      </header>

      <section class="main-principle">
        <div class="principle-card">
          <div class="principle-icon enedis-logo">
              <SvgIcon name="enedis" :size="48" />
            </div>
          <div class="principle-content">
            <h2>Enedis préfinance l'infrastructure</h2>
            <p>
              Enedis installe la <strong>colonne horizontale</strong> (le câblage principal
              dans le parking) sans aucun investissement de la copropriété.
              Pas de vote de budget en AG, pas d'avance de trésorerie.
            </p>
            <p>
              Chaque copropriétaire qui souhaite une borne obtient son propre
              <strong>compteur Linky</strong> sur sa place de parking et choisit
              librement son fournisseur d'électricité.
            </p>
          </div>
        </div>
      </section>

      <section class="cost-section">
        <h2>Ce que paye chaque utilisateur</h2>

        <div class="cost-grid">
          <div class="cost-card">
            <div class="cost-header">
              <span class="cost-label">Quote-part Enedis</span>
              <span class="cost-amount">440 à 2 200 euros</span>
            </div>
            <div class="cost-content">
              <p>
                Participation au remboursement de l'infrastructure sur 20 ans.
                Le montant dépend de la distance de votre place au point de raccordement.
              </p>
              <div class="cost-highlight">
                <strong>Avantage premiers demandeurs :</strong> le coût est plus
                avantageux si vous vous raccordez dès l'installation de la colonne.
              </div>
            </div>
          </div>

          <div class="cost-card">
            <div class="cost-header">
              <span class="cost-label">Borne de recharge</span>
              <span class="cost-amount">800 à 1 500 euros</span>
            </div>
            <div class="cost-content">
              <p>
                Achat et installation de votre borne individuelle (7 kW typiquement).
                Vous êtes propriétaire de votre équipement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="aids-section">
        <h2>Les aides pour réduire votre coût</h2>

        <div class="aids-grid">
          <div class="aid-card featured">
            <div class="aid-badge">Jusqu'à 600 euros</div>
            <h3>Prime ADVENIR</h3>
            <p>
              Le programme ADVENIR finance <strong>50% du coût de votre borne</strong>,
              plafonné à 600 euros HT. L'installateur déduit directement la prime du devis.
            </p>
            <ul>
              <li>Installateur qualifié IRVE et partenaire ADVENIR</li>
              <li>Borne ≤ 22 kW</li>
              <li>Programme valable jusqu'en 2027</li>
            </ul>
          </div>

          <div class="aid-card">
            <div class="aid-badge secondary">5,5%</div>
            <h3>TVA réduite</h3>
            <p>
              Taux de TVA à 5,5% au lieu de 20% sur l'installation
              (logement de plus de 2 ans).
            </p>
          </div>
        </div>
      </section>

      <section class="example-section">
        <h2>Exemple concret</h2>
        <div class="example-card">
          <p class="example-intro">
            Pour un copropriétaire qui se raccorde dès l'installation de la colonne :
          </p>
          <div class="example-table">
            <div class="example-row">
              <span>Quote-part Enedis (estimation basse)</span>
              <span class="amount">500 euros</span>
            </div>
            <div class="example-row">
              <span>Borne 7 kW + installation</span>
              <span class="amount">1 200 euros HT</span>
            </div>
            <div class="example-row aid">
              <span>Prime ADVENIR (50%)</span>
              <span class="amount">- 600 euros</span>
            </div>
            <div class="example-row">
              <span>TVA 5,5%</span>
              <span class="amount">+ 60 euros</span>
            </div>
            <div class="example-row total">
              <span>Coût total estimé</span>
              <span class="amount">~1 160 euros</span>
            </div>
          </div>
          <p class="example-note">
            * Estimation indicative. Le montant exact de la quote-part Enedis
            dépend de la configuration du parking.
          </p>
        </div>
      </section>

      <section class="why-section">
        <h2>Pourquoi répondre à l'enquête ?</h2>
        <div class="why-card">
          <div class="why-icon">
              <SvgIcon name="chart-up" :size="40" />
            </div>
          <div class="why-content">
            <p>
              <strong>Plus on est nombreux intéressés, plus le projet avance vite.</strong>
            </p>
            <p>
              Enedis et les installateurs priorisent les copropriétés avec un nombre
              suffisant de demandeurs. Même si vous n'avez pas encore de véhicule électrique,
              votre intérêt compte pour déclencher le projet.
            </p>
          </div>
        </div>
      </section>

      <section class="sources-section">
        <h3>Sources et liens utiles</h3>
        <ul class="sources-list">
          <li>
            <img src="https://www.google.com/s2/favicons?domain=advenir.mobi&sz=32" alt="" class="source-favicon" />
            <a href="https://advenir.mobi/" target="_blank" rel="noopener">
              Programme ADVENIR officiel
            </a>
            <span class="source-desc">Primes et conditions d'éligibilité</span>
          </li>
          <li>
            <img src="https://www.google.com/s2/favicons?domain=electro-mob.com&sz=32" alt="" class="source-favicon" />
            <a href="https://www.electro-mob.com/borne-recharge-copropriete-colonne-horizontale-enedis" target="_blank" rel="noopener">
              Electro-Mob
            </a>
            <span class="source-desc">Explication détaillée du dispositif</span>
          </li>
          <li>
            <SvgIcon name="enedis" :size="20" class="source-favicon enedis-logo" />
            <a href="https://www.enedis.fr/presse/le-reseau-electrique-auto-la-solution-enedis-en-faveur-de-la-mobilite-electrique-dans-les" target="_blank" rel="noopener">
              Enedis
            </a>
            <span class="source-desc">Présentation officielle du réseau électrique auto</span>
          </li>
        </ul>
      </section>

    </div>
  </div>
</template>

<style scoped>
.main-principle {
  margin-bottom: 3rem;
}

.principle-card {
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg) 100%);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
}

.principle-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  min-height: 48px;
  overflow: visible;
}

.principle-content h2 {
  margin: 0 0 1rem;
  color: var(--color-primary-dark);
}

.principle-content p {
  margin: 0 0 1rem;
  color: var(--color-text);
  line-height: 1.6;
}

.principle-content p:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .principle-card {
    flex-direction: column;
    text-align: center;
  }
}

.cost-section {
  margin-bottom: 3rem;
}

.cost-section h2 {
  margin-bottom: 1.5rem;
}

.cost-grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .cost-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.cost-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.cost-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
}

.cost-label {
  font-weight: 600;
}

.cost-amount {
  font-weight: 700;
  color: var(--color-primary);
}

.cost-content {
  padding: 1.25rem;
}

.cost-content p {
  margin: 0 0 1rem;
  color: var(--color-text-light);
  font-size: 0.95rem;
  line-height: 1.6;
}

.cost-highlight {
  background: var(--color-primary-light);
  padding: 1rem;
  border-radius: var(--radius);
  font-size: 0.9rem;
  color: var(--color-primary-dark);
}

.aids-section {
  margin-bottom: 3rem;
}

.aids-section h2 {
  margin-bottom: 1.5rem;
}

.aids-grid {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .aids-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.aid-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.aid-card.featured {
  border-color: var(--color-primary);
}

.aid-badge {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 0.75rem;
}

.aid-badge.secondary {
  background: var(--color-secondary);
}

.aid-card h3 {
  margin: 0 0 0.75rem;
}

.aid-card p {
  margin: 0 0 1rem;
  color: var(--color-text-light);
  font-size: 0.95rem;
  line-height: 1.6;
}

.aid-card ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.aid-card li {
  margin-bottom: 0.25rem;
}

.example-section {
  margin-bottom: 3rem;
}

.example-section h2 {
  margin-bottom: 1rem;
}

.example-card {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.example-intro {
  margin-bottom: 1rem;
  color: var(--color-text);
  font-weight: 500;
}

.example-table {
  background: var(--color-bg-card);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 1rem;
}

.example-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.95rem;
}

.example-row:last-child {
  border-bottom: none;
}

.example-row.aid {
  color: var(--color-success);
}

.example-row.total {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

.example-row .amount {
  font-weight: 600;
}

.example-note {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
}

.why-section {
  margin-bottom: 2rem;
}

.why-section h2 {
  margin-bottom: 1rem;
}

.why-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-alt);
  border-left: 4px solid var(--color-warning);
  border-radius: 0 var(--radius) var(--radius) 0;
}

.why-icon {
  color: var(--color-warning);
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
}

.why-content p {
  margin: 0 0 0.75rem;
  color: var(--color-text);
  line-height: 1.6;
}

.why-content p:last-child {
  margin-bottom: 0;
  color: var(--color-text-light);
}

.sources-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.sources-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

.sources-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sources-list li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.source-favicon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 3px;
}

.enedis-logo {
  color: var(--color-enedis, #0066b3);
}

.source-desc {
  width: 100%;
  margin-left: 28px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.sources-list a {
  color: var(--color-primary);
  text-decoration: none;
}

.sources-list a:hover {
  text-decoration: underline;
}
</style>
