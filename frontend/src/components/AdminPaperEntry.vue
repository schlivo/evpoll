<script setup>
// Compact form to enter a paper answer (same lot and conflict rules as the web form)
import { ref } from 'vue'

const props = defineProps({
  token: { type: String, required: true },
  // [{ id, label }] from /api/config building_choices
  buildingChoices: { type: Array, default: () => [] }
})
const emit = defineEmits(['saved', 'unauthorized'])

const empty = () => ({
  parking_spot: '', no_parking: false, building: '', status: '',
  has_ev: '', interested: ''
})
const form = ref(empty())
const busy = ref(false)
const errors = ref([])
const notice = ref('')

/** Post the answer, keep the form for the next sheet */
const submit = async () => {
  busy.value = true
  errors.value = []
  notice.value = ''
  try {
    const payload = { ...form.value }
    if (payload.no_parking) payload.parking_spot = ''
    const response = await fetch('/api/stats/admin/paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.token}` },
      body: JSON.stringify(payload)
    })
    if (response.status === 401) return emit('unauthorized')
    const data = await response.json()
    if (!response.ok) {
      errors.value = data.errors || [data.error || 'Enregistrement impossible']
      return
    }
    notice.value = `#${data.id} : ${data.message}`
    form.value = empty()
    emit('saved', data)
  } catch (err) {
    errors.value = ['Impossible de joindre le serveur']
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="admin-section">
    <h3>Saisie d'une réponse papier</h3>
    <form class="paper-form" @submit.prevent="submit">
      <label>
        Place(s)
        <input v-model="form.parking_spot" class="form-input" inputmode="numeric" placeholder="ex. 83, 84" :disabled="form.no_parking" />
      </label>
      <label class="check">
        <input v-model="form.no_parking" type="checkbox" /> Pas de place
      </label>
      <label v-if="buildingChoices.length">
        Entrée / bâtiment
        <select v-model="form.building" class="form-input">
          <option value="">Non renseigné</option>
          <option v-for="b in buildingChoices" :key="b.id" :value="b.id">{{ b.label }}</option>
        </select>
      </label>
      <label>
        Statut
        <select v-model="form.status" class="form-input">
          <option value="">Non renseigné</option>
          <option value="proprietaire">Propriétaire</option>
          <option value="locataire">Locataire</option>
        </select>
      </label>
      <label>
        Véhicule électrique
        <select v-model="form.has_ev" class="form-input" required>
          <option value="" disabled>Choisir</option>
          <option value="oui">Oui</option>
          <option value="projet">En projet</option>
          <option value="non">Non</option>
        </select>
      </label>
      <label>
        Intérêt
        <select v-model="form.interested" class="form-input" required>
          <option value="" disabled>Choisir</option>
          <option value="oui">Oui</option>
          <option value="peut-etre">Peut-être</option>
          <option value="non">Non</option>
        </select>
      </label>
      <button type="submit" class="btn btn-primary" :disabled="busy">
        {{ busy ? 'Enregistrement…' : 'Enregistrer la réponse papier' }}
      </button>
    </form>
    <p v-for="e in errors" :key="e" class="form-error">{{ e }}</p>
    <p v-if="notice" class="notice">{{ notice }}</p>
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
.admin-section h3 { margin: 0 0 1rem; }
.paper-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  align-items: end;
}
.paper-form label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; font-weight: 500; }
.paper-form label.check { flex-direction: row; align-items: center; gap: 0.5rem; }
.paper-form .wide { grid-column: 1 / -1; }
.form-input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 0.95rem; }
.form-error { color: var(--color-danger); margin: 0.5rem 0 0; }
.notice { color: var(--color-success); font-weight: 600; margin: 0.75rem 0 0; }
</style>
