/**
 * Stock Comparison Service
 * 
 * Provides side-by-side comparison of multiple stocks with synchronized data
 */

import { getStockQuote, getChartData } from "./yahooFinanceService";
import { getStockNews } from "./newsService";
import { getLatestSentiment } from "./sentimentHistoryService";

export interface StockComparisonData {
  ticker: string;
  quote: {
    price: number;
    change: number;
    changePercent: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    marketCap: number;
    peRatio: number;
    dividendYield: number;
  };
  sentiment: {
    currentScore: number;
    weekAverage: number;
    monthAverage: number;
    momentum: string;
    confidence: number;
  };
  performance: {
    day1: number;
    week1: number;
    month1: number;
    month3: number;
    month6: number;
    year1: number;
  };
  chartData: Array<{
    date: string;
    price: number;
    normalizedPrice: number; // Normalized to 100 at start
  }>;
  newsCount: number;
}

export interface ComparisonMetrics {
  correlation: { [key: string]: number }; // Correlation between stocks
  relativeStrength: { [key: string]: number }; // Relative performance ranking
  volatility: { [key: string]: number }; // Price volatility
  averageSentiment: { [key: string]: number }; // Average sentiment score
}

export interface StockComparisonResponse {
  stocks: StockComparisonData[];
  metrics: ComparisonMetrics;
  timestamp: string;
}

/**
 * Calculate correlation coefficient between two price series
 */
function calculateCorrelation(prices1: number[], prices2: number[]): number {
  if (prices1.length !== prices2.length || prices1.length === 0) {
    return 0;
  }

  const n = prices1.length;
  const mean1 = prices1.reduce((a, b) => a + b, 0) / n;
  const mean2 = prices2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = prices1[i] - mean1;
    const diff2 = prices2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate price volatility (standard deviation of returns)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100; // Convert to percentage
}

/**
 * Compare multiple stocks side-by-side
 */
export async function compareStocks(tickers: string[]): Promise<StockComparisonResponse> {
  if (tickers.length < 2) {
    throw new Error("At least 2 tickers required for comparison");
  }

  if (tickers.length > 5) {
    throw new Error("Maximum 5 tickers allowed for comparison");
  }

  // Fetch data for all stocks in parallel
  const stockDataPromises = tickers.map(async (ticker) => {
    const [quote, chartData, sentiment, news] = await Promise.all([
      getStockQuote(ticker),
      getChartData(ticker, "3mo"),
      getLatestSentiment(ticker).catch(() => null),
      getStockNews(ticker, 5).catch(() => []),
    ]);

    // Calculate performance metrics
    const prices = chartData.dataPoints.map((d) => d.close);
    const latestPrice = prices[prices.length - 1];
    
    const performance = {
      day1: prices.length >= 2 ? ((latestPrice - prices[prices.length - 2]) / prices[prices.length - 2]) * 100 : 0,
      week1: prices.length >= 7 ? ((latestPrice - prices[prices.length - 7]) / prices[prices.length - 7]) * 100 : 0,
      month1: prices.length >= 30 ? ((latestPrice - prices[prices.length - 30]) / prices[prices.length - 30]) * 100 : 0,
      month3: prices.length >= 90 ? ((latestPrice - prices[prices.length - 90]) / prices[prices.length - 90]) * 100 : 0,
      month6: prices.length >= 180 ? ((latestPrice - prices[0]) / prices[0]) * 100 : 0,
      year1: prices.length >= 252 ? ((latestPrice - prices[0]) / prices[0]) * 100 : 0,
    };

    // Normalize prices to 100 at start for comparison
    const startPrice = prices[0];
    const normalizedChartData = chartData.dataPoints.map((point) => ({
      date: point.date,
      price: point.close,
      normalizedPrice: (point.close / startPrice) * 100,
    }));

    return {
      ticker,
      quote: {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        dayHigh: quote.dayHigh || 0,
        dayLow: quote.dayLow || 0,
        volume: quote.volume || 0,
        marketCap: quote.marketCap || 0,
        peRatio: quote.peRatio || 0,
        dividendYield: quote.dividendYield || 0,
      },
      sentiment: sentiment
        ? {
            currentScore: sentiment.sentimentScore,
            weekAverage: sentiment.weekAverage || sentiment.sentimentScore,
            monthAverage: sentiment.monthAverage || sentiment.sentimentScore,
            momentum: sentiment.momentum || "stable",
            confidence: sentiment.confidence,
          }
        : {
            currentScore: 0,
            weekAverage: 0,
            monthAverage: 0,
            momentum: "stable",
            confidence: 0,
          },
      performance,
      chartData: normalizedChartData,
      newsCount: news.length,
    };
  });

  const stocks = await Promise.all(stockDataPromises);

  // Calculate comparison metrics
  const metrics: ComparisonMetrics = {
    correlation: {},
    relativeStrength: {},
    volatility: {},
    averageSentiment: {},
  };

  // Calculate pairwise correlations
  for (let i = 0; i < stocks.length; i++) {
    for (let j = i + 1; j < stocks.length; j++) {
      const prices1 = stocks[i].chartData.map((d) => d.price);
      const prices2 = stocks[j].chartData.map((d) => d.price);
      const corr = calculateCorrelation(prices1, prices2);
      metrics.correlation[`${stocks[i].ticker}-${stocks[j].ticker}`] = corr;
    }
  }

  // Calculate relative strength (rank by 3-month performance)
  const performanceRanking = stocks
    .map((s, idx) => ({ ticker: s.ticker, perf: s.performance.month3, idx }))
    .sort((a, b) => b.perf - a.perf);
  
  performanceRanking.forEach((item, rank) => {
    metrics.relativeStrength[item.ticker] = rank + 1;
  });

  // Calculate volatility for each stock
  stocks.forEach((stock) => {
    const prices = stock.chartData.map((d) => d.price);
    metrics.volatility[stock.ticker] = calculateVolatility(prices);
  });

  // Calculate average sentiment
  stocks.forEach((stock) => {
    metrics.averageSentiment[stock.ticker] = stock.sentiment.monthAverage;
  });

  return {
    stocks,
    metrics,
    timestamp: new Date().toISOString(),
  };
}
