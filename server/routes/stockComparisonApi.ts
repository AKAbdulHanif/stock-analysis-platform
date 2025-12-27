/**
 * Stock Comparison API Routes
 */

import { Router } from "express";
import { compareStocks } from "../services/stockComparisonService";

const router = Router();

/**
 * POST /api/stock/compare
 * Compare multiple stocks side-by-side
 * 
 * Request body: { tickers: string[] }
 * Response: StockComparisonResponse
 */
router.post("/compare", async (req, res) => {
  try {
    const { tickers } = req.body;

    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({
        error: "Invalid request: tickers array required",
      });
    }

    if (tickers.length < 2) {
      return res.status(400).json({
        error: "At least 2 tickers required for comparison",
      });
    }

    if (tickers.length > 5) {
      return res.status(400).json({
        error: "Maximum 5 tickers allowed for comparison",
      });
    }

    // Validate ticker format (uppercase letters only, max 5 chars)
    const tickerRegex = /^[A-Z]{1,5}$/;
    const invalidTickers = tickers.filter((t: string) => !tickerRegex.test(t));
    if (invalidTickers.length > 0) {
      return res.status(400).json({
        error: `Invalid ticker format: ${invalidTickers.join(", ")}`,
      });
    }

    const comparison = await compareStocks(tickers);
    res.json(comparison);
  } catch (error) {
    console.error("Error comparing stocks:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to compare stocks",
    });
  }
});

export default router;
