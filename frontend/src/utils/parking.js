// Client-side mirror of backend/src/parking.js (the server re-validates)

/**
 * Validate a parking spot answer ("83, 84")
 * @param {string} input - Raw value typed by the respondent
 * @param {number|null} maxSpot - Highest spot number, or null for free text
 * @returns {string|null} - Error message, or null when valid
 */
export function parkingSpotError(input, maxSpot) {
  const raw = (input || '').trim()
  if (!raw) return null
  if (!maxSpot) return raw.length > 20 ? 'Numéro de place trop long' : null

  const parts = raw.split(/[,;/\s]+|\bet\b/i).map(p => p.trim()).filter(Boolean)
  for (const part of parts) {
    if (!/^\d{1,4}$/.test(part)) return `« ${part} » n'est pas un numéro de place`
    const n = parseInt(part, 10)
    if (n < 1 || n > maxSpot) return `Les places sont numérotées de 1 à ${maxSpot}`
  }
  if (new Set(parts).size > 6) return '6 places maximum par réponse'
  return null
}
