import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../db.js';

const router = Router();

// Validation rules
const surveyValidation = [
  body('building')
    .trim()
    .notEmpty().withMessage('Le bâtiment est requis')
    .isIn(['A', 'B', 'C', 'D']).withMessage('Bâtiment invalide'),
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
router.post('/', surveyValidation, (req, res) => {
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
    consent_contact
  } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO responses (
        building, apartment, parking_spot, status, has_ev,
        interested, preferred_solution, timeline, comments,
        email, consent_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      consent_contact ? 1 : 0
    );

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
