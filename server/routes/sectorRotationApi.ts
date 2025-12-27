/**
 * Sector Rotation API Router
 * REST endpoints for sector analysis
 */

import express from 'express';
import { getSectorRotationData, getTopSectors, getBottomSectors } from '../services/sectorRotationService';

const router = express.Router();

/**
 * GET /api/sector-rotation
 * Get all sector rotation data
 */
router.get('/sector-rotation', async (req, res) => {
  try {
    const data = await getSectorRotationData();
    res.json({ sectors: data });
  } catch (error: any) {
    console.error('Error in /api/sector-rotation:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch sector rotation data'
    });
  }
});

/**
 * GET /api/sector-rotation/top
 * Get top performing sectors
 */
router.get('/sector-rotation/top', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 3;
    const data = await getTopSectors(count);
    res.json({ sectors: data });
  } catch (error: any) {
    console.error('Error in /api/sector-rotation/top:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch top sectors'
    });
  }
});

/**
 * GET /api/sector-rotation/bottom
 * Get bottom performing sectors
 */
router.get('/sector-rotation/bottom', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 3;
    const data = await getBottomSectors(count);
    res.json({ sectors: data });
  } catch (error: any) {
    console.error('Error in /api/sector-rotation/bottom:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch bottom sectors'
    });
  }
});

export default router;
