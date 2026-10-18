import rateLimit from 'express-rate-limit';

// Global API rate limit: 100 requests per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For in production (behind reverse proxy)
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
});

// Survey submission limit: 5 submissions per hour per IP
export const surveyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'Vous avez atteint la limite de soumissions. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
});

// Daily ceiling on new answers: 10 per 24 hours per IP (on top of the hourly limit)
export const surveyDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: {
    success: false,
    error: 'Vous avez atteint la limite de réponses pour aujourd\'hui. Veuillez réessayer demain.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
});

// Reading / editing one's own answer with the edit token: separate, wider quota so that
// "Modifier ma réponse" does not use up the submission limit (the token itself is unguessable)
export const editLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    error: 'Trop de modifications. Veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
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
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  },
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
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
});
