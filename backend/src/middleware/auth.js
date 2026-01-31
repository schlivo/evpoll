import { v4 as uuidv4 } from 'uuid';

// In-memory token store with expiration
// Map<token, { expiresAt: Date, ip: string }>
const tokens = new Map();

const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

// Clean expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokens.entries()) {
    if (data.expiresAt < now) {
      tokens.delete(token);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

/**
 * Generate a new session token
 * @param {string} ip - Client IP address
 * @returns {Object} - Token and expiration info
 */
export function generateToken(ip) {
  const token = uuidv4();
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

  tokens.set(token, {
    expiresAt,
    ip,
    createdAt: Date.now()
  });

  return {
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    expiresIn: TOKEN_EXPIRY_MS / 1000 // seconds
  };
}

/**
 * Validate a session token
 * @param {string} token - Token to validate
 * @returns {boolean} - Whether token is valid
 */
export function validateToken(token) {
  if (!token) return false;

  const data = tokens.get(token);
  if (!data) return false;

  if (data.expiresAt < Date.now()) {
    tokens.delete(token);
    return false;
  }

  return true;
}

/**
 * Revoke a session token (logout)
 * @param {string} token - Token to revoke
 */
export function revokeToken(token) {
  tokens.delete(token);
}

/**
 * Get client IP from request
 * @param {Request} req - Express request
 * @returns {string} - Client IP address
 */
export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
}

/**
 * Middleware to require valid authentication token
 * Expects Authorization: Bearer <token> header
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!validateToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'Session expirée ou invalide'
    });
  }

  // Attach token to request for potential logging
  req.authToken = token;
  next();
}

/**
 * Get all active tokens count (for monitoring)
 * @returns {number} - Number of active tokens
 */
export function getActiveTokenCount() {
  return tokens.size;
}
