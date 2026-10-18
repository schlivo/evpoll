import { Router } from 'express';
import bcrypt from 'bcrypt';
import db, { logAuditEvent, getAuditLog, cleanupOldRecords } from '../db.js';
import { authLimiter, rgpdLimiter } from '../middleware/rateLimiter.js';
import { generateToken, requireAuth, revokeToken, getClientIP, validateToken } from '../middleware/auth.js';
import { TOTAL_LOTS, PARKING_SPOTS, LOTS, PRIVACY, BUILDINGS, BUILDINGS_QUESTION, loadParkingPlan } from '../config.js';
import { extractSpotNumbers } from '../parking.js';
import {
  computeSummary, computePublicStats, loadResponses, resolveLots, regenerateCodes, codesStatus
} from '../lots.js';
import { surveyValidation, toRow, insertAnswer } from './survey.js';
import { validationResult } from 'express-validator';

const router = Router();

// Configuration from environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'irve2024';

// Hash the admin password on startup
let hashedPassword = null;
(async () => {
  hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
})();

// POST /api/stats/auth - Authenticate admin and return token
router.post('/auth', authLimiter, async (req, res) => {
  const { password } = req.body;
  const clientIP = getClientIP(req);

  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Mot de passe requis'
    });
  }

  try {
    // Compare with bcrypt
    const isValid = await bcrypt.compare(password, hashedPassword);

    if (isValid) {
      const tokenData = generateToken(clientIP);

      logAuditEvent('login', clientIP, { success: true });

      res.json({
        success: true,
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        expiresIn: tokenData.expiresIn
      });
    } else {
      logAuditEvent('login', clientIP, { success: false });

      res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect'
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur d\'authentification'
    });
  }
});

// POST /api/stats/logout - Revoke session token
router.post('/logout', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);
  revokeToken(req.authToken);

  logAuditEvent('logout', clientIP, {});

  res.json({ success: true });
});

// GET /api/stats/counter - Public campaign counter (no personal data)
router.get('/counter', (req, res) => {
  try {
    const s = computeSummary();
    res.json({
      declared_spots: s.declared_spots,
      parking_spots: PARKING_SPOTS,
      declared_lots: s.declared_lots,
      total_lots: LOTS.length ? TOTAL_LOTS : null
    });
  } catch (error) {
    console.error('Counter error:', error);
    res.status(500).json({ success: false });
  }
});

// GET /api/stats - Public statistics: global totals only, groups under 5 hidden
router.get('/', (req, res) => {
  try {
    res.json(computePublicStats());
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/stats/admin/summary - Full statistics for the dashboard (one answer per lot)
router.get('/admin/summary', requireAuth, (req, res) => {
  try {
    res.json({ success: true, ...computeSummary() });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// GET /api/stats/export - Export responses as CSV (protected)
export function handleExportCSV(req, res) {
  const authHeader = req.headers.authorization;
  const clientIP = getClientIP(req);

  // Require Bearer token authentication
  if (!authHeader?.startsWith('Bearer ')) {
    logAuditEvent('export_denied', clientIP, { reason: 'missing_token' });
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const token = authHeader.slice(7);
  if (!validateToken(token)) {
    logAuditEvent('export_denied', clientIP, { reason: 'invalid_token' });
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const stmt = db.prepare(`
      SELECT
        id,
        created_at,
        building,
        apartment,
        parking_spot,
        no_parking,
        status,
        has_ev,
        interested,
        preferred_solution,
        timeline,
        comments,
        email,
        consent_contact,
        express,
        source,
        verification,
        review_status
      FROM responses
      ORDER BY created_at DESC
    `);
    const responses = stmt.all();

    // Log the export
    logAuditEvent('export', clientIP, {
      record_count: responses.length
    });

    // CSV header
    const headers = [
      'ID',
      'Date',
      'Bâtiment / entrée',
      'Escalier',
      'Appartement',
      'Place parking',
      'Pas de place',
      'Statut',
      'Véhicule électrique',
      'Intéressé',
      'Solution préférée',
      'Horizon',
      'Commentaires',
      'Email',
      'Consentement contact',
      'Réponse express',
      'Source',
      'Vérification',
      'Revue'
    ];

    // Convert to CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      let str = String(value);
      // Prevent CSV injection: prefix formula characters with single quote
      // Excel/LibreOffice interpret =, @, +, - as formula starters
      if (/^[=@+\-]/.test(str)) {
        str = "'" + str;
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes("'")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Export shows the entrance label and, when known, its staircase letter
    const buildingById = new Map(BUILDINGS.map(b => [b.id, b]));
    const extraById = new Map(BUILDINGS_QUESTION.extra_choices.map(c => [c.id, c.label]));
    const buildingLabel = (id) => buildingById.get(id)?.label || extraById.get(id) || id;

    const csvRows = [
      headers.join(','),
      ...responses.map(r => [
        r.id,
        r.created_at,
        escapeCSV(buildingLabel(r.building)),
        buildingById.get(r.building)?.escalier || '',
        r.apartment,
        escapeCSV(r.parking_spot),
        r.no_parking ? 'Oui' : 'Non',
        r.status,
        r.has_ev,
        r.interested,
        r.preferred_solution,
        r.timeline,
        escapeCSV(r.comments),
        r.email,
        r.consent_contact ? 'Oui' : 'Non',
        r.express ? 'Oui' : 'Non',
        r.source || 'web',
        r.verification || 'declarative',
        r.review_status || 'ok'
      ].join(','))
    ];

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="enquete-irve-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
}

router.get('/export', handleExportCSV);

// ============================================
// ADMIN ENDPOINTS (require authentication)
// ============================================

// GET /api/stats/admin/audit - View audit log
router.get('/admin/audit', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const logs = getAuditLog(limit, offset);

    logAuditEvent('audit_view', clientIP, { limit, offset });

    res.json({
      success: true,
      logs: logs.map(log => ({
        ...log,
        details: JSON.parse(log.details || '{}')
      })),
      pagination: { limit, offset }
    });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs'
    });
  }
});

// GET /api/stats/admin/spots - Declared parking spots with interest (for Enedis list)
router.get('/admin/spots', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);

  try {
    const { lots, active } = resolveLots(loadResponses());
    const lotBySpot = new Map([...lots.values()].flatMap(l => l.places.map(p => [p, l])));

    const bySpot = new Map();
    const unrecognized = [];
    for (const row of active) {
      if (!row.parking_spot) continue;
      const numbers = extractSpotNumbers(row.parking_spot);
      if (numbers.length === 0) {
        unrecognized.push({ id: row.id, value: row.parking_spot, interested: row.interested });
      }
      for (const spot of numbers) {
        if (!bySpot.has(spot)) bySpot.set(spot, []);
        const lot = lotBySpot.get(spot);
        bySpot.get(spot).push({
          id: row.id,
          interested: row.interested,
          has_ev: row.has_ev,
          status: row.status,
          source: row.source || 'web',
          verification: row.verification || 'declarative',
          review_status: row.review_status || 'ok',
          retained: lot?.retained?.id === row.id
        });
      }
    }

    const spots = [...bySpot.entries()]
      .sort(([a], [b]) => a - b)
      .map(([spot, responses]) => ({
        spot,
        lot_key: lotBySpot.get(spot)?.key || null,
        conflict: !!lotBySpot.get(spot)?.conflict,
        responses
      }));

    // Lots whose retained answer is "oui" (list for the Enedis quote-part and sizing);
    // lots in conflict are left out until the admin settles them
    const lotList = [...lots.values()].sort((a, b) => a.places[0] - b.places[0]);
    const interestedLots = lotList
      .filter(l => l.retained?.interested === 'oui' && (l.lot !== null || !LOTS.length))
      .map(l => ({ lot: l.lot, lot_key: l.key, places: l.places }));

    logAuditEvent('spots_view', clientIP, { spot_count: spots.length });

    res.json({
      success: true,
      parking_spots: PARKING_SPOTS,
      total_lots: TOTAL_LOTS,
      spots,
      interested_lots: interestedLots,
      conflict_lots: lotList.filter(l => l.conflict).map(l => ({ lot: l.lot, lot_key: l.key, places: l.places })),
      unrecognized
    });
  } catch (error) {
    console.error('Spots error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des places'
    });
  }
});

// GET /api/stats/admin/conflicts - Lots with at least two non-ignored answers
router.get('/admin/conflicts', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);

  try {
    const { lots } = resolveLots(loadResponses());
    const toTime = (d) => new Date(String(d).replace(' ', 'T') + 'Z').getTime();
    const conflicts = [...lots.values()]
      .filter(l => l.active.length >= 2)
      .sort((a, b) => a.places[0] - b.places[0])
      .map(l => {
        const times = l.active.map(r => toTime(r.created_at));
        const ipHashes = l.active.map(r => r.ip_hash).filter(Boolean);
        // Same IP: at least two answers of the lot share an IP hash (null hashes never match)
        const sameIp = ipHashes.length !== new Set(ipHashes).size;
        return {
          lot: l.lot,
          lot_key: l.key,
          places: l.places,
          unresolved: l.conflict,
          retained_id: l.retained?.id || null,
          same_ip: sameIp,
          delay_minutes: Math.round((Math.max(...times) - Math.min(...times)) / 60000),
          responses: l.active.map(r => ({
            id: r.id,
            created_at: r.created_at,
            source: r.source || 'web',
            verification: r.verification || 'declarative',
            review_status: r.review_status || 'ok',
            has_ev: r.has_ev,
            interested: r.interested,
            status: r.status,
            // Answers of this lot sharing this answer's IP hash
            same_ip_as: r.ip_hash ? l.active.filter(o => o.id !== r.id && o.ip_hash === r.ip_hash).map(o => o.id) : []
          }))
        };
      });

    logAuditEvent('conflicts_view', clientIP, { lot_count: conflicts.length });

    res.json({ success: true, conflicts });
  } catch (error) {
    console.error('Conflicts error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des conflits'
    });
  }
});

// POST /api/stats/admin/conflicts/:lot - Settle a conflict
// body { action: 'keep', keep_id } | { action: 'suspect', id } | { action: 'ignore', id }
router.post('/admin/conflicts/:lot', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);
  const lotKey = String(req.params.lot);
  const { action } = req.body;

  try {
    const lot = resolveLots(loadResponses()).lots.get(lotKey);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Lot sans réponse' });
    }
    const ids = lot.active.map(r => r.id);
    const targetId = parseInt(action === 'keep' ? req.body.keep_id : req.body.id, 10);
    if (!['keep', 'suspect', 'ignore'].includes(action) || !ids.includes(targetId)) {
      return res.status(400).json({ success: false, error: 'Action ou réponse invalide pour ce lot' });
    }

    const setStatus = db.prepare('UPDATE responses SET review_status = ? WHERE id = ?');
    let changes;
    db.transaction(() => {
      if (action === 'keep') {
        setStatus.run('ok', targetId);
        ids.filter(id => id !== targetId).forEach(id => setStatus.run('ignoree', id));
        changes = ids.map(id => ({ id, review_status: id === targetId ? 'ok' : 'ignoree' }));
      } else {
        const status = action === 'suspect' ? 'suspect' : 'ignoree';
        setStatus.run(status, targetId);
        changes = [{ id: targetId, review_status: status }];
      }
    })();

    logAuditEvent('conflict_' + action, clientIP, { lot: lotKey, changes });

    res.json({ success: true, lot: lotKey, changes });
  } catch (error) {
    console.error('Conflict action error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du conflit'
    });
  }
});

// POST /api/stats/admin/paper - Enter a paper answer (same lot and conflict rules as the web form)
router.post('/admin/paper', requireAuth, (req, res, next) => {
  req.isPaperEntry = true;
  next();
}, surveyValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
  }
  const clientIP = getClientIP(req);

  try {
    const row = toRow({ ...req.body, email: null, consent_contact: false });
    const saved = insertAnswer(row, { source: 'papier', verification: 'declarative', userAgent: 'saisie papier' });

    logAuditEvent('paper_entry', clientIP, { response_id: saved.id, conflict: saved.conflict });

    res.status(201).json({
      success: true,
      id: saved.id,
      conflict: saved.conflict,
      message: saved.conflict
        ? 'Réponse papier enregistrée. Une autre réponse existe déjà pour ce lot : voir « Conflits ».'
        : 'Réponse papier enregistrée.'
    });
  } catch (error) {
    console.error('Paper entry error:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement' });
  }
});

// GET /api/stats/admin/codes/status - Windshield codes status (never the codes themselves)
router.get('/admin/codes/status', requireAuth, (req, res) => {
  res.json({ success: true, ...codesStatus() });
});

// POST /api/stats/admin/codes/regenerate - New code for every lot. The clear list is returned
// once and never stored: printed windshield flyers become invalid.
router.post('/admin/codes/regenerate', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);

  try {
    const codes = regenerateCodes();
    if (!codes.length) {
      return res.status(400).json({ success: false, error: 'Aucune place configurée pour cette instance' });
    }
    logAuditEvent('codes_regenerated', clientIP, { count: codes.length });
    res.json({ success: true, generated_at: codesStatus().generated_at, codes });
  } catch (error) {
    console.error('Codes error:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la génération des codes' });
  }
});

// GET /api/stats/admin/plan - Parking lots and optional plan coordinates for the admin map
router.get('/admin/plan', requireAuth, (req, res) => {
  res.json({
    success: true,
    parking_spots: PARKING_SPOTS,
    lots: LOTS,
    plan: loadParkingPlan()
  });
});

// GET /api/stats/admin/duplicates - View potential duplicate submissions
router.get('/admin/duplicates', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);

  try {
    // Find submissions with same email and building
    const stmt = db.prepare(`
      SELECT
        email,
        building,
        COUNT(*) as count,
        GROUP_CONCAT(id) as ids,
        MIN(created_at) as first_submission,
        MAX(created_at) as last_submission
      FROM responses
      WHERE email IS NOT NULL AND email != ''
      GROUP BY email, building
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    const duplicates = stmt.all();

    logAuditEvent('duplicates_view', clientIP, {
      duplicate_groups: duplicates.length
    });

    res.json({
      success: true,
      duplicates: duplicates.map(d => ({
        ...d,
        ids: d.ids.split(',').map(Number)
      }))
    });
  } catch (error) {
    console.error('Duplicates error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche de doublons'
    });
  }
});

// DELETE /api/stats/admin/cleanup - Manual cleanup trigger
router.delete('/admin/cleanup', requireAuth, (req, res) => {
  const clientIP = getClientIP(req);
  const retentionDays = parseInt(req.query.days) || PRIVACY.retention_days;

  try {
    const deletedCount = cleanupOldRecords(retentionDays);

    logAuditEvent('manual_cleanup', clientIP, {
      retention_days: retentionDays,
      deleted_count: deletedCount
    });

    res.json({
      success: true,
      deleted_count: deletedCount,
      retention_days: retentionDays
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage'
    });
  }
});

// ============================================
// RGPD ENDPOINTS (public access with email verification)
// ============================================

// POST /api/stats/rgpd/request - Request data access or deletion
// Rate limited to prevent email enumeration
router.post('/rgpd/request', rgpdLimiter, (req, res) => {
  const { email, type } = req.body; // type: 'access' or 'delete'
  const clientIP = getClientIP(req);

  if (!email || !['access', 'delete'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Email et type de demande requis (access ou delete)'
    });
  }

  try {
    // Check if email exists in database
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM responses
      WHERE email = ?
    `);
    const result = stmt.get(email.toLowerCase().trim());

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucune donnée trouvée pour cet email'
      });
    }

    logAuditEvent('rgpd_request', clientIP, {
      email: email.substring(0, 3) + '***', // Partial email for privacy
      type,
      records_found: result.count
    });

    // In a real implementation, this would send a verification email
    // For now, we just acknowledge the request
    res.json({
      success: true,
      message: type === 'access'
        ? 'Votre demande d\'accès a été enregistrée. Vous recevrez vos données par email.'
        : 'Votre demande de suppression a été enregistrée. Elle sera traitée sous 30 jours.',
      records_found: result.count
    });
  } catch (error) {
    console.error('RGPD request error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de la demande'
    });
  }
});

// GET /api/stats/rgpd/export/:email - Export personal data
// Protected by admin auth - admin handles RGPD requests manually
router.get('/rgpd/export/:email', requireAuth, (req, res) => {
  const { email } = req.params;
  const clientIP = getClientIP(req);

  try {
    const stmt = db.prepare(`
      SELECT
        created_at,
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
      FROM responses
      WHERE email = ?
      ORDER BY created_at DESC
    `);
    const records = stmt.all(email.toLowerCase().trim());

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucune donnée trouvée'
      });
    }

    logAuditEvent('rgpd_export', clientIP, {
      email: email.substring(0, 3) + '***',
      records_exported: records.length
    });

    res.json({
      success: true,
      data: records,
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('RGPD export error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'export'
    });
  }
});

// DELETE /api/stats/rgpd/delete/:email - Delete personal data
// Protected by admin auth - admin handles RGPD requests manually
router.delete('/rgpd/delete/:email', requireAuth, (req, res) => {
  const { email } = req.params;
  const clientIP = getClientIP(req);

  try {
    // First count records to delete
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM responses WHERE email = ?
    `);
    const countResult = countStmt.get(email.toLowerCase().trim());

    if (countResult.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucune donnée trouvée'
      });
    }

    // Delete records
    const deleteStmt = db.prepare(`
      DELETE FROM responses WHERE email = ?
    `);
    deleteStmt.run(email.toLowerCase().trim());

    logAuditEvent('rgpd_delete', clientIP, {
      email: email.substring(0, 3) + '***',
      records_deleted: countResult.count
    });

    res.json({
      success: true,
      message: 'Vos données ont été supprimées',
      records_deleted: countResult.count
    });
  } catch (error) {
    console.error('RGPD delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression'
    });
  }
});

// POST /api/stats/rgpd/withdraw-consent - Withdraw contact consent
// Protected by admin auth - admin handles consent withdrawal requests manually
router.post('/rgpd/withdraw-consent', requireAuth, (req, res) => {
  const { email } = req.body;
  const clientIP = getClientIP(req);

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email requis'
    });
  }

  try {
    const updateStmt = db.prepare(`
      UPDATE responses
      SET consent_contact = 0, email = NULL
      WHERE email = ?
    `);
    const result = updateStmt.run(email.toLowerCase().trim());

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucune donnée trouvée pour cet email'
      });
    }

    logAuditEvent('consent_withdrawn', clientIP, {
      email: email.substring(0, 3) + '***',
      records_updated: result.changes
    });

    res.json({
      success: true,
      message: 'Votre consentement a été retiré et votre email supprimé',
      records_updated: result.changes
    });
  } catch (error) {
    console.error('Consent withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du retrait du consentement'
    });
  }
});

export default router;
