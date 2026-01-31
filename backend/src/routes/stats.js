import { Router } from 'express';
import bcrypt from 'bcrypt';
import db, { logAuditEvent, getAuditLog, cleanupOldRecords } from '../db.js';
import { authLimiter, rgpdLimiter } from '../middleware/rateLimiter.js';
import { generateToken, requireAuth, revokeToken, getClientIP, validateToken } from '../middleware/auth.js';

const router = Router();

// Configuration from environment variables
const TOTAL_LOTS = parseInt(process.env.TOTAL_LOTS, 10) || 75;
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

// GET /api/stats - Get aggregated anonymous statistics
router.get('/', (req, res) => {
  try {
    // Total responses
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM responses');
    const total = totalStmt.get().count;

    // By owner status
    const statusStmt = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM responses
      GROUP BY status
    `);
    const byStatus = Object.fromEntries(
      statusStmt.all().map(row => [row.status, row.count])
    );

    // By EV ownership
    const evStmt = db.prepare(`
      SELECT has_ev, COUNT(*) as count
      FROM responses
      GROUP BY has_ev
    `);
    const hasEv = Object.fromEntries(
      evStmt.all().map(row => [row.has_ev, row.count])
    );

    // By interest level
    const interestStmt = db.prepare(`
      SELECT interested, COUNT(*) as count
      FROM responses
      GROUP BY interested
    `);
    const interest = Object.fromEntries(
      interestStmt.all().map(row => [row.interested, row.count])
    );

    // By preferred solution (only for interested people)
    const solutionStmt = db.prepare(`
      SELECT preferred_solution, COUNT(*) as count
      FROM responses
      WHERE preferred_solution IS NOT NULL AND preferred_solution != ''
      GROUP BY preferred_solution
    `);
    const preferredSolution = Object.fromEntries(
      solutionStmt.all().map(row => [row.preferred_solution, row.count])
    );

    // Count of people with parking spots
    const parkingStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses
      WHERE parking_spot IS NOT NULL AND parking_spot != ''
    `);
    const withParking = parkingStmt.get().count;

    // Count of people with comments
    const commentsStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses
      WHERE comments IS NOT NULL AND comments != ''
    `);
    const withComments = commentsStmt.get().count;

    // Count of people who consented to contact
    const consentStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM responses
      WHERE consent_contact = 1 AND email IS NOT NULL AND email != ''
    `);
    const withConsent = consentStmt.get().count;

    // By building
    const buildingStmt = db.prepare(`
      SELECT building, COUNT(*) as count
      FROM responses
      GROUP BY building
    `);
    const byBuilding = Object.fromEntries(
      buildingStmt.all().map(row => [row.building, row.count])
    );

    // By timeline
    const timelineStmt = db.prepare(`
      SELECT timeline, COUNT(*) as count
      FROM responses
      WHERE timeline IS NOT NULL AND timeline != ''
      GROUP BY timeline
    `);
    const timeline = Object.fromEntries(
      timelineStmt.all().map(row => [row.timeline, row.count])
    );

    res.json({
      total_responses: total,
      total_lots: TOTAL_LOTS,
      participation_rate: Math.round((total / TOTAL_LOTS) * 100 * 10) / 10,
      by_status: byStatus,
      by_building: byBuilding,
      has_ev: hasEv,
      interest: interest,
      preferred_solution: preferredSolution,
      with_parking: withParking,
      with_comments: withComments,
      with_consent: withConsent,
      timeline: timeline
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
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
        status,
        has_ev,
        interested,
        preferred_solution,
        timeline,
        comments,
        email,
        consent_contact
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
      'Bâtiment',
      'Appartement',
      'Place parking',
      'Statut',
      'Véhicule électrique',
      'Intéressé',
      'Solution préférée',
      'Horizon',
      'Commentaires',
      'Email',
      'Consentement contact'
    ];

    // Convert to CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      headers.join(','),
      ...responses.map(r => [
        r.id,
        r.created_at,
        r.building,
        r.apartment,
        r.parking_spot,
        r.status,
        r.has_ev,
        r.interested,
        r.preferred_solution,
        r.timeline,
        escapeCSV(r.comments),
        r.email,
        r.consent_contact ? 'Oui' : 'Non'
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
  const retentionDays = parseInt(req.query.days) || 730;

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
