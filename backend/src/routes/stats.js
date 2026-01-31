import { Router } from 'express';
import db from '../db.js';

const router = Router();

const TOTAL_LOTS = 75;

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

export default router;
