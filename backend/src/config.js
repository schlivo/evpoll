// Instance configuration.
//
// The common core is generic. Everything specific to one copropriété (name,
// addresses, staircases, parking lots, campaign, privacy notice parameters,
// admin parking plan) comes from an instance directory:
//
//   INSTANCE_DIR/instance.json       (see instances/demo/instance.json)
//   INSTANCE_DIR/plan/parking.json   (optional, admin parking plan coordinates)
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

const instance = (INSTANCE_DIR && readJson(join(INSTANCE_DIR, 'instance.json'))) || {};
if (INSTANCE_DIR && !instance.copro) {
  console.warn(`INSTANCE_DIR set but ${join(INSTANCE_DIR, 'instance.json')} is missing or empty`);
}

const env = (name) => (process.env[name] !== undefined ? process.env[name] : undefined);
const envInt = (name) => parseInt(process.env[name], 10) || null;

export const COPRO = {
  name: env('COPRO_NAME') || instance.copro?.name || 'Ma Copropriété',
  address: instance.copro?.address || '',
  parking_address: instance.copro?.parking_address || ''
};

// Buildings / staircases. Empty BUILDINGS (BUILDINGS=) hides the question;
// unset keeps the instance list, then the demo default.
const envBuildings = env('BUILDINGS');
export const BUILDINGS = envBuildings !== undefined
  ? envBuildings.split(',').map(b => b.trim()).filter(Boolean).map(id => ({ id, label: `Bâtiment ${id}`, address: null }))
  : (instance.buildings || ['A', 'B', 'C', 'D'].map(id => ({ id, label: `Bâtiment ${id}` })))
    .map(b => ({ id: b.id, label: b.label || `Bâtiment ${b.id}`, address: b.adresse ?? b.address ?? null }));

export const BUILDINGS_QUESTION = {
  label: instance.buildings_question?.label || 'Votre bâtiment',
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
