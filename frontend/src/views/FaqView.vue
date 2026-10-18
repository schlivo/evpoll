<script setup>
import { ref, computed, inject } from 'vue'
import Accordion from '../components/Accordion.vue'

// Public instance config loaded by App.vue (contacts)
const instanceConfig = inject('instanceConfig', ref({}))

// Per-instance contacts (CONTACT_EMAIL / SYNDIC_EMAIL): hidden when not configured
const contactEmail = computed(() => instanceConfig.value.contact_email || '')
const syndicEmail = computed(() => instanceConfig.value.syndic_email || '')

const openItems = ref({})

const faqItems = [
  {
    question: "Qu'est-ce qu'une IRVE ?",
    answer: "IRVE signifie Infrastructure de Recharge pour Véhicules Électriques. Il s'agit de l'ensemble des équipements (bornes, câbles, compteurs) permettant de recharger les véhicules électriques et hybrides rechargeables."
  },
  {
    question: "Puis-je installer une borne seul, sans attendre la copropriété ?",
    answer: "Oui, c'est le \"droit à la prise\". Tout occupant peut faire installer une borne à ses frais. Il notifie son projet au syndic par lettre recommandée avec accusé de réception, avec un descriptif et un plan. Le syndic ne décide pas : il dispose de 3 mois pour saisir le tribunal judiciaire s'il a un motif sérieux et légitime (impossibilité technique, ou projet collectif voté ou en cours sous 6 mois). S'il ne le fait pas, les travaux peuvent avoir lieu. Ces 3 mois sont donc un délai minimal avant travaux, pas une garantie de rapidité. Un projet collectif en cours peut justifier d'attendre la solution commune."
  },
  {
    question: "Combien coûte l'installation d'une borne ?",
    answer: "En installation individuelle, comptez 2000 à 4000 euros tout compris (ordre de grandeur). Avec la colonne horizontale Enedis, chaque utilisateur paie trois postes distincts : la quote-part Enedis (456 à 2 267 € TTC en 2026, versée une fois au raccordement), la dérivation individuelle (ordre de grandeur : environ 310 € TTC si elle est demandée avec les travaux, environ 389 € TTC après) et sa borne, sur devis. La prime ADVENIR peut couvrir 50 % du coût HT de la borne (plafond 1 000 € HT). Consultez la page Financement pour le détail."
  },
  {
    question: "Comment fonctionne la facturation avec une colonne Enedis ?",
    answer: "Chaque utilisateur dispose de son propre compteur Linky. Le gestionnaire du réseau (Enedis) pose le compteur mais n'envoie pas de facture de consommation : vous souscrivez un contrat auprès du fournisseur d'électricité de votre choix (EDF, Engie, TotalEnergies...), qui vous facture, comme pour votre logement. La copropriété n'a pas à gérer la facturation entre résidents."
  },
  {
    question: "Quelle puissance choisir pour ma borne ?",
    answer: "Pour un usage quotidien à domicile, une borne 7,4 kW (monophasé) ou 11 kW (triphasé) est largement suffisante. Elle permet de recharger environ 40 à 60 km d'autonomie par heure de charge (ordre de grandeur, selon le véhicule). La recharge complète d'une voiture se fait en une nuit."
  },
  {
    question: "Le réseau électrique de l'immeuble peut-il supporter plusieurs bornes ?",
    answer: "C'est précisément l'intérêt de la colonne horizontale Enedis : elle est dimensionnée pour permettre à tous les résidents de se raccorder progressivement. Un système de gestion de la charge (pilotage énergétique) peut être installé pour optimiser la puissance disponible."
  },
  {
    question: "Quelles sont les aides financières disponibles ?",
    answer: "En 2026 : la prime ADVENIR (50 % du coût HT de la borne, plafonnée à 1 000 € HT ; 50 % de l'infrastructure collective, plafonnée à 12 500 € HT jusqu'à 100 places) pour une offre de prime signée avant les travaux, avec un installateur qualifié IRVE. Une TVA réduite est possible sous conditions, à confirmer sur le devis. Consultez la page Financement pour les détails et les sources."
  },
  {
    question: "Faut-il voter en Assemblée Générale ?",
    answer: "Oui, pour une installation collective, le projet doit être voté en AG. La majorité simple (article 24) s'applique à l'équipement des places et à la signature d'une convention sans frais pour la copropriété avec Enedis ou un opérateur. Au moins un devis d'opérateur doit être présenté 2 mois avant l'AG qui vote une convention avec Enedis."
  },
  {
    question: "Je suis locataire, puis-je participer ?",
    answer: "Absolument ! Votre avis est important pour dimensionner le projet. Même si vous ne votez pas en AG, vous pourrez bénéficier de l'installation une fois réalisée. Vous pouvez également demander le droit à la prise à votre propriétaire."
  },
  {
    question: "Que se passe-t-il si je n'ai pas de véhicule électrique ?",
    answer: "L'infrastructure sera prête pour le jour où vous en aurez un. Avec la solution Enedis, vous n'avez rien à payer tant que vous ne vous raccordez pas : seuls les utilisateurs payent leur raccordement et leur borne. Avec une infrastructure collective privée, en revanche, le coût de l'infrastructure commune est réparti entre les copropriétaires selon les tantièmes."
  },
  {
    question: "Combien de temps prend l'installation ?",
    answer: "Comptez en général 12 à 18 mois entre la demande à Enedis et la mise en service, dont environ 6 mois de travaux après la signature de la convention. Ce délai inclut les études techniques, le vote en AG, les démarches administratives et les travaux eux-mêmes."
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer: "Vos réponses ne sont pas anonymes : le numéro de place permet de les rattacher à un lot. Elles ne sont consultées que par le responsable de l'enquête et ne sont diffusées que sous forme agrégée (nombre de places intéressées, sans nom). L'email est optionnel et uniquement utilisé si vous souhaitez être informé. Le détail figure dans la politique de confidentialité."
  }
]
</script>

<template>
  <div class="info-view">
    <header class="info-intro">
      <p>
        Retrouvez les réponses aux questions les plus courantes sur
        l'installation de bornes de recharge en copropriété.
      </p>
    </header>

    <div class="faq-list">
      <Accordion
        v-for="(item, index) in faqItems"
        :key="index"
        v-model:open="openItems[index]"
        :title="item.question"
        variant="question"
        :level="4"
      >
        <p>{{ item.answer }}</p>
      </Accordion>
    </div>

    <section v-if="contactEmail || syndicEmail" class="contact-section">
      <h4>Vous avez d'autres questions ?</h4>
      <p>
        N'hésitez pas à nous contacter pour toute question supplémentaire
        concernant le projet IRVE de notre copropriété.
      </p>
      <dl class="contact-info">
        <div v-if="contactEmail" class="contact-item">
          <dt>Conseil syndical</dt>
          <dd><a :href="'mailto:' + contactEmail">{{ contactEmail }}</a></dd>
        </div>
        <div v-if="syndicEmail" class="contact-item">
          <dt>Syndic</dt>
          <dd><a :href="'mailto:' + syndicEmail">{{ syndicEmail }}</a></dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.info-intro p {
  margin: 0 0 1rem;
  color: var(--muted);
}

.faq-list {
  border-bottom: 1px solid var(--rule);
  margin-bottom: 2rem;
}

.faq-list p {
  margin: 0;
  max-width: 70ch;
}

.contact-section h4 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--rule);
}

.contact-section > p {
  margin: 0 0 1rem;
}

.contact-info {
  display: grid;
  gap: 0.75rem 2rem;
  margin: 0;
}

@media (min-width: 640px) {
  .contact-info {
    grid-template-columns: repeat(2, 1fr);
  }
}

.contact-item dt {
  font-weight: 700;
}

.contact-item dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
