/**
 * Performance API Routes
 * 
 * API endpoints for portfolio performance tracking and benchmark comparison
 */

import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { watchlistStocks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
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

/**
 * GET /api/performance/:watchlistId/allocation
 * Get portfolio allocation by stock and sector
 */
router.get("/:watchlistId/allocation", async (req: Request, res: Response) => {
  try {
    const watchlistId = parseInt(req.params.watchlistId);

    if (isNaN(watchlistId)) {
      return res.status(400).json({ error: "Invalid watchlist ID" });
    }

    // Get watchlist stocks
    const db = await getDb();
    const stocks = await db
      .select()
      .from(watchlistStocks)
      .where(eq(watchlistStocks.watchlistId, watchlistId));

    if (stocks.length === 0) {
      return res.json({ byStock: [], bySector: [] });
    }

    // Fetch current prices for all stocks
    const tickers = stocks.map(s => s.ticker);
    const { getStockQuote } = await import("../services/yahooFinanceService");
    
    const stockData = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          // Fetch stock quote using the API endpoint format
          const response = await fetch(`http://localhost:3000/api/stock-quote/${ticker}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${ticker}`);
          }
          const quote = await response.json();
          return {
            ticker,
            price: quote.price || 0,
            sector: getSectorForStock(ticker),
          };
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
          return { ticker, price: 0, sector: "Unknown" };
        }
      })
    );

    // Since watchlists don't track quantities, use equal weighting
    const equalWeight = 100 / stockData.length;
    const totalValue = stockData.reduce((sum, stock) => sum + stock.price, 0);

    // Calculate allocation by stock (equal weight)
    const byStock = stockData.map((stock) => ({
      ticker: stock.ticker,
      value: stock.price,
      percentage: equalWeight,
      sector: stock.sector,
    }));

    // Calculate allocation by sector (sum equal weights per sector)
    const sectorMap = new Map<string, { count: number; value: number }>();
    stockData.forEach((stock) => {
      const current = sectorMap.get(stock.sector) || { count: 0, value: 0 };
      sectorMap.set(stock.sector, {
        count: current.count + 1,
        value: current.value + stock.price,
      });
    });

    const bySector = Array.from(sectorMap.entries()).map(([sector, data]) => ({
      sector,
      value: data.value,
      percentage: (data.count / stockData.length) * 100,
    }));

    res.json({ byStock, bySector, totalValue });
  } catch (error) {
    console.error("Error fetching portfolio allocation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to map stocks to sectors
function getSectorForStock(ticker: string): string {
  const sectorMap: Record<string, string> = {
    // Technology
    AAPL: "Technology",
    MSFT: "Technology",
    GOOGL: "Technology",
    NVDA: "Technology",
    TSM: "Technology",
    AVGO: "Technology",
    ASML: "Technology",
    MU: "Technology",
    TXN: "Technology",
    // Healthcare
    UNH: "Healthcare",
    JNJ: "Healthcare",
    ISRG: "Healthcare",
    LLY: "Healthcare",
    ABBV: "Healthcare",
    // Financials
    JPM: "Financials",
    BAC: "Financials",
    GS: "Financials",
    // Consumer
    AMZN: "Consumer",
    TSLA: "Consumer",
  };
  return sectorMap[ticker] || "Other";
}

export default router;
