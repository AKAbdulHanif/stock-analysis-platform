/**
 * Sentiment History API Routes
 * 
 * Endpoints for retrieving historical sentiment data
 */

import express from "express";
import {
  getSentimentHistory,
  getLatestSentiment,
  getSentimentTrend,
  updateSentimentForStocks,
  SentimentHistoryError,
} from "../services/sentimentHistoryService";

const router = express.Router();

/**
 * Get sentiment history for a stock
 */
router.get("/:ticker", async (req, res) => {
  try {
    const { ticker } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const history = await getSentimentHistory(ticker, days);
    res.json(history);
  } catch (error) {
    if (error instanceof SentimentHistoryError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in GET /api/sentiment-history/:ticker:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Get latest sentiment for a stock
 */
router.get("/:ticker/latest", async (req, res) => {
  try {
    const { ticker } = req.params;
    const latest = await getLatestSentiment(ticker);
    
    if (!latest) {
      return res.status(404).json({ message: "No sentiment data available" });
    }
    
    res.json(latest);
  } catch (error) {
    if (error instanceof SentimentHistoryError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in GET /api/sentiment-history/:ticker/latest:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Get sentiment trend analysis for a stock
 */
router.get("/:ticker/trend", async (req, res) => {
  try {
    const { ticker } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const trend = await getSentimentTrend(ticker, days);
    res.json(trend);
  } catch (error) {
    if (error instanceof SentimentHistoryError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in GET /api/sentiment-history/:ticker/trend:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Trigger sentiment update for multiple stocks (admin/cron endpoint)
 */
router.post("/update", async (req, res) => {
  try {
    const { tickers } = req.body;

    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({ message: "tickers array required" });
    }

    // Run update in background
    updateSentimentForStocks(tickers).catch(error => {
      console.error("Error in background sentiment update:", error);
    });

    res.json({ message: "Sentiment update started", tickers: tickers.length });
  } catch (error) {
    console.error("Error in POST /api/sentiment-history/update:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
