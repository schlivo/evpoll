<script setup>
import { ref, onMounted } from 'vue'
import SvgIcon from '../components/SvgIcon.vue'

const openItems = ref([])
const contactEmail = ref('conseil.syndical@copropriete.fr')
const syndicEmail = ref('syndic@gestionnaire.fr')

// Per-instance contacts come from the backend (CONTACT_EMAIL / SYNDIC_EMAIL);
// the literals above are only the fallback if /api/config is unreachable.
onMounted(async () => {
  try {
    const response = await fetch('/api/config')
    const config = await response.json()
    contactEmail.value = config.contact_email || contactEmail.value
    syndicEmail.value = config.syndic_email || syndicEmail.value
  } catch (error) {
    console.error('Failed to load config:', error)
  }
})

const toggleItem = (index) => {
  const idx = openItems.value.indexOf(index)
  if (idx > -1) {
    openItems.value.splice(idx, 1)
  } else {
    openItems.value.push(index)
  }
}

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
  <div class="page">
    <div class="container">
      <header class="page-header">
        <h1>Questions fréquentes</h1>
        <p>
          Retrouvez les réponses aux questions les plus courantes sur
          l'installation de bornes de recharge en copropriété.
        </p>
      </header>

      <div class="accordion">
        <div
          v-for="(item, index) in faqItems"
          :key="index"
          class="accordion-item"
          :class="{ open: openItems.includes(index) }"
        >
          <button class="accordion-header" @click="toggleItem(index)">
            <span>{{ item.question }}</span>
            <span class="accordion-icon">
              <SvgIcon name="chevron-down" :size="20" />
            </span>
          </button>
          <div class="accordion-content">
            <p>{{ item.answer }}</p>
          </div>
        </div>
      </div>

      <section class="contact-section">
        <h2>Vous avez d'autres questions ?</h2>
        <div class="contact-card">
          <p>
            N'hésitez pas à nous contacter pour toute question supplémentaire
            concernant le projet IRVE de notre copropriété.
          </p>
          <div class="contact-info">
            <div class="contact-item">
              <strong>Conseil syndical</strong>
              <a :href="'mailto:' + contactEmail">{{ contactEmail }}</a>
            </div>
            <div class="contact-item">
              <strong>Syndic</strong>
              <a :href="'mailto:' + syndicEmail">{{ syndicEmail }}</a>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.accordion {
  margin-bottom: 3rem;
}

.accordion-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--color-bg-card);
  border: none;
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.accordion-header:hover {
  background: var(--color-bg-alt);
}

.accordion-icon {
  color: var(--color-text-muted);
  transition: transform 0.2s;
  display: flex;
  align-items: center;
}

.accordion-item.open .accordion-icon {
  transform: rotate(180deg);
}

.accordion-content {
  display: none;
  padding: 0 1.25rem 1rem;
  background: var(--color-bg-card);
}

.accordion-content p {
  margin: 0;
  color: var(--color-text-light);
  line-height: 1.7;
}

.accordion-item.open .accordion-content {
  display: block;
}

.contact-section {
  margin-bottom: 3rem;
}

.contact-section h2 {
  margin-bottom: 1rem;
}

.contact-card {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.contact-card > p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}

.contact-info {
  display: grid;
  gap: 1rem;
}

@media (min-width: 640px) {
  .contact-info {
    grid-template-columns: repeat(2, 1fr);
  }
}

.contact-item {
  background: var(--color-bg-card);
  padding: 1rem;
  border-radius: var(--radius);
}

.contact-item strong {
  display: block;
  margin-bottom: 0.25rem;
}

.contact-item span {
  color: var(--color-primary);
  font-size: 0.9rem;
}

</style>
