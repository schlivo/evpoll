// Parking spot parsing (shared by survey and stats routes)
import { PARKING_SPOTS, LOTS, lotForSpot } from './config.js';

const MAX_SPOTS_PER_RESPONSE = 6;

/**
 * Validate and normalize a parking spot answer ("83, 84" -> "83,84")
 * @param {string} input - Raw value from the form
 * @returns {{ value: string|null, error: string|null }}
 */
export function normalizeParkingSpots(input) {
  const raw = (input ?? '').toString().trim();
  if (!raw) return { value: null, error: null };

  if (!PARKING_SPOTS) {
    if (raw.length > 20) return { value: null, error: 'Numéro de place trop long' };
    return { value: raw, error: null };
  }

  const parts = raw.split(/[,;/\s]+|\bet\b/i).map(p => p.trim()).filter(Boolean);
  const spots = [];
  for (const part of parts) {
    if (!/^\d{1,4}$/.test(part)) {
      return { value: null, error: `Numéro de place invalide : « ${part.slice(0, 10)} »` };
    }
    const n = parseInt(part, 10);
    if (n < 1 || n > PARKING_SPOTS) {
      return { value: null, error: `Les places sont numérotées de 1 à ${PARKING_SPOTS}` };
    }
    if (!spots.includes(n)) spots.push(n);
  }
  if (spots.length > MAX_SPOTS_PER_RESPONSE) {
    return { value: null, error: `${MAX_SPOTS_PER_RESPONSE} places maximum par réponse` };
  }
  spots.sort((a, b) => a - b);
  return { value: spots.join(','), error: null };
}

/**
 * Extract spot numbers from a stored value, tolerant of legacy free text ("P12", "45 et 46")
 * @param {string|null} stored
 * @returns {number[]}
 */
export function extractSpotNumbers(stored) {
  if (!stored) return [];
  const matches = stored.match(/\d+/g) || [];
  return [...new Set(matches.map(Number))]
    .filter(n => n >= 1 && (!PARKING_SPOTS || n <= PARKING_SPOTS));
}

/**
 * Group spot numbers by lot (a double lot counts once)
 * @param {number[]} spots
 * @returns {Array<{ lot: number|null, places: number[], type: string }>} - one entry per lot,
 *   or one entry per spot (lot: null) when no lot table is configured
 */
export function spotsToLots(spots) {
  if (!LOTS.length) return spots.map(p => ({ lot: null, places: [p], type: 'simple' }));
  const byLot = new Map();
  for (const spot of spots) {
    const lot = lotForSpot(spot);
    const key = lot ? lot.lot : `spot-${spot}`;
    if (!byLot.has(key)) byLot.set(key, lot || { lot: null, places: [spot], type: 'simple' });
  }
  return [...byLot.values()];
}
