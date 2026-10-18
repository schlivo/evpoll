// Instance configuration.
//
// The common core is generic. Everything specific to one copropriété (name,
// addresses, staircases, parking lots, campaign, privacy notice parameters,
// admin parking plan) comes from an instance directory:
//
//   INSTANCE_DIR/instance.json       (see instances/demo/instance.json)
//   INSTANCE_DIR/plan/parking.json   (optional, admin parking plan coordinates)
//
// The physical description (copro, entrances, staircases, parking lots) can
// live in a separate file given by PARKING_CONFIG (same keys: copro,
// buildings, entrances, parking). instance.json values win over it, so
// display texts stay in the instance.
//
// Environment variables still override the matching instance values, so
// existing env-only deployments keep working. Secrets stay in .env only.
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const INSTANCE_DIR = process.env.INSTANCE_DIR ? resolve(process.env.INSTANCE_DIR) : null;

function readJson(path) {
  if (!path || !existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Invalid JSON in ${path}:`, error.message);
    process.exit(1);
  }
}

const instanceFile = (INSTANCE_DIR && readJson(join(INSTANCE_DIR, 'instance.json'))) || {};
if (INSTANCE_DIR && !Object.keys(instanceFile).length) {
  console.warn(`INSTANCE_DIR set but ${join(INSTANCE_DIR, 'instance.json')} is missing or empty`);
}

const PARKING_CONFIG = process.env.PARKING_CONFIG ? resolve(process.env.PARKING_CONFIG) : null;
const parkingFile = readJson(PARKING_CONFIG) || {};
if (PARKING_CONFIG && !Object.keys(parkingFile).length) {
  console.warn(`PARKING_CONFIG set but ${PARKING_CONFIG} is missing or empty`);
}

const instance = {
  ...parkingFile,
  ...instanceFile,
  copro: { ...parkingFile.copro, ...instanceFile.copro }
};

const env = (name) => (process.env[name] !== undefined ? process.env[name] : undefined);
const envInt = (name) => parseInt(process.env[name], 10) || null;

// display_* texts (instance.json) win over the raw addresses of the parking file
export const COPRO = {
  name: env('COPRO_NAME') || instance.copro.name || 'Ma Copropriété',
  address: instance.copro.display_address || instance.copro.address || '',
  parking_address: instance.copro.display_parking_address || instance.copro.parking_address || ''
};

const slug = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Buildings / entrances. Empty BUILDINGS (BUILDINGS=) hides the question;
// unset uses the instance entrances (street addresses), then its buildings,
// then the demo default. The staircase letter of an entrance (`escalier`) is
// never shown to respondents, only in the admin export.
const envBuildings = env('BUILDINGS');
export const BUILDINGS = envBuildings !== undefined
  ? envBuildings.split(',').map(b => b.trim()).filter(Boolean).map(id => ({ id, label: `Bâtiment ${id}`, address: null }))
  : instance.entrances?.length
    ? instance.entrances.map(e => ({
      id: e.id || slug(e.adresse || e.address),
      label: e.label || e.adresse || e.address,
      address: null,
      escalier: e.escalier || null
    }))
    : (instance.buildings || ['A', 'B', 'C', 'D'].map(id => ({ id, label: `Bâtiment ${id}` })))
      .map(b => ({ id: b.id, label: b.label || `Bâtiment ${b.id}`, address: b.adresse ?? b.address ?? null }));

export const BUILDINGS_QUESTION = {
  label: instance.buildings_question?.label || (instance.entrances?.length ? 'Votre entrée' : 'Votre bâtiment'),
  extra_choices: instance.buildings_question?.extra_choices || []
};

// Accepted values for the building field
export const BUILDING_IDS = [
  ...BUILDINGS.map(b => b.id),
  ...BUILDINGS_QUESTION.extra_choices.map(c => c.id)
];

// Parking lots. A lot covers one or more spots (e.g. tandem "double" lots).
export const LOTS = (instance.parking?.lots || []).map(l => ({
  lot: l.lot,
  places: l.places,
  type: l.type || (l.places.length > 1 ? 'double' : 'simple')
}));

const spotToLot = new Map(LOTS.flatMap(l => l.places.map(p => [p, l])));

/** Lot covering a spot number, or null when no lot table is configured */
export const lotForSpot = (spot) => spotToLot.get(spot) || null;

// Number of physical parking spots, numbered 1..PARKING_SPOTS.
// When unset, spot numbers are accepted as free text.
export const PARKING_SPOTS = envInt('PARKING_SPOTS') || instance.parking?.total_places || null;

export const TOTAL_LOTS = envInt('TOTAL_LOTS') || instance.parking?.total_lots || LOTS.length || 75;

export const CAMPAIGN = {
  deadline: env('CAMPAIGN_DEADLINE') || instance.campaign?.deadline || '',
  signature: env('CAMPAIGN_SIGNATURE') || instance.campaign?.signature || 'Le conseil syndical'
};

// Privacy notice parameters: the notice text in the app is generic, these fill it in
export const PRIVACY = {
  controller: env('DATA_CONTROLLER') || instance.privacy?.controller || '',
  host: instance.privacy?.host || '',
  retention_days: envInt('RETENTION_DAYS') || instance.privacy?.retention_days || 730,
  audit_retention_days: envInt('AUDIT_RETENTION_DAYS') || instance.privacy?.audit_retention_days || 365,
  last_updated: instance.privacy?.last_updated || ''
};

// Short instance texts (footer...) shown by the generic views
export const TEXTS = instance.texts || {};

/** Optional admin parking plan: { width, height, spots: { "1": { x, y, w, h } } } */
export function loadParkingPlan() {
  return INSTANCE_DIR ? readJson(join(INSTANCE_DIR, 'plan', 'parking.json')) : null;
}
