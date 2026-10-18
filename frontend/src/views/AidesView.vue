<script setup>
import SvgIcon from '../components/SvgIcon.vue'
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <h1>Comment ça se finance ?</h1>
        <p>
          Avec l'infrastructure collective préfinancée par Enedis, la copropriété
          n'investit pas dans l'infrastructure. Seuls les utilisateurs payent leur raccordement et leur borne,
          et ils peuvent bénéficier d'aides.
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
              Pas d'investissement pour la copropriété, mais un vote en AG (majorité simple)
              pour signer la convention avec Enedis.
            </p>
            <p>
              D'éventuels frais annexes (honoraires de suivi, adaptation du local électrique)
              seront chiffrés avant l'AG.
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
              <span class="cost-amount">456 à 2 267 € TTC</span>
            </div>
            <div class="cost-content">
              <p>
                Contribution au préfinancement de l'infrastructure, encadrée par Enedis
                (plancher et plafond 2026), <strong>versée une fois</strong>, au raccordement.
                Le montant dépend du coût du projet et de la puissance demandée pour la place.
                La convention entre la copropriété et Enedis est conclue pour 20 ans.
              </p>
              <div class="cost-highlight">
                <strong>Se déclarer tôt :</strong> la prime ADVENIR peut réduire cette quote-part
                si la dérivation individuelle est demandée dès la création de l'infrastructure.
              </div>
            </div>
          </div>

          <div class="cost-card">
            <div class="cost-header">
              <span class="cost-label">Dérivation individuelle</span>
              <span class="cost-amount">~310 € TTC</span>
            </div>
            <div class="cost-content">
              <p>
                Câble entre l'infrastructure et votre place, et compteur Linky.
                Ordre de grandeur selon le barème Enedis 2025 : environ 310 € TTC si elle est demandée
                avec les travaux, environ 389 € TTC si elle est demandée après.
              </p>
              <p>
                Ce frais est distinct de la quote-part : les deux s'additionnent.
              </p>
            </div>
          </div>

          <div class="cost-card">
            <div class="cost-header">
              <span class="cost-label">Borne de recharge</span>
              <span class="cost-amount">Sur devis</span>
            </div>
            <div class="cost-content">
              <p>
                Achat et pose de votre borne individuelle (7 kW typiquement) par un installateur
                qualifié IRVE. Vous êtes propriétaire de votre équipement.
                Le prix varie selon le matériel et l'installateur.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="aids-section">
        <h2>Les aides pour réduire votre coût</h2>

        <div class="aids-grid">
          <div class="aid-card featured">
            <div class="aid-badge">Jusqu'à 1 000 € HT</div>
            <h3>Prime ADVENIR : borne individuelle</h3>
            <p>
              Le programme ADVENIR finance <strong>50 % du coût HT de votre borne</strong>,
              plafonné à 1 000 € HT par point individuel depuis le 1<sup>er</sup> avril 2026.
              L'installateur déduit généralement la prime du devis.
            </p>
            <ul>
              <li>Installateur qualifié IRVE et partenaire ADVENIR</li>
              <li>Offre de prime signée <strong>avant</strong> les travaux</li>
              <li>Programme prévu jusqu'au 31 décembre 2027</li>
            </ul>
          </div>

          <div class="aid-card">
            <div class="aid-badge secondary">Jusqu'à 12 500 € HT</div>
            <h3>Prime ADVENIR : infrastructure collective</h3>
            <p>
              Pour les travaux en parties communes : 50 % du coût HT, plafonné à 12 500 € HT
              jusqu'à 100 places, si l'assemblée générale vote à partir du 1<sup>er</sup> avril 2026.
            </p>
          </div>

          <div class="aid-card">
            <div class="aid-badge secondary">Selon devis</div>
            <h3>TVA réduite</h3>
            <p>
              TVA réduite possible sur la fourniture et la pose d'une borne,
              <strong>sous conditions, à confirmer sur le devis</strong>.
            </p>
          </div>

        </div>
      </section>

      <section class="example-section">
        <h2>Exemple : les postes de coût</h2>
        <div class="example-card">
          <p class="example-intro">
            Pour un copropriétaire qui se déclare avant les travaux, avec une borne
            à 1 200 € HT (hypothèse de calcul, à remplacer par votre devis). Chaque ligne est
            un ordre de grandeur ; ce tableau ne constitue pas un prix.
          </p>
          <div class="example-table">
            <div class="example-row">
              <span>Quote-part Enedis (ordre de grandeur, 2026)</span>
              <span class="amount">456 à 2 267 € TTC</span>
            </div>
            <div class="example-row">
              <span>Dérivation individuelle avec les travaux (ordre de grandeur)</span>
              <span class="amount">~310 € TTC</span>
            </div>
            <div class="example-row">
              <span>Borne 7 kW + pose (hypothèse, ordre de grandeur)</span>
              <span class="amount">~1 200 € HT</span>
            </div>
            <div class="example-row">
              <span>TVA sur la borne</span>
              <span class="amount">Selon devis</span>
            </div>
            <div class="example-row aid">
              <span>Prime ADVENIR : 50 % × 1 200 € HT, sous le plafond de 1 000 € HT (offre signée avant les travaux)</span>
              <span class="amount">~ - 600 €</span>
            </div>
          </div>
          <p class="example-note">
            * Ordres de grandeur, hors coffret ou attestation de conformité éventuels.
            La quote-part réelle dépend du projet ; elle peut être réduite par ADVENIR.
            Seul le devis fait foi.
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
              <strong>Des chiffres réels pour décider en AG.</strong>
            </p>
            <p>
              Vos réponses servent à dimensionner le projet, à le présenter en AG avec des chiffres
              réels et à obtenir de meilleures offres des opérateurs. Même si vous n'avez pas encore
              de véhicule électrique, votre intérêt compte.
            </p>
          </div>
        </div>
      </section>

      <section class="sources-section">
        <h3>Sources et liens utiles</h3>
        <ul class="sources-list">
          <li>
            <span class="source-favicon source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            </span>
            <a href="https://advenir.mobi/" target="_blank" rel="noopener">
              Programme ADVENIR officiel
            </a>
            <span class="source-desc">Primes et conditions d'éligibilité</span>
          </li>
          <li>
            <span class="source-favicon source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </span>
            <a href="https://www.isiohm.fr/prime-advenir" target="_blank" rel="noopener">
              Isiohm : barèmes ADVENIR avril 2026
            </a>
            <span class="source-desc">Plafonds borne individuelle et infrastructure collective</span>
          </li>
          <li>
            <span class="source-favicon source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </span>
            <a href="https://www.electro-mob.com/colonne-horizontale-enedis-borne-recharge" target="_blank" rel="noopener">
              Electro-Mob
            </a>
            <span class="source-desc">Colonne horizontale Enedis et quote-part 2026</span>
          </li>
          <li>
            <span class="source-favicon source-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </span>
            <a href="https://isiohm.fr/aides/" target="_blank" rel="noopener">
              Isiohm : aides 2026
            </a>
            <span class="source-desc">Aides en vigueur en 2026</span>
          </li>
          <li>
            <SvgIcon name="enedis" :size="20" class="source-favicon enedis-logo" />
            <a href="https://www.enedis.fr/reseau-electrique-auto-prefinancement" target="_blank" rel="noopener">
              Enedis : préfinancement
            </a>
            <span class="source-desc">Quote-part 2026 et dérivation individuelle (barème 2025)</span>
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
    grid-template-columns: repeat(3, 1fr);
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
    grid-template-columns: repeat(2, 1fr);
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

.source-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.source-icon svg {
  width: 18px;
  height: 18px;
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
