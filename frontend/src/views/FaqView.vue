<script setup>
import { ref, inject } from 'vue'

const openEnquete = inject('openEnquete')
const openItems = ref([])

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
    answer: "Oui, c'est le \"droit à la prise\". Tout occupant peut demander l'installation d'une borne à ses frais. Le syndic dispose de 3 mois pour répondre et ne peut refuser que pour des motifs sérieux (impossibilité technique). Cependant, une solution collective est généralement plus avantageuse financièrement."
  },
  {
    question: "Combien coûte l'installation d'une borne ?",
    answer: "En installation individuelle, comptez 2000 à 4000 euros tout compris. En installation collective avec colonne horizontale Enedis, le coût par place peut descendre à 500-1500 euros grâce aux économies d'échelle et aux aides (ADVENIR, prime Enedis, TVA réduite)."
  },
  {
    question: "Comment fonctionne la facturation avec une colonne Enedis ?",
    answer: "Chaque utilisateur dispose de son propre compteur Enedis. Vous payez directement votre consommation électrique à Enedis, comme pour votre logement. La copropriété n'a pas à gérer la facturation entre résidents."
  },
  {
    question: "Quelle puissance choisir pour ma borne ?",
    answer: "Pour un usage quotidien à domicile, une borne 7,4 kW (monophasé) ou 11 kW (triphasé) est largement suffisante. Elle permet de recharger environ 40-60 km d'autonomie par heure de charge. La recharge complète d'une voiture se fait en une nuit."
  },
  {
    question: "Le réseau électrique de l'immeuble peut-il supporter plusieurs bornes ?",
    answer: "C'est précisément l'intérêt de la colonne horizontale Enedis : elle est dimensionnée pour permettre à tous les résidents de se raccorder progressivement. Un système de gestion de la charge (pilotage énergétique) peut être installé pour optimiser la puissance disponible."
  },
  {
    question: "Quelles sont les aides financières disponibles ?",
    answer: "Plusieurs aides sont cumulables : le programme ADVENIR (jusqu'à 50% des coûts), la prime Enedis pour la colonne horizontale, la TVA à 5,5%, et le crédit d'impôt (300 euros). Consultez la page Aides pour plus de détails."
  },
  {
    question: "Faut-il voter en Assemblée Générale ?",
    answer: "Oui, pour une installation collective, le projet doit être voté en AG. La majorité simple (article 24) suffit généralement. Le vote porte sur le principe de l'installation, le choix de la solution technique et le budget."
  },
  {
    question: "Je suis locataire, puis-je participer ?",
    answer: "Absolument ! Votre avis est important pour dimensionner le projet. Même si vous ne votez pas en AG, vous pourrez bénéficier de l'installation une fois réalisée. Vous pouvez également demander le droit à la prise à votre propriétaire."
  },
  {
    question: "Que se passe-t-il si je n'ai pas de véhicule électrique ?",
    answer: "L'infrastructure sera prête pour le jour où vous en aurez un. Le coût de l'infrastructure commune est réparti entre tous les lots, mais vous ne payez le raccordement individuel que si vous souhaitez utiliser une borne."
  },
  {
    question: "Combien de temps prend l'installation ?",
    answer: "De la décision en AG à la mise en service, comptez 6 à 12 mois. Ce délai inclut les études techniques, les démarches administratives, les demandes d'aides et les travaux eux-mêmes."
  },
  {
    question: "Mes données sont-elles protégées ?",
    answer: "Oui, cette enquête respecte le RGPD. Vos réponses sont anonymes (seul le bâtiment est demandé, pas le numéro de lot). L'email est optionnel et uniquement utilisé si vous souhaitez être informé. Les données sont hébergées en France et ne sont pas transmises à des tiers."
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
            <span class="accordion-icon">&#9660;</span>
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
              <span>conseil.syndical@copropriete.fr</span>
            </div>
            <div class="contact-item">
              <strong>Syndic</strong>
              <span>syndic@gestionnaire.fr</span>
            </div>
          </div>
        </div>
      </section>

      <div class="cta-box">
        <h3>Prêt à donner votre avis ?</h3>
        <p>Participez à l'enquête pour nous aider à dimensionner le projet.</p>
        <button @click="openEnquete" class="btn btn-primary">
          Participer à l'enquête
        </button>
      </div>
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
  font-size: 0.75rem;
  color: var(--color-text-muted);
  transition: transform 0.2s;
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
