import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import db, { logAuditEvent, hashIp, signValue } from '../db.js';
import { surveyLimiter, surveyDailyLimiter, editLimiter } from '../middleware/rateLimiter.js';
import { getClientIP } from '../middleware/auth.js';
import { BUILDING_IDS } from '../config.js';
import { normalizeParkingSpots } from '../parking.js';
import { lotsForParkingSpot, otherAnswersOnLots, verifyCode, editTokenExpiry } from '../lots.js';

const router = Router();

// Minimal time to fill the form (anti-robot, measured by the client)
const MIN_FORM_ELAPSED_MS = 3000;

const CONFLICT_MESSAGE = 'Votre réponse est enregistrée. Une autre réponse existe déjà pour ce lot : le conseil syndical vérifiera.';

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
 * Detect an accidental double submission: same answer from the same IP within 24 hours.
 * Different people on the same lot are never blocked: they become a conflict.
 * @param {string} hash - Submission hash
 * @param {string|null} ipHash - Keyed IP hash
 * @param {boolean} identifiable - Answer has a spot, apartment or email
 * @returns {Object|null} - Duplicate info or null
 */
function checkDuplicate(hash, ipHash, identifiable) {
  if (!identifiable || !ipHash) return null;
  return db.prepare(`
    SELECT id, created_at FROM responses
    WHERE submission_hash = ? AND ip_hash = ?
    AND created_at > datetime('now', '-24 hours')
    ORDER BY created_at DESC
    LIMIT 1
  `).get(hash, ipHash) || null;
}

// Validation rules (shared with the admin paper entry, which sets req.isPaperEntry)
export const surveyValidation = [
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
  // Express and paper answers may skip the status question ('non_renseigne')
  // 'non_renseigne' is what an express answer stores; editing it keeps that value
  body('status')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(['proprietaire', 'locataire', 'non_renseigne']).withMessage('Statut invalide'),
  body('status')
    .if((value, { req }) => !req.body.express && !req.isPaperEntry)
    .isIn(['proprietaire', 'locataire']).withMessage('Statut requis'),
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
    .isBoolean().withMessage('Consentement invalide'),
  body('code')
    .optional({ values: 'falsy' })
    .isString().isLength({ max: 20 }).withMessage('Code invalide')
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

/**
 * Verification level of an answer: 'verifiee' only when it covers exactly one lot
 * and the windshield code matches that lot
 * @param {Array<{ key: string }>} lots - Lots covered by the answer
 * @param {string|undefined} code
 * @returns {'verifiee'|'declarative'|null} - null when no code was given
 */
function checkCode(lots, code) {
  if (!code) return null;
  return lots.length === 1 && verifyCode(lots[0].key, code) ? 'verifiee' : 'declarative';
}

/**
 * Store a new answer without ever overwriting another answer on the same lot
 * (shared by the web form and the admin paper entry)
 * @param {Object} row - Values from toRow()
 * @param {Object} options - { source, verification, express, ipHash, userAgent }
 * @returns {{ id: number, conflict: boolean, editToken: string, createdAt: string }}
 */
export function insertAnswer(row, { source = 'web', verification = 'declarative', express = 0, ipHash = null, userAgent = null }) {
  const lots = lotsForParkingSpot(row.parking_spot);
  const editToken = crypto.randomBytes(16).toString('hex');

  return db.transaction(() => {
    const others = otherAnswersOnLots(lots.map(l => l.key));
    // A verified answer wins over declarative ones: no conflict to settle then
    const verifiedWins = verification === 'verifiee' && !others.some(o => o.verification === 'verifiee');
    const conflict = others.length > 0 && !verifiedWins;

    const result = db.prepare(`
      INSERT INTO responses (
        building, apartment, parking_spot, no_parking, status, has_ev,
        interested, preferred_solution, timeline, comments,
        email, consent_contact, ip_address, user_agent,
        submission_hash, consent_timestamp, express, edit_token_hash,
        review_status, source, verification, ip_hash
      ) VALUES (
        @building, @apartment, @parking_spot, @no_parking, @status, @has_ev,
        @interested, @preferred_solution, @timeline, @comments,
        @email, @consent_contact, NULL, @user_agent,
        @submission_hash, @consent_timestamp, @express, @edit_token_hash,
        @review_status, @source, @verification, @ip_hash
      )
    `).run({
      ...row,
      user_agent: userAgent,
      submission_hash: generateSubmissionHash(row),
      express,
      edit_token_hash: hashToken(editToken),
      // Marker only: conflicts are computed at read time, older answers are left untouched
      review_status: others.length ? 'conflit' : 'ok',
      source,
      verification,
      ip_hash: ipHash
    });
    const { created_at: createdAt } = db.prepare('SELECT created_at FROM responses WHERE id = ?').get(result.lastInsertRowid);
    return { id: Number(result.lastInsertRowid), conflict, editToken, createdAt };
  })();
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

/**
 * Anti-robot checks before validation: honeypot (fake success, nothing stored) and minimal fill time
 */
// ---- Form token: signed server timestamp handed out when the form is displayed.
// It proves the minimum fill time server-side (the client-reported duration can be
// forged) and serves for a single answer.
const FORM_TOKEN_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const usedFormTokens = new Map(); // nonce -> expiry (ms)

setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiry] of usedFormTokens) if (expiry < now) usedFormTokens.delete(nonce);
}, 10 * 60 * 1000).unref();

function issueFormToken() {
  const payload = `${Date.now()}.${crypto.randomBytes(9).toString('hex')}`;
  return `${payload}.${signValue('form', payload)}`;
}

/**
 * @param {string} token
 * @returns {{ status: 'ok'|'too_fast'|'invalid'|'used', nonce?: string, issuedAt?: number }}
 */
function checkFormToken(token) {
  const [issued, nonce, sig] = String(token || '').split('.');
  const issuedAt = Number(issued);
  if (!issued || !nonce || !sig || !Number.isFinite(issuedAt)) return { status: 'invalid' };
  const expected = signValue('form', `${issued}.${nonce}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { status: 'invalid' };
  }
  const age = Date.now() - issuedAt;
  if (age > FORM_TOKEN_MAX_AGE_MS || age < -5000) return { status: 'invalid' };
  if (usedFormTokens.has(nonce)) return { status: 'used' };
  if (age < MIN_FORM_ELAPSED_MS) return { status: 'too_fast' };
  return { status: 'ok', nonce, issuedAt };
}

const markFormTokenUsed = (check) => {
  if (check?.nonce) usedFormTokens.set(check.nonce, check.issuedAt + FORM_TOKEN_MAX_AGE_MS);
};

// GET /api/survey/form-token - Token for the next answer (no personal data)
router.get('/form-token', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ form_token: issueFormToken() });
});

/**
 * True when the answer carries the valid windshield code of the (single) lot it declares.
 * Such answers are bounded by the number of lots, so per-IP limits do not apply to them;
 * a wrong code still goes through the limiters, which also slows down code guessing.
 */
function hasValidPlaceCode(req) {
  if (!req.body?.code || !req.body?.parking_spot) return false;
  const { value } = normalizeParkingSpots(req.body.parking_spot);
  const lots = value ? lotsForParkingSpot(value) : [];
  return lots.length === 1 && verifyCode(lots[0].key, req.body.code);
}

const unlessPlaceCode = (limiter) => (req, res, next) =>
  (hasValidPlaceCode(req) ? next() : limiter(req, res, next));

function antiRobot(req, res, next) {
  const clientIP = getClientIP(req);
  if (req.body.website) {
    logAuditEvent('honeypot', clientIP, {});
    return res.status(201).json({
      success: true,
      id: 0,
      edit_token: crypto.randomBytes(16).toString('hex'),
      edit_token_expires_at: editTokenExpiry(null).toISOString(),
      conflict: false,
      verification: 'declarative',
      message: 'Votre réponse a été enregistrée. Merci de votre participation !'
    });
  }
  const check = checkFormToken(req.body.form_token);
  if (check.status === 'too_fast') {
    logAuditEvent('too_fast', clientIP, {});
    return res.status(400).json({
      success: false,
      error: 'too_fast',
      message: 'Merci de vérifier vos réponses avant d\'envoyer.'
    });
  }
  if (check.status !== 'ok') {
    logAuditEvent('form_token_' + check.status, clientIP, {});
    return res.status(400).json({
      success: false,
      error: 'form_token',
      message: check.status === 'used'
        ? 'Cette réponse a déjà été envoyée.'
        : 'Le formulaire a expiré. Rechargez la page pour répondre.'
    });
  }
  req.formTokenCheck = check;
  next();
}

/**
 * Answer matching an edit token, if the token is still valid
 * @param {number} id
 * @param {string} editToken
 * @returns {Object|null}
 */
function findEditable(id, editToken) {
  if (!editToken) return null;
  const row = db.prepare('SELECT * FROM responses WHERE id = ? AND edit_token_hash = ?').get(id, hashToken(editToken));
  if (!row || editTokenExpiry(row.created_at) < new Date()) return null;
  return row;
}

// POST /api/survey - Submit a survey response (full form or express)
router.post('/', unlessPlaceCode(surveyLimiter), unlessPlaceCode(surveyDailyLimiter), antiRobot, surveyValidation, (req, res) => {
  if (sendValidationErrors(req, res)) return;

  const express = req.body.express ? 1 : 0;
  // Express answers carry no email: consent is only given on the thank-you screen
  const row = toRow(express ? { ...req.body, email: null, consent_contact: false } : req.body);
  const clientIP = getClientIP(req);
  const ipHash = hashIp(clientIP);

  try {
    const identifiable = !!(row.parking_spot || row.apartment || row.email);
    const duplicate = checkDuplicate(generateSubmissionHash(row), ipHash, identifiable);
    if (duplicate) {
      logAuditEvent('duplicate_attempt', clientIP, { building: row.building, original_id: duplicate.id });
      return res.status(409).json({
        success: false,
        error: 'duplicate',
        message: 'Cette réponse vient déjà d\'être enregistrée.'
      });
    }

    const lots = lotsForParkingSpot(row.parking_spot);
    const codeCheck = checkCode(lots, req.body.code);
    if (codeCheck === 'declarative') {
      logAuditEvent('code_mismatch', clientIP, { lots: lots.map(l => l.key) });
    }
    const verification = codeCheck || 'declarative';

    const saved = insertAnswer(row, {
      source: 'web',
      verification,
      express,
      ipHash,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    logAuditEvent('submission', clientIP, {
      response_id: saved.id,
      building: row.building,
      express: !!express,
      has_consent: !!row.consent_contact,
      verification,
      conflict: saved.conflict
    });
    markFormTokenUsed(req.formTokenCheck);

    res.status(201).json({
      success: true,
      id: saved.id,
      edit_token: saved.editToken,
      edit_token_expires_at: editTokenExpiry(saved.createdAt).toISOString(),
      conflict: saved.conflict,
      verification,
      message: saved.conflict
        ? CONFLICT_MESSAGE
        : 'Votre réponse a été enregistrée. Merci de votre participation !'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.'
    });
  }
});

// GET /api/survey/:id - Own answer, to prefill the form (header X-Edit-Token)
router.get('/:id', editLimiter, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = findEditable(id, String(req.headers['x-edit-token'] || ''));
  if (!row) {
    return res.status(403).json({
      success: false,
      message: 'Cette réponse ne peut plus être consultée. Contactez le conseil syndical.'
    });
  }
  const fields = ['parking_spot', 'no_parking', 'building', 'apartment', 'status', 'has_ev', 'interested',
    'preferred_solution', 'timeline', 'comments', 'email', 'consent_contact'];
  const response = Object.fromEntries(fields.map(f => [f, row[f]]));
  response.no_parking = !!row.no_parking;
  response.consent_contact = !!row.consent_contact;
  res.json({ success: true, id, response });
});

// PUT /api/survey/:id - Update one's own answer (edit token valid until the campaign deadline)
router.put('/:id', editLimiter, surveyValidation, (req, res) => {
  if (sendValidationErrors(req, res)) return;

  const id = parseInt(req.params.id, 10);
  const clientIP = getClientIP(req);

  try {
    const existing = findEditable(id, String(req.body.edit_token || ''));
    if (!existing) {
      return res.status(403).json({
        success: false,
        message: 'Cette réponse ne peut plus être modifiée. Contactez le conseil syndical.'
      });
    }

    const row = toRow(req.body);
    const lots = lotsForParkingSpot(row.parking_spot);
    const spotChanged = row.parking_spot !== existing.parking_spot;

    // A new code may verify the answer; a new spot drops the previous verification
    const codeCheck = checkCode(lots, req.body.code);
    if (codeCheck === 'declarative') logAuditEvent('code_mismatch', clientIP, { response_id: id });
    const verification = codeCheck || (spotChanged ? 'declarative' : existing.verification || 'declarative');

    // Admin decisions (suspect, ignoree) are kept; the conflict marker follows the new lots
    let reviewStatus = existing.review_status || 'ok';
    if (spotChanged && ['ok', 'conflit'].includes(reviewStatus)) {
      reviewStatus = otherAnswersOnLots(lots.map(l => l.key), id).length ? 'conflit' : 'ok';
    }

    db.prepare(`
      UPDATE responses SET
        building = @building, apartment = @apartment, parking_spot = @parking_spot,
        no_parking = @no_parking, status = @status, has_ev = @has_ev,
        interested = @interested, preferred_solution = @preferred_solution,
        timeline = @timeline, comments = @comments, email = @email,
        consent_contact = @consent_contact, consent_timestamp = @consent_timestamp,
        submission_hash = @submission_hash, verification = @verification,
        review_status = @review_status
      WHERE id = @id
    `).run({
      ...row,
      submission_hash: generateSubmissionHash(row),
      verification,
      review_status: reviewStatus,
      id
    });

    logAuditEvent('submission_completed', clientIP, {
      response_id: id,
      has_consent: !!row.consent_contact,
      verification
    });

    res.json({
      success: true,
      message: 'Vos réponses ont été mises à jour. Merci !',
      id,
      verification
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.'
    });
  }
});

// PATCH /api/survey/:id/contact - Add an email (with explicit consent) to one's answer,
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

router.patch('/:id/contact', editLimiter, contactValidation, (req, res) => {
  if (sendValidationErrors(req, res)) return;

  const id = parseInt(req.params.id, 10);
  const clientIP = getClientIP(req);

  try {
    if (!findEditable(id, String(req.body.edit_token || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Cette réponse ne peut plus être modifiée. Contactez le conseil syndical.'
      });
    }

    db.prepare(`
      UPDATE responses
      SET email = ?, consent_contact = 1, consent_timestamp = ?
      WHERE id = ?
    `).run(req.body.email, req.body.consent_timestamp || new Date().toISOString(), id);

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

export { toRow };
export default router;
