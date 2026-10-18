<script setup>
// Rights requests (access, erasure) for answers without email: find them by spot or
// answer number. Check first that the requester owns the lot (see the rights procedure).
import { ref } from 'vue'

const props = defineProps({
  token: { type: String, required: true }
})
const emit = defineEmits(['unauthorized', 'changed'])

const query = ref('')
const mode = ref('spot')
const results = ref(null)
const confirmingId = ref(null)
const busy = ref(false)
const error = ref('')
const notice = ref('')

const authFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: { ...(options.headers || {}), 'Authorization': `Bearer ${props.token}` }
})

const search = async () => {
  error.value = ''
  notice.value = ''
  results.value = null
  const value = parseInt(query.value, 10)
  if (!value) {
    error.value = mode.value === 'spot' ? 'Indiquez un numéro de place' : 'Indiquez un numéro de réponse'
    return
  }
  const response = await authFetch(`/api/stats/admin/responses?${mode.value}=${value}`)
  if (response.status === 401) return emit('unauthorized')
  const data = await response.json()
  if (!response.ok) {
    error.value = data.error || 'Recherche impossible'
    return
  }
  results.value = data.responses
}

const exportOne = async (id) => {
  const response = await authFetch(`/api/stats/admin/responses/${id}/export`)
  if (response.status === 401) return emit('unauthorized')
  if (!response.ok) {
    error.value = 'Export impossible'
    return
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reponse-${id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const remove = async (id) => {
  busy.value = true
  error.value = ''
  try {
    const response = await authFetch(`/api/stats/admin/responses/${id}`, { method: 'DELETE' })
    if (response.status === 401) return emit('unauthorized')
    if (!response.ok) throw new Error('Suppression impossible')
    results.value = results.value.filter(r => r.id !== id)
    confirmingId.value = null
    notice.value = `Réponse n°${id} supprimée (journalisé).`
    emit('changed')
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}

const labels = { oui: 'Oui', 'peut-etre': 'Peut-être', non: 'Non', projet: 'En projet' }
</script>

<template>
  <section class="admin-section">
    <h3>Demandes de droits (RGPD)</h3>
    <p class="hint">
      Pour une demande d'accès ou de suppression sans e-mail : vérifiez d'abord que la personne est bien
      propriétaire (ou occupante) du lot, puis retrouvez la réponse par sa place ou son numéro.
      Chaque recherche, export et suppression est journalisé. Réponse à la personne sous un mois.
    </p>
    <form class="row" @submit.prevent="search">
      <select v-model="mode" class="form-input narrow" aria-label="Rechercher par">
        <option value="spot">Place n°</option>
        <option value="id">Réponse n°</option>
      </select>
      <input v-model="query" class="form-input narrow" inputmode="numeric" aria-label="Numéro" />
      <button type="submit" class="btn btn-secondary">Rechercher</button>
    </form>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-if="notice" class="notice">{{ notice }}</p>

    <p v-if="results && !results.length" class="hint">Aucune réponse trouvée.</p>
    <ul v-if="results?.length" class="results">
      <li v-for="r in results" :key="r.id">
        <div>
          <strong>Réponse n°{{ r.id }}</strong> · {{ r.created_at }} · place {{ r.parking_spot || '—' }}
          · VE : {{ labels[r.has_ev] || r.has_ev }} · intérêt : {{ labels[r.interested] || r.interested }}
          <template v-if="r.email"> · e-mail renseigné</template>
          · {{ r.source }} / {{ r.verification }}
        </div>
        <div class="row">
          <button type="button" class="btn btn-secondary btn-small" @click="exportOne(r.id)">Exporter (accès)</button>
          <button v-if="confirmingId !== r.id" type="button" class="btn btn-secondary btn-small" @click="confirmingId = r.id">Supprimer</button>
          <template v-else>
            <strong>Supprimer définitivement la réponse n°{{ r.id }} ?</strong>
            <button type="button" class="btn btn-primary btn-small" :disabled="busy" @click="remove(r.id)">Confirmer</button>
            <button type="button" class="btn btn-secondary btn-small" :disabled="busy" @click="confirmingId = null">Annuler</button>
          </template>
        </div>
      </li>
    </ul>
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
.row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
.narrow { width: auto; min-width: 8rem; }
.results { list-style: none; padding: 0; margin: 1rem 0 0; display: flex; flex-direction: column; gap: 0.75rem; }
.results li { border-top: 1px solid var(--color-border); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.btn-small { padding: 0.4rem 0.7rem; font-size: 0.85rem; }
.form-error { color: var(--color-danger); }
.notice { font-weight: 700; }
</style>
