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
    consent_contact INTEGER DEFAULT 0
  )
`);

export default db;
