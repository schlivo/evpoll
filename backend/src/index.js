import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import surveyRouter from './routes/survey.js';
import statsRouter, { handleExportCSV } from './routes/stats.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { COPRO, BUILDINGS, BUILDINGS_QUESTION, PARKING_SPOTS, LOTS, CAMPAIGN, PRIVACY, TEXTS } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for correct IP detection behind reverse proxy
app.set('trust proxy', 1);

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://api.qrserver.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding for SPA
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Request size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global rate limiting
app.use('/api', globalLimiter);

// CORS for development
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }));
}

// API routes - explicit /api/stats/export first so it's always registered
app.get('/api/stats/export', handleExportCSV);
app.use('/api/survey', surveyRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public config endpoint (non-sensitive configuration for frontend)
app.get('/api/config', (req, res) => {
  const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'conseil-syndical@exemple.fr';
  const SYNDIC_EMAIL = process.env.SYNDIC_EMAIL || 'syndic@exemple.fr';
  res.json({
    copro_name: COPRO.name,
    copro_address: COPRO.address,
    parking_address: COPRO.parking_address,
    // Kept as a list of ids for older frontends; details in building_choices
    buildings: BUILDINGS.map(b => b.id),
    building_question: BUILDINGS_QUESTION.label,
    building_choices: [
      ...BUILDINGS.map(b => ({ id: b.id, label: b.label, address: b.address })),
      ...BUILDINGS_QUESTION.extra_choices
    ],
    parking_spots: PARKING_SPOTS,
    // Only multi-spot lots: lets the form ask "are both spots concerned?"
    multi_spot_lots: LOTS.filter(l => l.places.length > 1),
    contact_email: CONTACT_EMAIL,
    syndic_email: SYNDIC_EMAIL,
    privacy: PRIVACY,
    texts: TEXTS,
    // Campaign defaults for the flyer generator (editable there)
    campaign_deadline: CAMPAIGN.deadline,
    campaign_signature: CAMPAIGN.signature
  });
});

// Serve static files in production
const publicPath = join(__dirname, '../public');
app.use(express.static(publicPath));

// Flyer generator route - redirect to static file
app.get('/flyer', (req, res) => {
  res.redirect('/flyer.html');
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(publicPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
