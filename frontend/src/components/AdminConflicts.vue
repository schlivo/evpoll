<script setup>
// Admin "Conflits" section: lots with several non-ignored answers, and the actions to settle them
import { ref, onMounted } from 'vue'

const props = defineProps({
  token: { type: String, required: true }
})
const emit = defineEmits(['changed', 'unauthorized'])

const conflicts = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
// Inline confirmation: { lot, action, id } waiting for a second click
const pending = ref(null)
const busy = ref(false)

const ACTION_LABELS = {
  keep: 'Garder cette réponse (les autres seront ignorées)',
  suspect: 'Marquer suspecte (exclue des « intéressés »)',
  ignore: 'Ignorer (exclue de tout)'
}
const REVIEW_LABELS = { ok: 'OK', conflit: 'En conflit', suspect: 'Suspecte', ignoree: 'Ignorée' }
const INTEREST_LABELS = { oui: 'Intéressé', 'peut-etre': 'Peut-être', non: 'Pas intéressé' }
const EV_LABELS = { oui: 'VE', projet: 'Projet', non: 'Pas de VE' }
const STATUS_LABELS = { proprietaire: 'Propriétaire', locataire: 'Locataire', non_renseigne: 'Non renseigné' }

/** Load the lots with at least two non-ignored answers */
const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/stats/admin/conflicts', {
      headers: { 'Authorization': `Bearer ${props.token}` }
    })
    if (response.status === 401) return emit('unauthorized')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    conflicts.value = data.conflicts
  } catch (err) {
    error.value = err.message || 'Impossible de charger les conflits'
  } finally {
    loading.value = false
  }
}

const ask = (lot, action, id) => {
  notice.value = ''
  pending.value = { lot, action, id }
}
const isPending = (lot, action, id) =>
  pending.value?.lot === lot && pending.value?.action === action && pending.value?.id === id

/** Send the confirmed action, then reload conflicts and the dashboard */
const confirmAction = async () => {
  const { lot, action, id } = pending.value
  busy.value = true
  try {
    const body = action === 'keep' ? { action, keep_id: id } : { action, id }
    const response = await fetch(`/api/stats/admin/conflicts/${encodeURIComponent(lot)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.token}` },
      body: JSON.stringify(body)
    })
    if (response.status === 401) return emit('unauthorized')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    notice.value = `Lot ${lot} : action enregistrée et journalisée.`
    pending.value = null
    await load()
    emit('changed')
  } catch (err) {
    error.value = err.message || 'Action impossible'
  } finally {
    busy.value = false
  }
}

const lotTitle = (c) => (c.lot !== null ? `Lot n°${c.lot}` : 'Place') + ` · place${c.places.length > 1 ? 's' : ''} ${c.places.join('-')}`
const formatDelay = (minutes) => minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.round(minutes / 60)} h` : `${Math.round(minutes / 1440)} j`

defineExpose({ load })
onMounted(load)
</script>

<template>
  <section class="admin-section">
    <div class="section-head">
      <h3>Conflits <span v-if="conflicts.length" class="count">{{ conflicts.length }}</span></h3>
      <button class="btn btn-secondary btn-sm" :disabled="loading" @click="load">Actualiser</button>
    </div>
    <p class="hint">
      Lots ayant plusieurs réponses non ignorées. Tant qu'un lot n'est pas tranché, il compte comme déclaré
      mais pas comme intéressé. Une réponse vérifiée par code de papillon est retenue d'office.
    </p>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-if="notice" class="notice">{{ notice }}</p>
    <p v-if="!loading && !conflicts.length" class="empty">Aucun conflit.</p>

    <article v-for="c in conflicts" :key="c.lot_key" class="conflict" :class="{ resolved: !c.unresolved }">
      <header>
        <strong>{{ lotTitle(c) }}</strong>
        <span class="tag" :class="c.unresolved ? 'tag-warn' : 'tag-ok'">
          {{ c.unresolved ? 'À trancher' : `Réponse #${c.retained_id} retenue` }}
        </span>
        <span class="tag">{{ c.same_ip ? 'Même IP' : 'IP différentes' }}</span>
        <span class="tag">Écart {{ formatDelay(c.delay_minutes) }}</span>
      </header>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Réponse</th><th>Date (UTC)</th><th>Source</th><th>Code</th><th>Revue</th>
              <th>Intérêt</th><th>VE</th><th>Statut</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in c.responses" :key="r.id" :class="{ retained: r.id === c.retained_id }">
              <td>#{{ r.id }}<span v-if="r.same_ip_as.length" class="ip-flag" :title="'Même IP que #' + r.same_ip_as.join(', #')"> · IP = #{{ r.same_ip_as.join(', #') }}</span></td>
              <td>{{ r.created_at }}</td>
              <td>{{ r.source === 'papier' ? 'Papier' : 'Web' }}</td>
              <td>{{ r.verification === 'verifiee' ? 'Vérifiée' : 'Déclarative' }}</td>
              <td>{{ REVIEW_LABELS[r.review_status] || r.review_status }}</td>
              <td>{{ INTEREST_LABELS[r.interested] || r.interested }}</td>
              <td>{{ EV_LABELS[r.has_ev] || r.has_ev }}</td>
              <td>{{ STATUS_LABELS[r.status] || r.status }}</td>
              <td class="actions">
                <template v-for="action in ['keep', 'suspect', 'ignore']" :key="action">
                  <span v-if="isPending(c.lot_key, action, r.id)" class="confirm">
                    {{ ACTION_LABELS[action] }} ?
                    <button class="btn btn-primary btn-sm" :disabled="busy" @click="confirmAction">Confirmer</button>
                    <button class="btn btn-secondary btn-sm" :disabled="busy" @click="pending = null">Annuler</button>
                  </span>
                  <button
                    v-else-if="!(action === 'suspect' && r.review_status === 'suspect')"
                    class="btn btn-secondary btn-sm"
                    :disabled="busy"
                    @click="ask(c.lot_key, action, r.id)"
                  >{{ action === 'keep' ? 'Garder' : action === 'suspect' ? 'Suspecte' : 'Ignorer' }}</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
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
.section-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.section-head h3 { margin: 0; }
.count {
  display: inline-block;
  min-width: 1.5em;
  padding: 0 0.4em;
  border-radius: 999px;
  background: var(--color-warning);
  color: #1d2126;
  font-size: 0.85rem;
  text-align: center;
}
.hint, .empty { color: var(--color-text-muted); font-size: 0.9rem; margin: 0.5rem 0 1rem; }
.notice { color: var(--color-success); font-weight: 600; }
.form-error { color: var(--color-danger); }
.conflict { border-top: 1px solid var(--color-border); padding: 1rem 0; }
.conflict.resolved { opacity: 0.8; }
.conflict header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.tag { font-size: 0.8rem; padding: 0.1rem 0.5rem; border: 1px solid var(--color-border); border-radius: 999px; }
.tag-warn { border-color: var(--color-warning); font-weight: 600; }
.tag-ok { border-color: var(--color-success); }
.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--color-border); vertical-align: top; }
tr.retained { background: rgba(16, 185, 129, 0.08); }
.ip-flag { color: var(--color-danger); font-size: 0.8rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.confirm { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; font-weight: 600; }
.btn-sm { padding: 0.25rem 0.6rem; font-size: 0.8rem; }
</style>
