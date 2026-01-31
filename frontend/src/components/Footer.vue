<script setup>
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-info">
          <p class="footer-title">Enquête IRVE Copropriété</p>
          <p class="footer-desc">
            Projet d'installation de bornes de recharge pour véhicules électriques
          </p>
        </div>

        <div class="footer-links">
          <router-link to="/faq">FAQ</router-link>
          <span class="separator">|</span>
          <a href="#rgpd" @click.prevent="$emit('openRgpd')">Mentions RGPD</a>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} - Copropriété. Tous droits réservés.</p>
        <p class="footer-note">
          Données hébergées en France.
          Aucune donnée transmise à des tiers.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--color-bg-alt);
  border-top: 1px solid var(--color-border);
  padding: 2rem 0;
  margin-top: auto;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.footer-title {
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.footer-desc {
  color: var(--color-text-light);
  margin: 0;
  font-size: 0.875rem;
}

.footer-links {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.footer-links a {
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.footer-links a:hover {
  color: var(--color-primary);
}

.separator {
  color: var(--color-border);
}

.footer-bottom {
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.footer-note {
  margin-top: 0.5rem !important;
}

@media (min-width: 640px) {
  .footer-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}
</style>
