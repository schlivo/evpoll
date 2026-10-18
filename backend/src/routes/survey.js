import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import db, { logAuditEvent } from '../db.js';
import { surveyLimiter } from '../middleware/rateLimiter.js';
import { getClientIP } from '../middleware/auth.js';
import { BUILDING_IDS } from '../config.js';
import { normalizeParkingSpots } from '../parking.js';

const router = Router();

// Express answers may be completed with the full form within this window
const EDIT_WINDOW = '-24 hours';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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
    data.status?.toLowerCase().trim(),
    data.parking_spot || ''
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
function checkDuplicate(hash, email, building, identifiable = true) {
  // Check for exact duplicate hash within 24 hours. Answers without any
  // identifying field (spot, apartment, email) all share the same hash,
  // so the check would block unrelated neighbours.
  const hashStmt = db.prepare(`
    SELECT id, created_at FROM responses
    WHERE submission_hash = ?
    AND created_at > datetime('now', '-24 hours')
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const hashDup = identifiable ? hashStmt.get(hash) : null;
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
  body('express')
    .optional()
    .isBoolean().withMessage('Valeur express invalide')
    .toBoolean(),
  body('building')
    .optional({ values: 'falsy' })
    .trim()
    .custom(value => BUILDING_IDS.length === 0 || BUILDING_IDS.includes(value)).withMessage('Bâtiment invalide'),
  body('apartment')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Numéro d\'appartement trop long'),
  body('parking_spot')
    .optional({ values: 'null' })
    .custom(value => {
      const { error } = normalizeParkingSpots(value);
      if (error) throw new Error(error);
      return true;
    }),
  body('no_parking')
    .optional()
    .isBoolean().withMessage('Valeur invalide pour « pas de place »')
    .toBoolean(),
  // Express answers skip the status question and are stored as 'non_renseigne'
  body('status')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['proprietaire', 'locataire']).withMessage('Statut invalide'),
  body('status')
    .if((value, { req }) => !req.body.express)
    .notEmpty().withMessage('Statut requis'),
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
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('consent_contact')
    .optional()
    .isBoolean().withMessage('Consentement invalide')
];

/**
 * Normalize a validated request body into the values stored in the responses table
 * @param {Object} body - Validated request body
 * @returns {Object} - Row values
 */
function toRow(body) {
  const consent = !!body.consent_contact;
  const parkingSpot = normalizeParkingSpots(body.parking_spot).value;
  return {
    building: BUILDING_IDS.length ? (body.building || '') : '',
    apartment: body.apartment || null,
    parking_spot: parkingSpot,
    no_parking: !parkingSpot && body.no_parking ? 1 : 0,
    status: body.status || 'non_renseigne',
    has_ev: body.has_ev,
    interested: body.interested,
    preferred_solution: body.preferred_solution || null,
    timeline: body.timeline || null,
    comments: body.comments || null,
    email: consent ? body.email : null,
    consent_contact: consent ? 1 : 0,
    consent_timestamp: consent && body.consent_timestamp ? body.consent_timestamp : null
  };
}

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({
    success: false,
    errors: errors.array().map(e => e.msg)
  });
  return true;
};

// POST /api/survey - Submit a survey response (full form or express)
router.post('/', surveyLimiter, surveyValidation, (req, res) => {
  if (sendValidationErrors(req, res)) return;

  const express = req.body.express ? 1 : 0;
  // Express answers carry no email: consent is only given on the thank-you screen
  const row = toRow(express ? { ...req.body, email: null, consent_contact: false } : req.body);
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    // Generate submission hash for duplicate detection
    const submissionHash = generateSubmissionHash(row);

    // Check for duplicates
    const identifiable = !!(row.parking_spot || row.apartment || row.email);
    const duplicate = checkDuplicate(submissionHash, row.email, row.building, identifiable);

    if (duplicate) {
      logAuditEvent('duplicate_attempt', clientIP, {
        building: row.building,
        duplicate_type: duplicate.type,
        original_id: duplicate.id
      });

      return res.status(409).json({
        success: false,
        error: 'duplicate',
        message: 'Une réponse similaire a déjà été enregistrée. Si vous souhaitez modifier votre réponse, veuillez contacter le conseil syndical.'
      });
    }

    // One-time token letting the respondent complete an express answer
    const editToken = crypto.randomBytes(16).toString('hex');

    const stmt = db.prepare(`
      INSERT INTO responses (
        building, apartment, parking_spot, no_parking, status, has_ev,
        interested, preferred_solution, timeline, comments,
        email, consent_contact, ip_address, user_agent,
        submission_hash, consent_timestamp, express, edit_token_hash
      ) VALUES (
        @building, @apartment, @parking_spot, @no_parking, @status, @has_ev,
        @interested, @preferred_solution, @timeline, @comments,
        @email, @consent_contact, @ip_address, @user_agent,
        @submission_hash, @consent_timestamp, @express, @edit_token_hash
      )
    `);

    const result = stmt.run({
      ...row,
      ip_address: null,
      user_agent: userAgent,
      submission_hash: submissionHash,
      express,
      edit_token_hash: hashToken(editToken)
    });

    // Log the submission
    logAuditEvent('submission', clientIP, {
      response_id: result.lastInsertRowid,
      building: row.building,
      express: !!express,
      has_consent: !!row.consent_contact
    });

    res.status(201).json({
      success: true,
      message: 'Votre réponse a été enregistrée. Merci de votre participation !',
      id: result.lastInsertRowid,
      edit_token: editToken
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.'
    });
  }
});

// PUT /api/survey/:id - Complete a recent answer (e.g. express) with the full form
router.put('/:id', surveyLimiter, surveyValidation, (req, res) => {
  if (sendValidationErrors(req, res)) return;

  const id = parseInt(req.params.id, 10);
  const editToken = String(req.body.edit_token || '');
  const clientIP = getClientIP(req);

  try {
    const existing = db.prepare(`
      SELECT id FROM responses
      WHERE id = ? AND edit_token_hash = ?
      AND created_at > datetime('now', '${EDIT_WINDOW}')
    `).get(id, hashToken(editToken));

    if (!existing) {
      return res.status(403).json({
        success: false,
        message: 'Cette réponse ne peut plus être complétée. Contactez le conseil syndical pour la modifier.'
      });
    }

    const row = toRow(req.body);
    db.prepare(`
      UPDATE responses SET
        building = @building, apartment = @apartment, parking_spot = @parking_spot,
        no_parking = @no_parking, status = @status, has_ev = @has_ev,
        interested = @interested, preferred_solution = @preferred_solution,
        timeline = @timeline, comments = @comments, email = @email,
        consent_contact = @consent_contact, consent_timestamp = @consent_timestamp,
        submission_hash = @submission_hash
      WHERE id = @id
    `).run({ ...row, submission_hash: generateSubmissionHash(row), id });

    logAuditEvent('submission_completed', clientIP, {
      response_id: id,
      has_consent: !!row.consent_contact
    });

    res.json({
      success: true,
      message: 'Vos réponses ont été complétées. Merci !',
      id
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.'
    });
  }
});

// PATCH /api/survey/:id/contact - Add an email (with explicit consent) to a recent answer,
// e.g. from the thank-you screen of an express answer. Only touches the contact fields.
const contactValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('consent_contact')
    .custom(value => value === true || value === 'true').withMessage('Le consentement est requis pour enregistrer votre email'),
  body('consent_timestamp')
    .optional()
    .isISO8601().withMessage('Date de consentement invalide')
];

router.patch('/:id/contact', surveyLimiter, contactValidation, (req, res) => {
  if (sendValidationErrors(req, res)) return;

  const id = parseInt(req.params.id, 10);
  const editToken = String(req.body.edit_token || '');
  const clientIP = getClientIP(req);

  try {
    const result = db.prepare(`
      UPDATE responses
      SET email = ?, consent_contact = 1, consent_timestamp = ?
      WHERE id = ? AND edit_token_hash = ?
      AND created_at > datetime('now', '${EDIT_WINDOW}')
    `).run(req.body.email, req.body.consent_timestamp || new Date().toISOString(), id, hashToken(editToken));

    if (result.changes === 0) {
      return res.status(403).json({
        success: false,
        message: 'Cette réponse ne peut plus être modifiée. Contactez le conseil syndical.'
      });
    }

    logAuditEvent('contact_added', clientIP, { response_id: id });

    res.json({
      success: true,
      message: 'C\'est noté : vous serez informé de la suite du projet.'
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
