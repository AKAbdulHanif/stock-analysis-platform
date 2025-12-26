/**
 * Performance API Routes
 * 
 * API endpoints for portfolio performance tracking and benchmark comparison
 */

import { Router, Request, Response } from "express";
import {
  calculatePortfolioValue,
  recordPortfolioSnapshot,
  getPortfolioHistory,
  calculatePerformanceMetrics,
  PortfolioPerformanceError,
} from "../services/portfolioPerformanceService";
import {
  fetchBenchmarkData,
  getBenchmarkHistory,
  compareWithBenchmark,
  BenchmarkError,
} from "../services/benchmarkService";

const router = Router();

/**
 * GET /api/performance/:watchlistId
 * Get portfolio performance metrics
 */
router.get("/:watchlistId", async (req: Request, res: Response) => {
  try {
    const watchlistId = parseInt(req.params.watchlistId);
    const days = parseInt(req.query.days as string) || 30;

    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: "Invalid watchlist ID" });
    }

    const metrics = await calculatePerformanceMetrics(watchlistId, days);
    res.json(metrics);
  } catch (error) {
    if (error instanceof PortfolioPerformanceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error fetching performance metrics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/performance/:watchlistId/history
 * Get portfolio performance history
 */
router.get("/:watchlistId/history", async (req: Request, res: Response) => {
  try {
    const watchlistId = parseInt(req.params.watchlistId);
    const days = parseInt(req.query.days as string) || 30;

    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: "Invalid watchlist ID" });
    }

    const history = await getPortfolioHistory(watchlistId, days);
    res.json(history);
  } catch (error) {
    if (error instanceof PortfolioPerformanceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error fetching portfolio history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/performance/:watchlistId/snapshot
 * Record portfolio snapshot
 */
router.post("/:watchlistId/snapshot", async (req: Request, res: Response) => {
  try {
    const watchlistId = parseInt(req.params.watchlistId);

    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: "Invalid watchlist ID" });
    }

    // Calculate current portfolio value
    const totalValue = await calculatePortfolioValue(watchlistId);
    
    // Record snapshot
    await recordPortfolioSnapshot(watchlistId, totalValue);

    res.json({
      message: "Portfolio snapshot recorded successfully",
      totalValue,
    });
  } catch (error) {
    if (error instanceof PortfolioPerformanceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error recording portfolio snapshot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/performance/benchmark/history
 * Get S&P 500 benchmark history
 */
router.get("/benchmark/history", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = await getBenchmarkHistory(days);
    res.json(history);
  } catch (error) {
    if (error instanceof BenchmarkError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error fetching benchmark history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/performance/benchmark/fetch
 * Fetch and store S&P 500 benchmark data
 */
router.post("/benchmark/fetch", async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.body.days as string) || 365;
    await fetchBenchmarkData(days);
    res.json({ message: "Benchmark data fetched successfully" });
  } catch (error) {
    if (error instanceof BenchmarkError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error fetching benchmark data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/performance/:watchlistId/compare
 * Compare portfolio with S&P 500 benchmark
 */
router.post("/:watchlistId/compare", async (req: Request, res: Response) => {
  try {
    const watchlistId = parseInt(req.params.watchlistId);
    const days = parseInt(req.body.days as string) || 30;

    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: "Invalid watchlist ID" });
    }

    // Get portfolio history
    const portfolioHistory = await getPortfolioHistory(watchlistId, days);
    const portfolioReturns = portfolioHistory.map(h => h.return);

    // Compare with benchmark
    const comparison = await compareWithBenchmark(portfolioReturns, days);

    res.json(comparison);
  } catch (error) {
    if (error instanceof PortfolioPerformanceError || error instanceof BenchmarkError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error comparing with benchmark:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
