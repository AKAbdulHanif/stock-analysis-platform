/**
 * Benchmark Service
 * 
 * Fetches and stores S&P 500 benchmark data for portfolio comparison
 */

import { eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "../db";
import { benchmarkData, InsertBenchmarkData } from "../../drizzle/schema";
import { getChartData } from "./yahooFinanceService";

export class BenchmarkError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "BenchmarkError";
  }
}

export interface BenchmarkDataPoint {
  date: Date;
  price: number;
  return: number;
}

export interface BenchmarkComparison {
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number; // Portfolio return - Benchmark return
  beta: number; // Portfolio volatility / Benchmark volatility
  outperformance: boolean;
}

const SP500_TICKER = "^GSPC"; // S&P 500 index ticker

/**
 * Fetch and store S&P 500 historical data
 */
export async function fetchBenchmarkData(days: number = 365): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new BenchmarkError("Database not available", 503);
  }

  try {
    // Determine period for Yahoo Finance API
    let period = "1y";
    if (days <= 7) period = "5d";
    else if (days <= 30) period = "1mo";
    else if (days <= 90) period = "3mo";
    else if (days <= 180) period = "6mo";

    // Fetch S&P 500 historical data
    const chartData = await getChartData(SP500_TICKER, period);

    if (!chartData || chartData.length === 0) {
      throw new BenchmarkError("No benchmark data available", 404);
    }

    // Calculate daily returns and store
    for (let i = 0; i < chartData.length; i++) {
      const point = chartData[i];
      let dailyReturn = 0;

      if (i > 0) {
        const prevPrice = chartData[i - 1].close;
        dailyReturn = ((point.close - prevPrice) / prevPrice) * 100;
      }

      // Check if data already exists for this date
      const existingData = await db
        .select()
        .from(benchmarkData)
        .where(
          and(
            eq(benchmarkData.ticker, SP500_TICKER),
            eq(benchmarkData.date, new Date(point.date))
          )
        )
        .limit(1);

      if (existingData.length === 0) {
        await db.insert(benchmarkData).values({
          ticker: SP500_TICKER,
          date: new Date(point.date),
          closePrice: point.close.toString(),
          dailyReturn: dailyReturn.toString(),
        });
      }
    }

    console.log(`Benchmark data updated: ${chartData.length} data points stored`);
  } catch (error) {
    console.error("Error fetching benchmark data:", error);
    throw new BenchmarkError("Failed to fetch benchmark data", 500);
  }
}

/**
 * Get benchmark historical data
 */
export async function getBenchmarkHistory(days: number = 30): Promise<BenchmarkDataPoint[]> {
  const db = await getDb();
  if (!db) {
    throw new BenchmarkError("Database not available", 503);
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const data = await db
      .select()
      .from(benchmarkData)
      .where(
        and(
          eq(benchmarkData.ticker, SP500_TICKER),
          gte(benchmarkData.date, cutoffDate)
        )
      )
      .orderBy(desc(benchmarkData.date));

    return data.map(d => ({
      date: new Date(d.date),
      price: parseFloat(d.closePrice),
      return: parseFloat(d.dailyReturn || "0"),
    }));
  } catch (error) {
    console.error("Error fetching benchmark history:", error);
    throw new BenchmarkError("Failed to fetch benchmark history", 500);
  }
}

/**
 * Compare portfolio performance against S&P 500
 */
export async function compareWithBenchmark(
  portfolioReturns: number[],
  days: number = 30
): Promise<BenchmarkComparison> {
  try {
    // Fetch benchmark data
    const benchmarkHistory = await getBenchmarkHistory(days);

    if (benchmarkHistory.length === 0) {
      // If no benchmark data, fetch it first
      await fetchBenchmarkData(days);
      const newBenchmarkHistory = await getBenchmarkHistory(days);
      
      if (newBenchmarkHistory.length === 0) {
        throw new BenchmarkError("No benchmark data available after fetch", 404);
      }
    }

    const benchmarkReturns = benchmarkHistory.map(d => d.return);

    // Calculate cumulative returns
    const portfolioReturn = portfolioReturns.reduce((sum, r) => sum + r, 0);
    const benchmarkReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0);

    // Calculate alpha (excess return)
    const alpha = portfolioReturn - benchmarkReturn;

    // Calculate beta (relative volatility)
    const portfolioVolatility = calculateVolatility(portfolioReturns);
    const benchmarkVolatility = calculateVolatility(benchmarkReturns);
    const beta = benchmarkVolatility > 0 ? portfolioVolatility / benchmarkVolatility : 1;

    return {
      portfolioReturn,
      benchmarkReturn,
      alpha,
      beta,
      outperformance: portfolioReturn > benchmarkReturn,
    };
  } catch (error) {
    console.error("Error comparing with benchmark:", error);
    throw new BenchmarkError("Failed to compare with benchmark", 500);
  }
}

/**
 * Calculate volatility (standard deviation)
 */
function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;
  
  const avg = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
  return Math.sqrt(variance);
}
