import Database from 'better-sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PRIVACY } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../data/survey.db');

const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Identification
    building TEXT NOT NULL,
    apartment TEXT,
    parking_spot TEXT,
    status TEXT NOT NULL,

    -- Situation actuelle
    has_ev TEXT NOT NULL,

    -- Intérêt IRVE
    interested TEXT NOT NULL,
    preferred_solution TEXT,
    timeline TEXT,
    comments TEXT,

    -- Contact (optionnel)
    email TEXT,
    consent_contact INTEGER DEFAULT 0,

    -- Security & RGPD fields
    ip_address TEXT,
    user_agent TEXT,
    submission_hash TEXT,
    consent_timestamp TEXT
  )
`);

// Create audit log table for RGPD compliance
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    details TEXT
  )
`);

// Add columns if they don't exist (for existing databases)
const addColumnIfNotExists = (table, column, type) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch (e) {
    // Column already exists, ignore
  }
};

addColumnIfNotExists('responses', 'ip_address', 'TEXT');
addColumnIfNotExists('responses', 'user_agent', 'TEXT');
addColumnIfNotExists('responses', 'submission_hash', 'TEXT');
addColumnIfNotExists('responses', 'consent_timestamp', 'TEXT');
addColumnIfNotExists('responses', 'no_parking', 'INTEGER DEFAULT 0');
addColumnIfNotExists('responses', 'express', 'INTEGER DEFAULT 0');
addColumnIfNotExists('responses', 'edit_token_hash', 'TEXT');
// One answer per lot: conflicts are computed at read time, review_status holds admin decisions
addColumnIfNotExists('responses', 'review_status', "TEXT DEFAULT 'ok'"); // ok | conflit | suspect | ignoree
addColumnIfNotExists('responses', 'source', "TEXT DEFAULT 'web'"); // web | papier
addColumnIfNotExists('responses', 'verification', "TEXT DEFAULT 'declarative'"); // verifiee | declarative
addColumnIfNotExists('responses', 'ip_hash', 'TEXT'); // keyed hash, purged after PRIVACY.ip_hash_retention_days

// One windshield code per parking lot, stored hashed only
db.exec(`
  CREATE TABLE IF NOT EXISTS place_codes (
    lot_key TEXT PRIMARY KEY,
    places TEXT,
    code_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Small key/value store for server-side secrets
db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// Create indexes for duplicate detection and performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_responses_building ON responses(building);
  CREATE INDEX IF NOT EXISTS idx_responses_email ON responses(email) WHERE email IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
  CREATE INDEX IF NOT EXISTS idx_responses_submission_hash ON responses(submission_hash);
  CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
  CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
`);

/**
 * Secret for IP hashing: IP_HASH_SECRET, else a random one generated once and kept in meta
 * @returns {string}
 */
function loadIpHashSecret() {
  if (process.env.IP_HASH_SECRET) return process.env.IP_HASH_SECRET;
  const row = db.prepare("SELECT value FROM meta WHERE key = 'ip_hash_secret'").get();
  if (row?.value) return row.value;
  const secret = crypto.randomBytes(32).toString('hex');
  db.prepare("INSERT INTO meta (key, value) VALUES ('ip_hash_secret', ?)").run(secret);
  return secret;
}
const ipHashSecret = loadIpHashSecret();

/**
 * Keyed signature (server secret, separate purpose prefix), used for form tokens
 * @param {string} purpose
 * @param {string} value
 * @returns {string}
 */
export function signValue(purpose, value) {
  return crypto.createHmac('sha256', ipHashSecret).update(`${purpose}:${value}`).digest('hex');
}

/**
 * Keyed hash of an IP address (the clear IP is never stored with answers)
 * @param {string} ip
 * @returns {string|null}
 */
export function hashIp(ip) {
  if (!ip || ip === 'unknown') return null;
  return crypto.createHmac('sha256', ipHashSecret).update(ip).digest('hex');
}

/**
 * Forget IP hashes older than the retention period
 * @param {number} retentionDays
 * @returns {number} - Number of answers updated
 */
export function purgeIpHashes(retentionDays = PRIVACY.ip_hash_retention_days) {
  return db.prepare(`
    UPDATE responses SET ip_hash = NULL
    WHERE ip_hash IS NOT NULL AND created_at < datetime('now', ?)
  `).run(`-${retentionDays} days`).changes;
}

/**
 * Log an audit event
 * @param {string} eventType - Type of event (submission, export, delete, login, access)
 * @param {string} ipAddress - Client IP address
 * @param {Object} details - Additional details as JSON
 */
export function logAuditEvent(eventType, ipAddress, details = {}) {
  const stmt = db.prepare(`
    INSERT INTO audit_log (event_type, ip_address, details)
    VALUES (?, ?, ?)
  `);
  stmt.run(eventType, ipAddress, JSON.stringify(details));
}

/**
 * Get audit log entries
 * @param {number} limit - Maximum entries to return
 * @param {number} offset - Offset for pagination
 * @returns {Array} - Audit log entries
 */
export function getAuditLog(limit = 100, offset = 0) {
  const stmt = db.prepare(`
    SELECT * FROM audit_log
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset);
}

/**
 * Clean up old records based on retention policy
 * @param {number} retentionDays - Number of days to retain data
 * @returns {number} - Number of records deleted
 */
export function cleanupOldRecords(retentionDays = 730) { // 2 years default
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffIso = cutoffDate.toISOString();

  // Log the cleanup action
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM responses
    WHERE created_at < ?
  `);
  const countResult = countStmt.get(cutoffIso);

  if (countResult.count > 0) {
    const deleteStmt = db.prepare(`
      DELETE FROM responses WHERE created_at < ?
    `);
    deleteStmt.run(cutoffIso);

    logAuditEvent('cleanup', 'system', {
      deleted_count: countResult.count,
      retention_days: retentionDays,
      cutoff_date: cutoffIso
    });
  }

  return countResult.count;
}

/**
 * Delete audit log entries (they contain IP addresses) older than the retention period
 * @param {number} retentionDays - Number of days to retain audit entries
 * @returns {number} - Number of entries deleted
 */
export function cleanupAuditLog(retentionDays = PRIVACY.audit_retention_days) {
  const result = db.prepare(`
    DELETE FROM audit_log WHERE timestamp < datetime('now', ?)
  `).run(`-${retentionDays} days`);
  return result.changes;
}

// Run cleanup on startup and schedule daily
if (process.env.NODE_ENV !== 'test') {
  const runCleanup = () => {
    cleanupOldRecords(PRIVACY.retention_days);
    cleanupAuditLog();
    purgeIpHashes();
  };
  runCleanup();
  setInterval(runCleanup, 24 * 60 * 60 * 1000); // Daily
}

export default db;
