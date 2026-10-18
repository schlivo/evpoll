<template>
  <div class="info-view">
      <header class="info-intro">
        <p>
          Avec l'infrastructure collective préfinancée par Enedis, la copropriété
          n'investit pas dans l'infrastructure. Seuls les utilisateurs payent leur raccordement et leur borne,
          et ils peuvent bénéficier d'aides.
        </p>
      </header>

      <section class="main-principle">
        <div class="principle-card">
          <div class="principle-content">
            <h4>Enedis préfinance l'infrastructure</h4>
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
        <h4>Ce que paye chaque utilisateur</h4>

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
        <h4>Les aides pour réduire votre coût</h4>

        <div class="aids-grid">
          <div class="aid-card featured">
            <div class="aid-badge">Jusqu'à 1 000 € HT</div>
            <h5>Prime ADVENIR : borne individuelle</h5>
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
            <h5>Prime ADVENIR : infrastructure collective</h5>
            <p>
              Pour les travaux en parties communes : 50 % du coût HT, plafonné à 12 500 € HT
              jusqu'à 100 places, si l'assemblée générale vote à partir du 1<sup>er</sup> avril 2026.
            </p>
          </div>

          <div class="aid-card">
            <div class="aid-badge secondary">Selon devis</div>
            <h5>TVA réduite</h5>
            <p>
              TVA réduite possible sur la fourniture et la pose d'une borne,
              <strong>sous conditions, à confirmer sur le devis</strong>.
            </p>
          </div>

        </div>
      </section>

      <section class="example-section">
        <h4>Exemple : les postes de coût</h4>
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
        <h4>Pourquoi répondre à l'enquête ?</h4>
        <div class="why-card">
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
        <h5>Sources et liens utiles</h5>
        <ul class="sources-list">
          <li>
            <a href="https://advenir.mobi/" target="_blank" rel="noopener">
              Programme ADVENIR officiel
            </a>
            <span class="source-desc">Primes et conditions d'éligibilité</span>
          </li>
          <li>
            <a href="https://www.isiohm.fr/prime-advenir" target="_blank" rel="noopener">
              Isiohm : barèmes ADVENIR avril 2026
            </a>
            <span class="source-desc">Plafonds borne individuelle et infrastructure collective</span>
          </li>
          <li>
            <a href="https://www.electro-mob.com/colonne-horizontale-enedis-borne-recharge" target="_blank" rel="noopener">
              Electro-Mob
            </a>
            <span class="source-desc">Colonne horizontale Enedis et quote-part 2026</span>
          </li>
          <li>
            <a href="https://isiohm.fr/aides/" target="_blank" rel="noopener">
              Isiohm : aides 2026
            </a>
            <span class="source-desc">Aides en vigueur en 2026</span>
          </li>
          <li>
            <a href="https://www.enedis.fr/reseau-electrique-auto-prefinancement" target="_blank" rel="noopener">
              Enedis : préfinancement
            </a>
            <span class="source-desc">Quote-part 2026 et dérivation individuelle (barème 2025)</span>
          </li>
          <li>
            <a href="https://www.enedis.fr/presse/le-reseau-electrique-auto-la-solution-enedis-en-faveur-de-la-mobilite-electrique-dans-les" target="_blank" rel="noopener">
              Enedis
            </a>
            <span class="source-desc">Présentation officielle du réseau électrique auto</span>
          </li>
        </ul>
      </section>

  </div>
</template>

<style scoped>
.info-intro p {
  margin: 0 0 1.5rem;
  color: var(--muted);
}

.main-principle,
.cost-section,
.aids-section,
.example-section,
.why-section {
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

p {
  margin: 0 0 1rem;
}

.principle-card,
.why-card {
  border-left: 3px solid var(--ink);
  padding: 0.25rem 0 0.25rem 1rem;
}

.principle-content p:last-child,
.why-content p:last-child,
.cost-content p:last-child {
  margin-bottom: 0;
}

.cost-grid,
.aids-grid {
  display: grid;
  gap: 0 2rem;
}

@media (min-width: 768px) {
  .cost-grid { grid-template-columns: repeat(3, 1fr); }
  .aids-grid { grid-template-columns: repeat(2, 1fr); }
}

.cost-card,
.aid-card {
  border-top: 1px solid var(--ink);
  padding: 0.75rem 0 1.25rem;
}

.cost-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.cost-label {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 1.1875rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.cost-amount {
  font-weight: 700;
}

.cost-highlight {
  border-left: 3px solid var(--signal);
  padding-left: 0.75rem;
}

.aid-badge {
  display: inline-block;
  margin-bottom: 0.5rem;
  padding: 0 0.45rem;
  border: 1px solid var(--ink);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.aid-card ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--muted);
}

.aid-card li {
  margin-bottom: 0.25rem;
}

.example-intro {
  font-weight: 700;
}

.example-table {
  border-top: 2px solid var(--ink);
  margin-bottom: 0.75rem;
}

.example-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--rule);
}

.example-row .amount {
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}

.example-row.aid span:first-child {
  font-style: italic;
}

.example-note {
  font-size: 0.9375rem;
  color: var(--muted);
  font-style: italic;
  margin: 0;
}

.sources-section {
  padding-top: 1rem;
  border-top: 1px solid var(--rule);
}

.sources-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sources-list li {
  margin-bottom: 0.6rem;
}

.source-desc {
  display: block;
  font-size: 1rem;
  color: var(--muted);
}
</style>
