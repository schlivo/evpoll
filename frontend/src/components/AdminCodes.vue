<script setup>
// "Papillons pare-brise": one code per parking lot. Codes are stored hashed on the server;
// the clear list only exists in the response of a regeneration.
import { ref, onMounted } from 'vue'

const props = defineProps({
  token: { type: String, required: true }
})
const emit = defineEmits(['unauthorized'])

// Read by the flyer generator (flyer.html?doc=a6)
const A6_STORAGE_KEY = 'evpoll_a6_codes'
// Campaign key for the generic documents, read by the flyer generator too
const CAMPAIGN_KEY_STORAGE = 'evpoll_campaign_key'

const campaign = ref(null)
const confirmingRotate = ref(false)

const status = ref(null)
const codes = ref(null)
const confirming = ref(false)
const busy = ref(false)
const error = ref('')

const authFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: { ...(options.headers || {}), 'Authorization': `Bearer ${props.token}` }
})

/** Number of codes and generation date (never the codes) */
const loadStatus = async () => {
  try {
    const response = await authFetch('/api/stats/admin/codes/status')
    if (response.status === 401) return emit('unauthorized')
    if (response.ok) status.value = await response.json()
  } catch (err) {
    status.value = null
  }
}

/** Campaign key printed on the A4 note, A5 flyer and poster (derived server-side, can be shown again) */
const loadCampaignKey = async () => {
  try {
    const response = await authFetch('/api/stats/admin/campaign-key')
    if (response.status === 401) return emit('unauthorized')
    if (response.ok) campaign.value = await response.json()
  } catch (err) {
    campaign.value = null
  }
}

const rotateCampaignKey = async () => {
  busy.value = true
  error.value = ''
  try {
    const response = await authFetch('/api/stats/admin/campaign-key/rotate', { method: 'POST' })
    if (response.status === 401) return emit('unauthorized')
    if (!response.ok) throw new Error('Changement impossible')
    campaign.value = await response.json()
    confirmingRotate.value = false
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}

const openDocuments = (doc) => {
  try {
    if (campaign.value?.campaign_key) sessionStorage.setItem(CAMPAIGN_KEY_STORAGE, campaign.value.campaign_key)
    if (codes.value) sessionStorage.setItem(A6_STORAGE_KEY, JSON.stringify(codes.value))
  } catch (err) {
    error.value = 'Le navigateur refuse le stockage de session.'
    return
  }
  window.open(`/flyer.html?doc=${doc}`, '_blank')
}

/** Regenerate every code: invalidates the flyers already printed */
const regenerate = async () => {
  busy.value = true
  error.value = ''
  try {
    const response = await authFetch('/api/stats/admin/codes/regenerate', { method: 'POST' })
    if (response.status === 401) return emit('unauthorized')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    codes.value = data.codes.map(({ lot, places, code }) => ({ lot, places, code }))
    confirming.value = false
    loadStatus()
  } catch (err) {
    error.value = err.message || 'Génération impossible'
  } finally {
    busy.value = false
  }
}

const downloadCSV = () => {
  const rows = [
    'lot,places,code',
    ...codes.value.map(c => `${c.lot ?? ''},${c.places.join('-')},${c.code}`)
  ]
  const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `codes-papillons-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const openGenerator = () => openDocuments('a6')

onMounted(() => {
  loadStatus()
  loadCampaignKey()
})
</script>

<template>
  <section class="admin-section">
    <h3>Clé de campagne</h3>
    <p class="hint">
      Imprimée sous le QR code de la note A4, du flyer A5 et de l'affiche (lien court <code>/r/CLÉ</code>).
      Une réponse avec la clé confirme qu'elle vient d'un document de la résidence ; la limite par adresse IP est alors élargie.
      <template v-if="campaign?.required">Elle est <strong>obligatoire</strong> pour répondre (CAMPAIGN_KEY_REQUIRED).</template>
      <template v-else>Elle reste facultative (CAMPAIGN_KEY_REQUIRED non activé).</template>
    </p>
    <p v-if="campaign" class="campaign-key">{{ campaign.campaign_key }}</p>
    <div class="row">
      <button class="btn btn-primary" :disabled="!campaign" @click="openDocuments('note')">Ouvrir le générateur (note, flyer, affiche)</button>
      <button v-if="!confirmingRotate" class="btn btn-secondary" :disabled="busy" @click="confirmingRotate = true">Changer la clé</button>
    </div>
    <div v-if="confirmingRotate" class="confirm">
      <strong>Les documents déjà imprimés avec l'ancienne clé ne la feront plus reconnaître.</strong>
      <div class="row">
        <button class="btn btn-primary" :disabled="busy" @click="rotateCampaignKey">Confirmer</button>
        <button class="btn btn-secondary" :disabled="busy" @click="confirmingRotate = false">Annuler</button>
      </div>
    </div>
  </section>

  <section class="admin-section">
    <h3>Papillons pare-brise</h3>
    <p class="hint">
      Un code par lot (un lot double a un seul code). Une réponse accompagnée du bon code est « vérifiée »
      et prime en cas de conflit. Les codes sont stockés hachés : la liste en clair n'apparaît qu'une fois, juste après la génération.
    </p>
    <p v-if="status" class="status">
      <template v-if="status.count">{{ status.count }} codes actifs, générés le {{ status.generated_at }} (UTC).</template>
      <template v-else>Aucun code généré.</template>
    </p>

    <div v-if="!confirming" class="row">
      <button class="btn btn-secondary" :disabled="busy" @click="confirming = true">
        Générer les codes (invalide les papillons déjà imprimés)
      </button>
    </div>
    <div v-else class="confirm">
      <strong>Tous les codes actuels seront remplacés : les papillons déjà imprimés ne seront plus reconnus.</strong>
      <div class="row">
        <button class="btn btn-primary" :disabled="busy" @click="regenerate">{{ busy ? 'Génération…' : 'Confirmer la génération' }}</button>
        <button class="btn btn-secondary" :disabled="busy" @click="confirming = false">Annuler</button>
      </div>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>

    <div v-if="codes" class="codes-ready">
      <p class="once">
        {{ codes.length }} codes générés. <strong>Ils ne seront plus jamais affichés</strong> : téléchargez-les ou ouvrez
        le générateur maintenant, avant de quitter cette page.
      </p>
      <div class="row">
        <button class="btn btn-primary" @click="downloadCSV">Télécharger les codes (CSV)</button>
        <button class="btn btn-primary" @click="openGenerator">Ouvrir le générateur de papillons</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.admin-section h3 { margin: 0 0 0.5rem; }
.hint { color: var(--color-text-muted); font-size: 0.9rem; margin: 0 0 0.75rem; }
.status { margin: 0 0 1rem; }
.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.confirm { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; border: 2px solid var(--color-warning); border-radius: var(--radius); }
.form-error { color: var(--color-danger); }
.codes-ready { margin-top: 1rem; padding: 1rem; border: 2px solid var(--color-danger); border-radius: var(--radius); }
.once { margin: 0 0 0.75rem; }
.campaign-key { font-family: var(--font-title); font-size: 2rem; letter-spacing: 0.2em; margin: 0 0 1rem; }
</style>
