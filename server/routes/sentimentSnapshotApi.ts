import { Router } from "express";
import {
  collectSentimentSnapshot,
  collectAllSentimentSnapshots,
  getLastSnapshotTime,
  cleanOldSnapshots,
} from "../services/sentimentSnapshotService";

const router = Router();

/**
 * POST /api/sentiment-snapshots/collect
 * Manually trigger sentiment snapshot collection for all tracked stocks
 */
router.post("/collect", async (req, res) => {
  try {
    const result = await collectAllSentimentSnapshots();
    res.json({
      message: "Sentiment snapshot collection completed",
      ...result,
    });
  } catch (error: any) {
    console.error("Error collecting sentiment snapshots:", error);
    res.status(500).json({
      error: "Failed to collect sentiment snapshots",
      message: error.message,
    });
  }
});

/**
 * POST /api/sentiment-snapshots/collect/:ticker
 * Manually trigger sentiment snapshot collection for a specific stock
 */
router.post("/collect/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;

    if (!ticker) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    await collectSentimentSnapshot(ticker.toUpperCase());

    res.json({
      message: `Sentiment snapshot collected for ${ticker.toUpperCase()}`,
      ticker: ticker.toUpperCase(),
    });
  } catch (error: any) {
    console.error(`Error collecting sentiment snapshot for ${req.params.ticker}:`, error);
    res.status(500).json({
      error: "Failed to collect sentiment snapshot",
      message: error.message,
    });
  }
});

/**
 * GET /api/sentiment-snapshots/last/:ticker
 * Get the last snapshot time for a ticker
 */
router.get("/last/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;

    if (!ticker) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    const lastSnapshotTime = await getLastSnapshotTime(ticker.toUpperCase());

    res.json({
      ticker: ticker.toUpperCase(),
      lastSnapshotTime,
    });
  } catch (error: any) {
    console.error(`Error getting last snapshot time for ${req.params.ticker}:`, error);
    res.status(500).json({
      error: "Failed to get last snapshot time",
      message: error.message,
    });
  }
});

/**
 * POST /api/sentiment-snapshots/cleanup
 * Clean old sentiment snapshots (keep last 90 days)
 */
router.post("/cleanup", async (req, res) => {
  try {
    const deletedCount = await cleanOldSnapshots();

    res.json({
      message: "Old sentiment snapshots cleaned",
      deletedCount,
    });
  } catch (error: any) {
    console.error("Error cleaning old snapshots:", error);
    res.status(500).json({
      error: "Failed to clean old snapshots",
      message: error.message,
    });
  }
});

export default router;
