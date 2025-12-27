import express from "express";
import {
  runBacktest,
  BacktestConfig,
  BacktestingError,
} from "../services/backtestingService";

const router = express.Router();

/**
 * POST /api/backtest
 * Run a portfolio backtest simulation
 */
router.post("/", async (req, res) => {
  try {
    const config: BacktestConfig = req.body;

    // Validate required fields
    if (!config.tickers || !config.allocations || !config.startDate || !config.endDate) {
      return res.status(400).json({
        error: "Missing required fields: tickers, allocations, startDate, endDate",
      });
    }

    // Set defaults
    if (!config.initialCapital) {
      config.initialCapital = 10000; // Default $10,000
    }
    if (!config.rebalancingFrequency) {
      config.rebalancingFrequency = "quarterly";
    }

    const results = await runBacktest(config);

    res.json(results);
  } catch (error) {
    console.error("Error running backtest:", error);

    if (error instanceof BacktestingError) {
      return res.status(error.statusCode).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to run backtest",
    });
  }
});

export default router;
