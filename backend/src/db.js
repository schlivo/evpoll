import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Run cleanup on startup and schedule daily
if (process.env.NODE_ENV !== 'test') {
  cleanupOldRecords();
  setInterval(() => cleanupOldRecords(), 24 * 60 * 60 * 1000); // Daily
}

export default db;
