// Settings editable from the admin page (deadline, signature, contacts, data controller,
// legal notice...). Precedence: value saved in the admin > environment variable >
// instance files > built-in default. Clearing a field in the admin returns to its default;
// "-" saves an explicit empty value (to hide a default).
const EXPLICIT_EMPTY = '-';
const effective = (saved) => (saved === EXPLICIT_EMPTY ? '' : saved);
import db, { logAuditEvent } from './db.js';
import { CAMPAIGN, PRIVACY, TEXTS, LEGAL } from './config.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Example addresses from .env.example: never shown to respondents
const EXAMPLE_EMAILS = ['conseil-syndical@exemple.fr', 'syndic@exemple.fr'];
const envEmail = (name) => {
  const value = (process.env[name] || '').trim();
  return EXAMPLE_EMAILS.includes(value.toLowerCase()) ? '' : value;
};

/**
 * Editable settings. `fallback` is the value used when nothing is saved in the admin.
 * Types: date (AAAA-MM-JJ), email, text.
 */
export const SETTINGS = [
  { key: 'campaign_deadline', group: 'Campagne', label: 'Date limite de réponse', type: 'date', env: 'CAMPAIGN_DEADLINE', fallback: () => CAMPAIGN.deadline },
  { key: 'campaign_signature', group: 'Campagne', label: 'Signature des documents', type: 'text', env: 'CAMPAIGN_SIGNATURE', fallback: () => CAMPAIGN.signature },
  { key: 'hero_kicker', group: 'Campagne', label: 'Accroche du bandeau (au-dessus du titre)', type: 'text', env: 'HERO_KICKER', fallback: () => TEXTS.hero_kicker || '' },
  { key: 'hero_title', group: 'Campagne', label: 'Titre du bandeau', type: 'text', env: 'HERO_TITLE', fallback: () => TEXTS.hero_title || '' },
  { key: 'contact_email', group: 'Contacts', label: 'E-mail du conseil syndical', type: 'email', env: 'CONTACT_EMAIL', fallback: () => envEmail('CONTACT_EMAIL') },
  { key: 'syndic_email', group: 'Contacts', label: 'E-mail du syndic', type: 'email', env: 'SYNDIC_EMAIL', fallback: () => envEmail('SYNDIC_EMAIL') },
  { key: 'paper_contact', group: 'Contacts', label: 'Contact « Pas de smartphone ? » (documents)', type: 'text', env: 'PAPER_CONTACT', fallback: () => TEXTS.paper_contact || '' },
  { key: 'data_controller', group: 'Données personnelles', label: 'Responsable du traitement', type: 'text', env: 'DATA_CONTROLLER', fallback: () => PRIVACY.controller },
  { key: 'publisher', group: 'Mentions légales', label: 'Éditeur du site', type: 'text', env: 'PUBLISHER', fallback: () => LEGAL.publisher },
  { key: 'publication_director', group: 'Mentions légales', label: 'Directeur de la publication', type: 'text', env: 'PUBLICATION_DIRECTOR', fallback: () => LEGAL.publication_director },
  { key: 'publisher_contact', group: 'Mentions légales', label: 'Contact de l\'éditeur', type: 'text', env: 'PUBLISHER_CONTACT', fallback: () => LEGAL.publisher_contact },
  { key: 'host_name', group: 'Mentions légales', label: 'Hébergeur (nom)', type: 'text', env: 'HOST_NAME', fallback: () => LEGAL.host_name },
  { key: 'host_address', group: 'Mentions légales', label: 'Hébergeur (adresse)', type: 'text', env: 'HOST_ADDRESS', fallback: () => LEGAL.host_address },
  { key: 'host_phone', group: 'Mentions légales', label: 'Hébergeur (téléphone)', type: 'text', env: 'HOST_PHONE', fallback: () => LEGAL.host_phone }
];

const BY_KEY = new Map(SETTINGS.map(s => [s.key, s]));
const MAX_LENGTH = 300;

const savedValues = () =>
  Object.fromEntries(db.prepare('SELECT key, value FROM settings').all().map(r => [r.key, r.value]));

/** Default of a setting (environment variable, then instance files) */
const defaultOf = (setting) => (process.env[setting.env] && setting.type !== 'email'
  ? process.env[setting.env].trim()
  : (setting.fallback() || ''));

/**
 * Effective value of a setting
 * @param {string} key
 * @returns {string}
 */
export function getSetting(key) {
  const setting = BY_KEY.get(key);
  if (!setting) throw new Error(`Unknown setting ${key}`);
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? effective(row.value) : defaultOf(setting);
}

/** Every effective value, as { key: value } */
export function getEffectiveSettings() {
  const saved = savedValues();
  return Object.fromEntries(SETTINGS.map(s => [s.key, s.key in saved ? effective(saved[s.key]) : defaultOf(s)]));
}

/** Admin view: definition, saved value and default of each setting */
export function describeSettings() {
  const saved = savedValues();
  return SETTINGS.map(({ key, group, label, type, env }) => ({
    key, group, label, type, env,
    value: key in saved ? saved[key] : null,
    default: defaultOf(BY_KEY.get(key))
  }));
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

/**
 * Save settings from the admin. null or '' removes the saved value (back to the default).
 * @param {Object} changes - { key: value }
 * @param {string} clientIP
 * @returns {{ errors: string[] }}
 */
export function updateSettings(changes, clientIP) {
  const errors = [];
  const toSave = [];
  for (const [key, raw] of Object.entries(changes || {})) {
    const setting = BY_KEY.get(key);
    if (!setting) {
      errors.push(`Réglage inconnu : ${key}`);
      continue;
    }
    const value = raw === null || raw === undefined ? '' : String(raw).trim();
    if (value.length > MAX_LENGTH) errors.push(`${setting.label} : ${MAX_LENGTH} caractères maximum`);
    else if (value && value !== EXPLICIT_EMPTY && setting.type === 'email' && !isEmail(value)) errors.push(`${setting.label} : adresse e-mail invalide`);
    else if (value && value !== EXPLICIT_EMPTY && setting.type === 'date' && !isDate(value)) errors.push(`${setting.label} : date invalide (AAAA-MM-JJ)`);
    else toSave.push([key, value]);
  }
  if (errors.length) return { errors };

  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  const remove = db.prepare('DELETE FROM settings WHERE key = ?');
  db.transaction(() => {
    for (const [key, value] of toSave) {
      if (value) upsert.run(key, value);
      else remove.run(key);
    }
  })();
  logAuditEvent('settings_update', clientIP, { keys: toSave.map(([key]) => key) });
  return { errors: [] };
}
