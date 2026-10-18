import rateLimit from 'express-rate-limit';

// Clients are keyed on req.ip: with `trust proxy` set to the reverse proxy hop
// (index.js), Express takes the address the proxy saw. The first X-Forwarded-For
// entry is not used: any client can forge it to get a fresh quota.
//
// Per-IP limits only stop floods. Mobile carriers put many subscribers behind one
// public IP, so they are kept wide (a whole building may answer at once from the
// same carrier); duplicates are handled per lot, with place codes and anti-bot checks.
const envInt = (name, fallback) => parseInt(process.env[name], 10) || fallback;

// Global API rate limit (page loads make ~4 API calls)
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: envInt('RATE_API_PER_MINUTE', 600),
  message: {
    success: false,
    error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// New survey answers per IP per hour
export const surveyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: envInt('RATE_ANSWERS_PER_HOUR', 30),
  message: {
    success: false,
    error: 'Vous avez atteint la limite de soumissions. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Daily ceiling on new answers per IP (on top of the hourly limit)
export const surveyDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: envInt('RATE_ANSWERS_PER_DAY', 100),
  message: {
    success: false,
    error: 'Vous avez atteint la limite de réponses pour aujourd\'hui. Veuillez réessayer demain.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Reading / editing one's own answer with the edit token: separate quota so that
// "Modifier ma réponse" does not use up the submission limit (the token itself is unguessable)
export const editLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: envInt('RATE_EDITS_PER_HOUR', 60),
  message: {
    success: false,
    error: 'Trop de modifications. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoint limit: 5 attempts per 15 minutes per IP (brute force protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// RGPD request limit: 3 requests per hour per IP (prevent enumeration)
export const rgpdLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: 'Trop de demandes RGPD. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
