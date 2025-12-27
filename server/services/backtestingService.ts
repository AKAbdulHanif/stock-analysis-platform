import { getChartData } from "./yahooFinanceService";

export class BacktestingError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "BacktestingError";
  }
}

export interface BacktestConfig {
  tickers: string[];
  allocations: { [ticker: string]: number }; // Percentage allocations (should sum to 100)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  initialCapital: number; // Starting portfolio value
  rebalancingFrequency: "monthly" | "quarterly" | "annually" | "none"; // none = buy-and-hold
}

export interface PortfolioSnapshot {
  date: string;
  value: number;
  holdings: { [ticker: string]: { shares: number; value: number } };
}

export interface BacktestResults {
  config: BacktestConfig;
  snapshots: PortfolioSnapshot[];
  metrics: {
    totalReturn: number; // Percentage
    cagr: number; // Compound Annual Growth Rate
    volatility: number; // Annualized standard deviation
    sharpeRatio: number; // Risk-adjusted return
    maxDrawdown: number; // Maximum peak-to-trough decline
    finalValue: number;
  };
  benchmark: {
    ticker: string;
    totalReturn: number;
    cagr: number;
    volatility: number;
    finalValue: number;
  };
  annualReturns: { year: number; return: number }[];
}

/**
 * Run a backtest simulation
 */
export async function runBacktest(
  config: BacktestConfig
): Promise<BacktestResults> {
  // Validate config
  validateConfig(config);

  // Fetch historical data for all tickers
  const historicalData = await fetchHistoricalData(
    config.tickers,
    config.startDate,
    config.endDate
  );

  // Fetch benchmark data (S&P 500)
  const benchmarkData = await fetchHistoricalData(
    ["^GSPC"],
    config.startDate,
    config.endDate
  );

  // Run simulation
  const snapshots = simulatePortfolio(config, historicalData);

  // Calculate metrics
  const metrics = calculateMetrics(snapshots, config.initialCapital);

  // Calculate benchmark metrics
  const benchmark = calculateBenchmarkMetrics(
    benchmarkData["^GSPC"],
    config.initialCapital
  );

  // Calculate annual returns
  const annualReturns = calculateAnnualReturns(snapshots);

  return {
    config,
    snapshots,
    metrics,
    benchmark,
    annualReturns,
  };
}

/**
 * Validate backtest configuration
 */
function validateConfig(config: BacktestConfig): void {
  if (!config.tickers || config.tickers.length === 0) {
    throw new BacktestingError("At least one ticker is required", 400);
  }

  const totalAllocation = Object.values(config.allocations).reduce(
    (sum, val) => sum + val,
    0
  );
  if (Math.abs(totalAllocation - 100) > 0.01) {
    throw new BacktestingError(
      "Allocations must sum to 100%",
      400
    );
  }

  if (config.initialCapital <= 0) {
    throw new BacktestingError("Initial capital must be positive", 400);
  }

  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  if (start >= end) {
    throw new BacktestingError("Start date must be before end date", 400);
  }
}

/**
 * Fetch historical price data for multiple tickers
 */
async function fetchHistoricalData(
  tickers: string[],
  startDate: string,
  endDate: string
): Promise<{ [ticker: string]: { date: string; close: number }[] }> {
  const data: { [ticker: string]: { date: string; close: number }[] } = {};

  // Calculate period based on date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  let period = "1y";
  if (daysDiff > 1825) period = "5y"; // > 5 years
  else if (daysDiff > 730) period = "2y"; // > 2 years
  else if (daysDiff > 365) period = "1y"; // > 1 year
  else if (daysDiff > 90) period = "6mo"; // > 3 months
  else period = "3mo";

  for (const ticker of tickers) {
    try {
      const chartData = await getChartData(ticker, period);

      if (!chartData.dataPoints || chartData.dataPoints.length === 0) {
        throw new BacktestingError(
          `No historical data available for ${ticker}`,
          404
        );
      }

      // Convert to simple format and filter by date range
      const prices = chartData.dataPoints
        .map((dp) => ({
          date: dp.date,
          close: dp.close,
        }))
        .filter((dp) => {
          const dpDate = new Date(dp.date);
          return dpDate >= start && dpDate <= end;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (prices.length === 0) {
        throw new BacktestingError(
          `No data available for ${ticker} in the specified date range`,
          404
        );
      }

      data[ticker] = prices;
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error);
      throw new BacktestingError(
        `Failed to fetch historical data for ${ticker}`,
        500
      );
    }
  }

  return data;
}

/**
 * Simulate portfolio performance over time
 */
function simulatePortfolio(
  config: BacktestConfig,
  historicalData: { [ticker: string]: { date: string; close: number }[] }
): PortfolioSnapshot[] {
  const snapshots: PortfolioSnapshot[] = [];

  // Get all unique dates (use the ticker with most data points)
  const allDates = Object.values(historicalData).reduce((longest, current) =>
    current.length > longest.length ? current : longest
  ).map((dp) => dp.date);

  // Initialize portfolio with initial allocations
  let holdings: { [ticker: string]: { shares: number; value: number } } = {};

  for (const ticker of config.tickers) {
    const allocationPercent = config.allocations[ticker] || 0;
    const allocationValue = (config.initialCapital * allocationPercent) / 100;

    // Get initial price
    const initialPrice = getPrice(historicalData, ticker, allDates[0]);
    if (initialPrice === null) continue;

    holdings[ticker] = {
      shares: allocationValue / initialPrice,
      value: allocationValue,
    };
  }

  // Track last rebalance date
  let lastRebalanceDate = new Date(allDates[0]);

  // Simulate each day
  for (const date of allDates) {
    const currentDate = new Date(date);

    // Update holdings values based on current prices
    let totalValue = 0;
    for (const ticker of config.tickers) {
      const price = getPrice(historicalData, ticker, date);
      if (price === null) continue;

      holdings[ticker].value = holdings[ticker].shares * price;
      totalValue += holdings[ticker].value;
    }

    // Check if rebalancing is needed
    if (shouldRebalance(config.rebalancingFrequency, lastRebalanceDate, currentDate)) {
      // Rebalance to target allocations
      for (const ticker of config.tickers) {
        const targetAllocation = config.allocations[ticker] || 0;
        const targetValue = (totalValue * targetAllocation) / 100;

        const price = getPrice(historicalData, ticker, date);
        if (price === null) continue;

        holdings[ticker] = {
          shares: targetValue / price,
          value: targetValue,
        };
      }

      lastRebalanceDate = currentDate;
    }

    // Record snapshot
    snapshots.push({
      date,
      value: totalValue,
      holdings: JSON.parse(JSON.stringify(holdings)), // Deep copy
    });
  }

  return snapshots;
}

/**
 * Get price for a ticker on a specific date
 */
function getPrice(
  historicalData: { [ticker: string]: { date: string; close: number }[] },
  ticker: string,
  date: string
): number | null {
  const tickerData = historicalData[ticker];
  if (!tickerData) return null;

  const dataPoint = tickerData.find((dp) => dp.date === date);
  return dataPoint ? dataPoint.close : null;
}

/**
 * Determine if rebalancing should occur
 */
function shouldRebalance(
  frequency: string,
  lastRebalance: Date,
  currentDate: Date
): boolean {
  if (frequency === "none") return false;

  const daysSinceRebalance = Math.floor(
    (currentDate.getTime() - lastRebalance.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (frequency) {
    case "monthly":
      return daysSinceRebalance >= 30;
    case "quarterly":
      return daysSinceRebalance >= 90;
    case "annually":
      return daysSinceRebalance >= 365;
    default:
      return false;
  }
}

/**
 * Calculate portfolio performance metrics
 */
function calculateMetrics(
  snapshots: PortfolioSnapshot[],
  initialCapital: number
): BacktestResults["metrics"] {
  if (snapshots.length === 0) {
    throw new BacktestingError("No snapshots to calculate metrics", 500);
  }

  const finalValue = snapshots[snapshots.length - 1].value;
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;

  // Calculate CAGR
  const years =
    (new Date(snapshots[snapshots.length - 1].date).getTime() -
      new Date(snapshots[0].date).getTime()) /
    (1000 * 60 * 60 * 24 * 365);
  const cagr = (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100;

  // Calculate daily returns for volatility
  const dailyReturns: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prevValue = snapshots[i - 1].value;
    const currValue = snapshots[i].value;
    dailyReturns.push((currValue - prevValue) / prevValue);
  }

  // Calculate volatility (annualized standard deviation)
  const avgReturn =
    dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    dailyReturns.length;
  const volatility = Math.sqrt(variance * 252) * 100; // Annualize (252 trading days)

  // Calculate Sharpe Ratio (assuming 2% risk-free rate)
  const riskFreeRate = 2;
  const sharpeRatio = (cagr - riskFreeRate) / volatility;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = snapshots[0].value;
  for (const snapshot of snapshots) {
    if (snapshot.value > peak) {
      peak = snapshot.value;
    }
    const drawdown = ((peak - snapshot.value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalReturn,
    cagr,
    volatility,
    sharpeRatio,
    maxDrawdown,
    finalValue,
  };
}

/**
 * Calculate benchmark metrics
 */
function calculateBenchmarkMetrics(
  benchmarkData: { date: string; close: number }[],
  initialCapital: number
): BacktestResults["benchmark"] {
  if (!benchmarkData || benchmarkData.length === 0) {
    return {
      ticker: "^GSPC",
      totalReturn: 0,
      cagr: 0,
      volatility: 0,
      finalValue: initialCapital,
    };
  }

  const initialPrice = benchmarkData[0].close;
  const finalPrice = benchmarkData[benchmarkData.length - 1].close;
  const finalValue = (initialCapital * finalPrice) / initialPrice;
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;

  // Calculate CAGR
  const years =
    (new Date(benchmarkData[benchmarkData.length - 1].date).getTime() -
      new Date(benchmarkData[0].date).getTime()) /
    (1000 * 60 * 60 * 24 * 365);
  const cagr = (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100;

  // Calculate volatility
  const dailyReturns: number[] = [];
  for (let i = 1; i < benchmarkData.length; i++) {
    const prevPrice = benchmarkData[i - 1].close;
    const currPrice = benchmarkData[i].close;
    dailyReturns.push((currPrice - prevPrice) / prevPrice);
  }

  const avgReturn =
    dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    dailyReturns.length;
  const volatility = Math.sqrt(variance * 252) * 100;

  return {
    ticker: "^GSPC",
    totalReturn,
    cagr,
    volatility,
    finalValue,
  };
}

/**
 * Calculate annual returns
 */
function calculateAnnualReturns(
  snapshots: PortfolioSnapshot[]
): { year: number; return: number }[] {
  const annualReturns: { year: number; return: number }[] = [];

  // Group snapshots by year
  const snapshotsByYear: { [year: number]: PortfolioSnapshot[] } = {};
  for (const snapshot of snapshots) {
    const year = new Date(snapshot.date).getFullYear();
    if (!snapshotsByYear[year]) {
      snapshotsByYear[year] = [];
    }
    snapshotsByYear[year].push(snapshot);
  }

  // Calculate return for each year
  const years = Object.keys(snapshotsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  for (const year of years) {
    const yearSnapshots = snapshotsByYear[year];
    const startValue = yearSnapshots[0].value;
    const endValue = yearSnapshots[yearSnapshots.length - 1].value;
    const yearReturn = ((endValue - startValue) / startValue) * 100;

    annualReturns.push({ year, return: yearReturn });
  }

  return annualReturns;
}
