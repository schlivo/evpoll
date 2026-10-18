// One answer per parking lot: lot keys, read-time conflict resolution,
// statistics built on it, and the hashed windshield codes (one per lot).
//
// Rules (brief §3.8):
// - a lot is the unit of counting; without a lot table, a spot is its own lot;
// - review_status 'ignoree' answers are excluded from everything;
// - 'suspect' answers still make the lot "declared" but never "interested";
// - a lot with >= 2 remaining candidates is in conflict, unless exactly one of
//   them is 'verifiee' (windshield code), which then wins;
// - a lot in conflict is declared but excluded from interest until resolved;
// - answers without a spot are counted apart.
import crypto from 'crypto';
import db from './db.js';
import { LOTS, PARKING_SPOTS, TOTAL_LOTS } from './config.js';
import { getSetting } from './settings.js';
import { extractSpotNumbers, spotsToLots } from './parking.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const EDIT_FALLBACK_DAYS = 30;
const SMALL_GROUP = 5;

/**
 * Stable key of a lot entry from spotsToLots ("145", or "P12" for a spot outside any lot)
 * @param {{ lot: number|null, places: number[] }} entry
 * @returns {string}
 */
export const lotKeyOf = (entry) => (entry.lot !== null && entry.lot !== undefined ? String(entry.lot) : `P${entry.places[0]}`);

/**
 * Lots covered by a stored parking_spot value
 * @param {string|null} parkingSpot
 * @returns {Array<{ key: string, lot: number|null, places: number[], type: string }>}
 */
export function lotsForParkingSpot(parkingSpot) {
  return spotsToLots(extractSpotNumbers(parkingSpot)).map(l => ({ ...l, key: lotKeyOf(l) }));
}

/**
 * Every lot of the instance (lot table, plus numbered spots outside it), sorted by first spot
 * @returns {Array<{ key: string, lot: number|null, places: number[] }>}
 */
export function allLots() {
  const covered = new Set(LOTS.flatMap(l => l.places));
  const singles = [];
  for (let p = 1; p <= (PARKING_SPOTS || 0); p++) {
    if (!covered.has(p)) singles.push({ lot: null, places: [p], type: 'simple' });
  }
  return [...LOTS, ...singles]
    .map(l => ({ key: lotKeyOf(l), lot: l.lot ?? null, places: [...l.places].sort((a, b) => a - b) }))
    .sort((a, b) => a.places[0] - b.places[0]);
}

/**
 * Group answers by lot and decide, for each lot, which answer counts
 * @param {Array<Object>} rows - responses rows (id, parking_spot, review_status, verification, ...)
 * @returns {{ lots: Map<string, Object>, withoutSpot: Object[], counted: Object[], active: Object[] }}
 *   lots: key -> { key, lot, places, active, conflict, retained }
 */
export function resolveLots(rows) {
  const active = rows.filter(r => (r.review_status || 'ok') !== 'ignoree');
  const lots = new Map();
  const withoutSpot = [];

  for (const row of active) {
    const entries = lotsForParkingSpot(row.parking_spot);
    if (!entries.length) {
      withoutSpot.push(row);
      continue;
    }
    for (const entry of entries) {
      if (!lots.has(entry.key)) {
        lots.set(entry.key, { key: entry.key, lot: entry.lot, places: entry.places, active: [] });
      }
      lots.get(entry.key).active.push(row);
    }
  }

  const retainedIds = new Set();
  for (const lot of lots.values()) {
    const candidates = lot.active.filter(r => r.review_status !== 'suspect');
    const verified = candidates.filter(r => r.verification === 'verifiee');
    lot.retained = candidates.length === 1 ? candidates[0]
      : verified.length === 1 ? verified[0]
        : null;
    lot.conflict = candidates.length > 1 && !lot.retained;
    if (lot.retained) retainedIds.add(lot.retained.id);
  }

  // Answers that feed the distributions: one per resolved lot, plus answers without a spot
  const counted = active.filter(r => retainedIds.has(r.id) ||
    (withoutSpot.includes(r) && r.review_status !== 'suspect'));

  return { lots, withoutSpot, counted, active };
}

/** All answers with the fields needed for resolution and statistics */
export const loadResponses = () => db.prepare(`
  SELECT id, created_at, building, apartment, parking_spot, no_parking, status, has_ev,
    interested, preferred_solution, timeline, comments, email, consent_contact, express,
    review_status, source, verification, ip_hash
  FROM responses ORDER BY created_at ASC, id ASC
`).all();

const countBy = (rows, field, fallback = null) => {
  const result = {};
  for (const row of rows) {
    const key = row[field] || fallback;
    if (key === null) continue;
    result[key] = (result[key] || 0) + 1;
  }
  return result;
};

/** Hide small groups in public breakdowns (brief §3.9: threshold of 5) */
const thresholded = (obj) => Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, v < SMALL_GROUP ? 'moins de 5' : v])
);

/** Lot count for display: real lots only when a lot table exists */
const lotCount = (lots) => (LOTS.length ? lots.filter(l => l.lot !== null).length : lots.length);

/**
 * Full statistics for the admin dashboard
 * @returns {Object}
 */
export function computeSummary() {
  const rows = loadResponses();
  const { lots, withoutSpot, counted, active } = resolveLots(rows);
  const lotList = [...lots.values()];
  const declaredSpots = new Set(active.flatMap(r => extractSpotNumbers(r.parking_spot)));
  const interestedLots = lotList.filter(l => l.retained?.interested === 'oui');
  const interest = countBy(counted, 'interested');
  const hasEv = countBy(counted, 'has_ev');

  return {
    total_responses: active.length,
    total_lots: TOTAL_LOTS,
    participation_rate: TOTAL_LOTS ? Math.round((active.length / TOTAL_LOTS) * 1000) / 10 : 0,
    declared_spots: declaredSpots.size,
    parking_spots: PARKING_SPOTS,
    declared_lots: LOTS.length ? lotCount(lotList) : null,
    interested_lots_count: lotCount(interestedLots),
    interested_count: (interest.oui || 0) + (interest['peut-etre'] || 0),
    ev_count: (hasEv.oui || 0) + (hasEv.projet || 0),
    no_parking: active.filter(r => r.no_parking).length,
    without_spot: withoutSpot.length,
    with_parking: active.length - withoutSpot.length,
    by_status: countBy(counted, 'status'),
    by_building: countBy(counted, 'building', 'non_renseigne'),
    has_ev: hasEv,
    interest,
    preferred_solution: countBy(counted, 'preferred_solution'),
    timeline: countBy(counted, 'timeline'),
    express_responses: active.filter(r => r.express).length,
    paper_responses: active.filter(r => r.source === 'papier').length,
    verified_responses: active.filter(r => r.verification === 'verifiee').length,
    with_comments: active.filter(r => r.comments).length,
    with_consent: active.filter(r => r.consent_contact && r.email).length,
    conflict_lots: lotList.filter(l => l.conflict).length,
    suspect_responses: active.filter(r => r.review_status === 'suspect').length,
    ignored_responses: rows.length - active.length
  };
}

/**
 * Public statistics: global totals only, small groups hidden (brief §3.9 point 1)
 * @returns {Object}
 */
export function computePublicStats() {
  const s = computeSummary();
  return {
    total_responses: s.total_responses,
    total_lots: s.total_lots,
    participation_rate: s.participation_rate,
    declared_spots: s.declared_spots,
    declared_lots: s.declared_lots,
    parking_spots: s.parking_spots,
    interested_lots_count: s.interested_lots_count,
    interested_count: s.interested_count,
    ev_count: s.ev_count,
    no_parking: s.no_parking,
    by_building: thresholded(s.by_building)
  };
}

/**
 * Other non-ignored answers sharing a lot with the given lots
 * @param {string[]} lotKeys
 * @param {number|null} excludeId - answer being edited
 * @returns {Object[]}
 */
export function otherAnswersOnLots(lotKeys, excludeId = null) {
  if (!lotKeys.length) return [];
  const wanted = new Set(lotKeys);
  return db.prepare(`
    SELECT id, parking_spot, review_status, verification FROM responses
    WHERE parking_spot IS NOT NULL AND parking_spot != ''
    AND COALESCE(review_status, 'ok') != 'ignoree'
  `).all().filter(r => r.id !== excludeId && lotsForParkingSpot(r.parking_spot).some(l => wanted.has(l.key)));
}

// ============================================
// Windshield codes
// ============================================

/** Canonical form of a typed code ("k7m-4qx" -> "K7M4QX") */
export const normalizeCode = (code) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const hashCode = (lotKey, code) =>
  crypto.createHash('sha256').update(`${lotKey}:${normalizeCode(code)}`).digest('hex');

/** Random code from the unambiguous alphabet */
function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return code;
}

/**
 * Replace every code (invalidates printed windshield flyers)
 * @returns {Array<{ lot: number|null, lot_key: string, places: number[], code: string }>} - the only clear copy
 */
export function regenerateCodes() {
  const lots = allLots();
  if (!lots.length) return [];
  const used = new Set();
  const result = lots.map(l => {
    let code;
    do { code = randomCode(); } while (used.has(code));
    used.add(code);
    return { lot: l.lot, lot_key: l.key, places: l.places, code };
  });
  const insert = db.prepare('INSERT INTO place_codes (lot_key, places, code_hash) VALUES (?, ?, ?)');
  db.transaction(() => {
    db.prepare('DELETE FROM place_codes').run();
    for (const r of result) insert.run(r.lot_key, r.places.join(','), hashCode(r.lot_key, r.code));
  })();
  return result;
}

/** @returns {{ count: number, generated_at: string|null }} */
export function codesStatus() {
  const row = db.prepare('SELECT COUNT(*) AS count, MAX(created_at) AS generated_at FROM place_codes').get();
  return { count: row.count, generated_at: row.generated_at };
}

/**
 * Check a code against the lot it should belong to
 * @param {string} lotKey
 * @param {string} code
 * @returns {boolean}
 */
export function verifyCode(lotKey, code) {
  if (normalizeCode(code).length !== CODE_LENGTH) return false;
  const row = db.prepare('SELECT code_hash FROM place_codes WHERE lot_key = ?').get(lotKey);
  if (!row) return false;
  const expected = Buffer.from(row.code_hash, 'hex');
  const actual = Buffer.from(hashCode(lotKey, code), 'hex');
  return crypto.timingSafeEqual(expected, actual);
}

// ============================================
// Edit token validity
// ============================================

/**
 * End of validity of an edit token: end of the campaign deadline day (server local time,
 * close to Paris time), or EDIT_FALLBACK_DAYS after the answer when no deadline is set
 * @param {string} createdAt - SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS")
 * @returns {Date}
 */
export function editTokenExpiry(createdAt) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(getSetting('campaign_deadline') || '');
  if (match) {
    const end = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59);
    if (!Number.isNaN(end.getTime())) return end;
  }
  const created = createdAt ? new Date(createdAt.replace(' ', 'T') + 'Z') : new Date();
  return new Date(created.getTime() + EDIT_FALLBACK_DAYS * 24 * 60 * 60 * 1000);
}
