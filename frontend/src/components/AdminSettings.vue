<script setup>
// Settings editable from the admin (deadline, signature, contacts, data controller,
// legal notice). An empty field returns to the default (environment or instance files).
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  token: { type: String, required: true }
})
const emit = defineEmits(['unauthorized', 'saved'])

const settings = ref([])
const draft = ref({})
const saving = ref(false)
const message = ref('')
const errors = ref([])

const authFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: { ...(options.headers || {}), 'Authorization': `Bearer ${props.token}`, 'Content-Type': 'application/json' }
})

const groups = computed(() => {
  const byGroup = new Map()
  for (const s of settings.value) {
    if (!byGroup.has(s.group)) byGroup.set(s.group, [])
    byGroup.get(s.group).push(s)
  }
  return [...byGroup.entries()]
})

const fill = (list) => {
  settings.value = list
  draft.value = Object.fromEntries(list.map(s => [s.key, s.value ?? '']))
}

const load = async () => {
  const response = await authFetch('/api/stats/admin/settings')
  if (response.status === 401) return emit('unauthorized')
  if (response.ok) fill((await response.json()).settings)
}

const changed = computed(() =>
  settings.value.filter(s => (draft.value[s.key] || '') !== (s.value || '')).map(s => s.key)
)

const save = async () => {
  saving.value = true
  message.value = ''
  errors.value = []
  try {
    const response = await authFetch('/api/stats/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: Object.fromEntries(changed.value.map(k => [k, draft.value[k]])) })
    })
    if (response.status === 401) return emit('unauthorized')
    const data = await response.json()
    if (!response.ok) {
      errors.value = data.errors || ['Enregistrement impossible']
      return
    }
    fill(data.settings)
    message.value = 'Réglages enregistrés.'
    emit('saved')
  } catch (err) {
    errors.value = ['Enregistrement impossible']
  } finally {
    saving.value = false
  }
}

const resetField = (key) => { draft.value[key] = '' }

onMounted(load)
</script>

<template>
  <section class="admin-section">
    <h3>Réglages du site</h3>
    <p class="hint">
      Valeurs affichées sur le site et sur les documents. Un champ vide reprend la valeur par défaut
      (fichier d'environnement ou configuration de l'instance), indiquée sous le champ ; « - » force un champ vide.
    </p>

    <form @submit.prevent="save">
      <fieldset v-for="[group, items] in groups" :key="group" class="group">
        <legend>{{ group }}</legend>
        <p v-if="group === 'Mentions légales'" class="hint">
          Particulier non professionnel : seuls votre nom (facultatif) et un contact sont publiés ; l'adresse
          et le téléphone demandés sont ceux de l'hébergeur (LCEN, art. 6-III-2). Aucune adresse personnelle
          n'est nécessaire.
        </p>
        <div v-for="s in items" :key="s.key" class="field">
          <label :for="'setting-' + s.key">{{ s.label }}</label>
          <div class="row">
            <input
              :id="'setting-' + s.key"
              v-model="draft[s.key]"
              :type="s.type === 'date' ? 'date' : (s.type === 'email' ? 'email' : 'text')"
              class="form-input"
              maxlength="300"
              :placeholder="s.default || '—'"
            />
            <button v-if="draft[s.key]" type="button" class="btn btn-secondary btn-small" @click="resetField(s.key)">
              Valeur par défaut
            </button>
          </div>
          <small>
            <template v-if="s.value !== null"><strong>Modifié dans l'admin.</strong> </template>
            Par défaut : {{ s.default || 'vide' }} <span class="env">({{ s.env }})</span>
          </small>
        </div>
      </fieldset>

      <p v-for="e in errors" :key="e" class="form-error">{{ e }}</p>
      <p v-if="message" class="saved">{{ message }}</p>
      <button type="submit" class="btn btn-primary" :disabled="saving || !changed.length">
        {{ saving ? 'Enregistrement…' : `Enregistrer${changed.length ? ` (${changed.length})` : ''}` }}
      </button>
    </form>
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
.group { border: 0; border-top: 1px solid var(--color-border); padding: 1rem 0 0; margin: 0 0 1rem; }
.group legend { font-weight: 700; padding: 0 0.25rem 0 0; }
.field { margin-bottom: 0.9rem; }
.field label { display: block; font-weight: 600; margin-bottom: 0.3rem; }
.field small { display: block; color: var(--color-text-muted); margin-top: 0.25rem; }
.env { font-family: monospace; font-size: 0.8em; }
.row { display: flex; gap: 0.5rem; align-items: center; }
.row .form-input { flex: 1; }
.btn-small { padding: 0.4rem 0.7rem; font-size: 0.85rem; white-space: nowrap; }
.form-error { color: var(--color-danger); margin: 0.25rem 0; }
.saved { font-weight: 700; }
</style>
