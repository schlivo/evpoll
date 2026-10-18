// Parking plan, sent by the server only with a printed code when the instance asks for it
// (PLAN_REQUIRES_CODE): the campaign key, or a place code with its spot. A code that
// opened the plan is remembered on this device, so the plan stays visible on return visits.
const STORAGE = 'evpoll_plan_access'

const readStored = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || 'null')
  } catch (e) {
    return null
  }
}

const request = (access) => fetch('/api/plan', {
  headers: access?.code
    ? { 'X-Access-Code': access.code, ...(access.spot ? { 'X-Access-Spot': String(access.spot) } : {}) }
    : {}
})

/**
 * @param {{ code?: string, spot?: string }} [access] - Code at hand (QR code, typed)
 * @returns {Promise<Object|null>} The plan, or null when absent or locked
 */
export async function fetchPlan(access) {
  const stored = readStored()
  const attempts = [access?.code && access, stored?.code && stored, {}].filter(Boolean)
  for (const attempt of attempts) {
    try {
      const response = await request(attempt)
      if (response.ok) {
        if (attempt === access) {
          try { localStorage.setItem(STORAGE, JSON.stringify({ code: access.code, spot: access.spot || '' })) } catch (e) { /* private mode */ }
        }
        return await response.json()
      }
      if (response.status === 403 && attempt === stored) {
        try { localStorage.removeItem(STORAGE) } catch (e) { /* private mode */ }
      }
      if (response.status !== 403) return null
    } catch (e) {
      return null
    }
  }
  return null
}
