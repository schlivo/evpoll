<script setup>
import { inject } from 'vue'

const openEnquete = inject('openEnquete')
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-header">
        <h1>Aides financières</h1>
        <p>
          Découvrez les dispositifs d'aide pour financer l'installation
          de bornes de recharge en copropriété.
        </p>
      </header>

      <section class="aids-grid">
        <div class="aid-card featured">
          <div class="aid-header">
            <span class="aid-badge">Jusqu'à 50%</span>
            <h3>Programme ADVENIR</h3>
          </div>
          <div class="aid-content">
            <p>
              Le programme ADVENIR finance une partie des coûts d'installation
              des infrastructures de recharge en copropriété.
            </p>
            <div class="aid-details">
              <div class="aid-detail">
                <strong>Infrastructure collective</strong>
                <span>Jusqu'à 50% des coûts, plafonné à 8 000 euros</span>
              </div>
              <div class="aid-detail">
                <strong>Point de recharge individuel</strong>
                <span>Jusqu'à 50%, plafonné à 960 euros par point</span>
              </div>
            </div>
            <div class="aid-conditions">
              <h4>Conditions</h4>
              <ul>
                <li>Installation par un électricien qualifié IRVE</li>
                <li>Matériel conforme aux normes en vigueur</li>
                <li>Demande via un installateur partenaire ADVENIR</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="aid-card">
          <div class="aid-header">
            <span class="aid-badge secondary">Prime variable</span>
            <h3>Prime Enedis</h3>
          </div>
          <div class="aid-content">
            <p>
              Enedis propose une prime pour l'installation d'une colonne
              horizontale permettant le raccordement individuel des places
              de parking.
            </p>
            <div class="aid-details">
              <div class="aid-detail">
                <strong>Colonne horizontale</strong>
                <span>Prime calculée selon le nombre de places pré-équipées</span>
              </div>
            </div>
            <div class="aid-conditions">
              <h4>Avantages</h4>
              <ul>
                <li>Cumulable avec ADVENIR</li>
                <li>Compteur individuel pour chaque utilisateur</li>
                <li>Facturation directe par Enedis</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="aid-card">
          <div class="aid-header">
            <span class="aid-badge secondary">5,5%</span>
            <h3>TVA réduite</h3>
          </div>
          <div class="aid-content">
            <p>
              Les travaux d'installation de bornes de recharge bénéficient
              d'un taux de TVA réduit à 5,5% (au lieu de 20%).
            </p>
            <div class="aid-conditions">
              <h4>Conditions</h4>
              <ul>
                <li>Logement achevé depuis plus de 2 ans</li>
                <li>Travaux réalisés par un professionnel</li>
                <li>Applicable sur la main d'oeuvre et le matériel</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="aid-card">
          <div class="aid-header">
            <span class="aid-badge secondary">300 euros</span>
            <h3>Crédit d'impôt</h3>
          </div>
          <div class="aid-content">
            <p>
              Un crédit d'impôt est disponible pour l'installation d'un
              système de charge pour véhicule électrique à domicile.
            </p>
            <div class="aid-details">
              <div class="aid-detail">
                <strong>Montant</strong>
                <span>75% des dépenses, plafonné à 300 euros par système</span>
              </div>
            </div>
            <div class="aid-conditions">
              <h4>Conditions</h4>
              <ul>
                <li>Résidence principale ou secondaire</li>
                <li>Installation facturée par une entreprise</li>
                <li>Déclaration sur l'impôt sur le revenu</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="enedis-model">
        <h2>Le modèle économique Enedis : coût quasi-nul pour la copropriété</h2>
        <div class="model-explanation">
          <div class="model-intro">
            <p>
              Contrairement aux idées reçues, l'installation d'une colonne horizontale Enedis
              peut coûter <strong>très peu, voire rien</strong> à la copropriété. Voici comment :
            </p>
          </div>

          <div class="model-steps">
            <div class="model-step">
              <div class="model-icon">&#127970;</div>
              <h4>Enedis finance l'infrastructure</h4>
              <p>
                Enedis prend en charge une grande partie du coût de la colonne horizontale.
                Ce coût est ensuite <strong>refinancé via le TURPE</strong> (Tarif d'Utilisation
                des Réseaux Publics d'Électricité), intégré aux factures d'électricité des utilisateurs.
              </p>
              <p class="model-result">
                Résultat : la copropriété ne paye pas l'infrastructure réseau.
              </p>
            </div>

            <div class="model-step">
              <div class="model-icon">&#128179;</div>
              <h4>Compteur Linky = facturation directe</h4>
              <p>
                Chaque utilisateur dispose d'un <strong>compteur Linky dédié</strong> à sa place de parking.
                Il souscrit son propre contrat d'électricité auprès du fournisseur de son choix
                (EDF, Engie, TotalEnergies...).
              </p>
              <p class="model-result">
                Résultat : pas de gestion de facturation pour la copropriété.
              </p>
            </div>

            <div class="model-step">
              <div class="model-icon">&#128736;</div>
              <h4>Le prestataire se finance sur les bornes</h4>
              <p>
                L'installateur partenaire se rémunère sur la <strong>vente et l'installation
                des bornes individuelles</strong>. Pas d'abonnement mensuel, pas de commission
                sur la consommation. Vous êtes propriétaire de votre borne.
              </p>
              <p class="model-result">
                Résultat : seuls les utilisateurs payent, et uniquement leur équipement.
              </p>
            </div>
          </div>

          <div class="model-summary">
            <div class="model-summary-icon">&#9989;</div>
            <div class="model-summary-content">
              <h4>En résumé</h4>
              <p>
                Grâce à ce modèle, le reste à charge pour la copropriété après aides
                est souvent <strong>proche de zéro</strong>. Les seuls à payer sont les résidents
                qui souhaitent effectivement une borne, et ils payent uniquement leur équipement
                individuel + leur consommation d'électricité.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="summary-section">
        <h2>Récapitulatif des aides cumulables</h2>
        <div class="summary-card">
          <p>Pour une installation collective avec colonne horizontale Enedis :</p>
          <div class="summary-table">
            <div class="summary-row">
              <span>Coût estimé (75 lots)</span>
              <span class="amount">~45 000 euros</span>
            </div>
            <div class="summary-row aid">
              <span>Prime ADVENIR (50%)</span>
              <span class="amount">-8 000 euros (plafonné)</span>
            </div>
            <div class="summary-row aid">
              <span>Prime Enedis colonne</span>
              <span class="amount">-5 000 à -15 000 euros</span>
            </div>
            <div class="summary-row aid">
              <span>TVA 5,5% (vs 20%)</span>
              <span class="amount">~-5 000 euros</span>
            </div>
            <div class="summary-row total">
              <span>Reste à charge copropriété</span>
              <span class="amount">~17 000 - 27 000 euros</span>
            </div>
            <div class="summary-row per-lot">
              <span>Soit par lot</span>
              <span class="amount">~225 - 360 euros</span>
            </div>
          </div>
          <p class="summary-note">
            * Estimation indicative. Les montants exacts dépendent du devis
            et des primes en vigueur au moment de l'installation.
          </p>
        </div>
      </section>

      <section class="regional-section">
        <h2>Aides régionales et locales</h2>
        <div class="regional-card">
          <p>
            Certaines régions, départements ou communes proposent des aides
            complémentaires. Renseignez-vous auprès de :
          </p>
          <ul>
            <li>Votre conseil régional</li>
            <li>Votre conseil départemental</li>
            <li>Votre mairie</li>
            <li>L'ADEME de votre région</li>
          </ul>
          <p class="regional-note">
            Ces aides sont souvent cumulables avec les dispositifs nationaux.
          </p>
        </div>
      </section>

      <section class="process-section">
        <h2>Comment obtenir les aides ?</h2>
        <div class="process-steps">
          <div class="process-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Choisir un installateur partenaire</h4>
              <p>
                Sélectionner un électricien qualifié IRVE et partenaire
                du programme ADVENIR.
              </p>
            </div>
          </div>
          <div class="process-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Obtenir un devis détaillé</h4>
              <p>
                Le devis doit mentionner les aides déduites et les
                caractéristiques techniques.
              </p>
            </div>
          </div>
          <div class="process-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Validation en AG</h4>
              <p>
                Vote du projet en Assemblée Générale avec le détail
                du financement.
              </p>
            </div>
          </div>
          <div class="process-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>Dépôt des dossiers</h4>
              <p>
                L'installateur se charge généralement des démarches
                pour ADVENIR et Enedis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div class="cta-box">
        <h3>Intéressé par ces aides ?</h3>
        <p>Participez à l'enquête pour nous aider à avancer sur le projet.</p>
        <button @click="openEnquete" class="btn btn-primary">
          Participer à l'enquête
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aids-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 3rem;
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
  overflow: hidden;
}

.aid-card.featured {
  border-color: var(--color-primary);
  grid-column: 1 / -1;
}

@media (min-width: 768px) {
  .aid-card.featured {
    grid-column: 1 / -1;
  }
}

.aid-header {
  padding: 1.25rem;
  background: var(--color-bg-alt);
  border-bottom: 1px solid var(--color-border);
}

.aid-card.featured .aid-header {
  background: var(--color-primary-light);
}

.aid-badge {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 0.5rem;
}

.aid-badge.secondary {
  background: var(--color-secondary);
}

.aid-header h3 {
  margin: 0;
}

.aid-content {
  padding: 1.25rem;
}

.aid-content > p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}

.aid-details {
  background: var(--color-bg-alt);
  border-radius: var(--radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.aid-detail {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.aid-detail:last-child {
  margin-bottom: 0;
}

.aid-detail strong {
  font-size: 0.9rem;
}

.aid-detail span {
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.aid-conditions h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.aid-conditions ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.aid-conditions li {
  margin-bottom: 0.25rem;
}

.summary-section h2,
.regional-section h2,
.process-section h2 {
  margin-bottom: 1rem;
}

.summary-card {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.summary-card > p {
  margin-bottom: 1rem;
  color: var(--color-text-light);
}

.summary-table {
  background: var(--color-bg-card);
  border-radius: var(--radius);
  overflow: hidden;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.aid {
  color: var(--color-success);
}

.summary-row.total {
  background: var(--color-primary-light);
  font-weight: 600;
}

.summary-row.per-lot {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

.summary-row .amount {
  font-weight: 600;
}

.summary-note {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.regional-section {
  margin: 3rem 0;
}

.regional-card {
  background: var(--color-bg-alt);
  border-left: 4px solid var(--color-secondary);
  padding: 1.25rem;
  border-radius: 0 var(--radius) var(--radius) 0;
}

.regional-card p {
  margin-bottom: 0.75rem;
  color: var(--color-text-light);
}

.regional-card ul {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
}

.regional-note {
  font-weight: 500;
  color: var(--color-text) !important;
}

.process-section {
  margin-bottom: 3rem;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.process-step {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 0.25rem;
}

.step-content p {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.enedis-model {
  margin: 3rem 0;
}

.enedis-model h2 {
  margin-bottom: 1.5rem;
}

.model-explanation {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg) 100%);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 2rem;
}

.model-intro {
  margin-bottom: 1.5rem;
}

.model-intro p {
  font-size: 1.1rem;
  color: var(--color-text);
  margin: 0;
}

.model-steps {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .model-steps {
    grid-template-columns: repeat(3, 1fr);
  }
}

.model-step {
  background: white;
  padding: 1.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.model-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.model-step h4 {
  margin: 0 0 0.75rem;
  color: var(--color-primary-dark);
}

.model-step p {
  margin: 0 0 0.75rem;
  color: var(--color-text-light);
  font-size: 0.9rem;
  line-height: 1.6;
}

.model-result {
  background: var(--color-primary-light);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-weight: 500;
  color: var(--color-primary-dark);
  font-size: 0.85rem !important;
  margin: 0 !important;
}

.model-summary {
  display: flex;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: var(--radius);
  border: 2px solid var(--color-success);
}

.model-summary-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.model-summary-content h4 {
  margin: 0 0 0.5rem;
  color: var(--color-success);
}

.model-summary-content p {
  margin: 0;
  color: var(--color-text-light);
  line-height: 1.6;
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
