import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import db, { logAuditEvent } from '../db.js';
import { surveyLimiter } from '../middleware/rateLimiter.js';
import { getClientIP } from '../middleware/auth.js';

const router = Router();

// Configuration from environment variables
const BUILDINGS = (process.env.BUILDINGS || 'A,B,C,D').split(',').map(b => b.trim());

/**
 * Generate a hash from submission data for duplicate detection
 * @param {Object} data - Survey data
 * @returns {string} - SHA256 hash
 */
function generateSubmissionHash(data) {
  const normalized = [
    data.building?.toLowerCase().trim(),
    data.apartment?.toLowerCase().trim() || '',
    data.email?.toLowerCase().trim() || '',
    data.status?.toLowerCase().trim()
  ].join('|');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Check for duplicate submissions
 * @param {string} hash - Submission hash
 * @param {string} email - Email address (optional)
 * @param {string} building - Building identifier
 * @returns {Object|null} - Duplicate info or null
 */
function checkDuplicate(hash, email, building) {
  // Check for exact duplicate hash within 24 hours
  const hashStmt = db.prepare(`
    SELECT id, created_at FROM responses
    WHERE submission_hash = ?
    AND created_at > datetime('now', '-24 hours')
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const hashDup = hashStmt.get(hash);
  if (hashDup) {
    return { type: 'exact', id: hashDup.id, created_at: hashDup.created_at };
  }

  // Check for same email + building within 7 days (if email provided)
  if (email) {
    const emailStmt = db.prepare(`
      SELECT id, created_at FROM responses
      WHERE email = ? AND building = ?
      AND created_at > datetime('now', '-7 days')
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const emailDup = emailStmt.get(email.toLowerCase().trim(), building);
    if (emailDup) {
      return { type: 'email_building', id: emailDup.id, created_at: emailDup.created_at };
    }
  }

  return null;
}

// Validation rules
const surveyValidation = [
  body('building')
    .trim()
    .notEmpty().withMessage('Le bâtiment est requis')
    .isIn(BUILDINGS).withMessage('Bâtiment invalide'),
  body('apartment')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Numéro d\'appartement trop long'),
  body('parking_spot')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Numéro de place trop long'),
  body('status')
    .trim()
    .isIn(['proprietaire', 'locataire']).withMessage('Statut invalide'),
  body('has_ev')
    .trim()
    .isIn(['oui', 'non', 'projet']).withMessage('Valeur invalide pour véhicule électrique'),
  body('interested')
    .trim()
    .isIn(['oui', 'peut-etre', 'non']).withMessage('Valeur invalide pour intérêt'),
  body('preferred_solution')
    .optional()
    .trim()
    .isIn(['enedis', 'operateur', 'individuelle', 'sans_avis', '']).withMessage('Solution invalide'),
  body('timeline')
    .optional()
    .trim()
    .isIn(['6mois', '1an', '2ans', 'plus', '']).withMessage('Délai invalide'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Commentaire trop long'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('consent_contact')
    .optional()
    .isBoolean().withMessage('Consentement invalide')
];

// POST /api/survey - Submit a survey response
router.post('/', surveyLimiter, surveyValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => e.msg)
    });
  }

  const {
    building,
    apartment,
    parking_spot,
    status,
    has_ev,
    interested,
    preferred_solution,
    timeline,
    comments,
    email,
    consent_contact,
    consent_timestamp
  } = req.body;

  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    // Generate submission hash for duplicate detection
    const submissionHash = generateSubmissionHash({
      building,
      apartment,
      email: consent_contact ? email : null,
      status
    });

    // Check for duplicates
    const duplicate = checkDuplicate(
      submissionHash,
      consent_contact ? email : null,
      building
    );

    if (duplicate) {
      logAuditEvent('duplicate_attempt', clientIP, {
        building,
        duplicate_type: duplicate.type,
        original_id: duplicate.id
      });

      return res.status(409).json({
        success: false,
        error: 'duplicate',
        message: 'Une réponse similaire a déjà été enregistrée. Si vous souhaitez modifier votre réponse, veuillez contacter le conseil syndical.'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO responses (
        building, apartment, parking_spot, status, has_ev,
        interested, preferred_solution, timeline, comments,
        email, consent_contact, ip_address, user_agent,
        submission_hash, consent_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      building,
      apartment || null,
      parking_spot || null,
      status,
      has_ev,
      interested,
      preferred_solution || null,
      timeline || null,
      comments || null,
      consent_contact ? email : null,
      consent_contact ? 1 : 0,
      clientIP,
      userAgent,
      submissionHash,
      consent_contact && consent_timestamp ? consent_timestamp : null
    );

    // Log the submission
    logAuditEvent('submission', clientIP, {
      response_id: result.lastInsertRowid,
      building,
      has_consent: !!consent_contact
    });

    res.status(201).json({
      success: true,
      message: 'Votre réponse a été enregistrée. Merci de votre participation !',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.'
    });
  }
});

export default router;
