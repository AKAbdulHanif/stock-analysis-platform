/**
 * Portfolio Risk Metrics Service
 * Calculate Sharpe ratio, beta, max drawdown, VaR, and volatility
 */

import { getChartData } from './yahooFinanceService';

export interface RiskMetrics {
  sharpeRatio: number;
  beta: number;
  maxDrawdown: number;
  valueAtRisk95: number; // 95% confidence VaR
  valueAtRisk99: number; // 99% confidence VaR
  annualizedVolatility: number;
  downsideDeviation: number;
  sortinoRatio: number;
}

export interface VolatilityData {
  date: string;
  volatility: number; // Rolling 30-day volatility
}

const RISK_FREE_RATE = 0.045; // 4.5% annual risk-free rate (10-year Treasury)
const TRADING_DAYS_PER_YEAR = 252;

/**
 * Calculate daily returns from price data
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(dailyReturn);
  }
  return returns;
}

/**
 * Calculate Sharpe Ratio
 * (Portfolio Return - Risk Free Rate) / Portfolio Volatility
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = RISK_FREE_RATE
): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const annualizedReturn = avgReturn * TRADING_DAYS_PER_YEAR;
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  const annualizedVolatility = volatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
  
  if (annualizedVolatility === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

/**
 * Calculate Beta (vs S&P 500)
 * Covariance(Portfolio, Market) / Variance(Market)
 */
export function calculateBeta(
  portfolioReturns: number[],
  marketReturns: number[]
): number {
  if (portfolioReturns.length === 0 || marketReturns.length === 0) return 1.0;
  
  const minLength = Math.min(portfolioReturns.length, marketReturns.length);
  const pReturns = portfolioReturns.slice(0, minLength);
  const mReturns = marketReturns.slice(0, minLength);
  
  const avgP = pReturns.reduce((sum, r) => sum + r, 0) / pReturns.length;
  const avgM = mReturns.reduce((sum, r) => sum + r, 0) / mReturns.length;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < minLength; i++) {
    covariance += (pReturns[i] - avgP) * (mReturns[i] - avgM);
    marketVariance += Math.pow(mReturns[i] - avgM, 2);
  }
  
  covariance /= minLength;
  marketVariance /= minLength;
  
  if (marketVariance === 0) return 1.0;
  
  return covariance / marketVariance;
}

/**
 * Calculate Maximum Drawdown
 * Largest peak-to-trough decline
 */
export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    
    const drawdown = (peak - price) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

/**
 * Calculate Value at Risk (VaR)
 * Historical simulation method
 */
export function calculateVaR(
  returns: number[],
  confidenceLevel: number = 0.95
): number {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  
  return Math.abs(sortedReturns[index] || 0);
}

/**
 * Calculate annualized volatility
 */
export function calculateVolatility(returns: number[]): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const dailyVolatility = Math.sqrt(variance);
  
  return dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculate downside deviation (for Sortino ratio)
 * Only considers negative returns
 */
export function calculateDownsideDeviation(
  returns: number[],
  targetReturn: number = 0
): number {
  if (returns.length === 0) return 0;
  
  const downsideReturns = returns.filter(r => r < targetReturn);
  if (downsideReturns.length === 0) return 0;
  
  const variance = downsideReturns.reduce(
    (sum, r) => sum + Math.pow(r - targetReturn, 2),
    0
  ) / downsideReturns.length;
  
  const dailyDownsideDeviation = Math.sqrt(variance);
  return dailyDownsideDeviation * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculate Sortino Ratio
 * Similar to Sharpe but only penalizes downside volatility
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = RISK_FREE_RATE
): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const annualizedReturn = avgReturn * TRADING_DAYS_PER_YEAR;
  
  const downsideDeviation = calculateDownsideDeviation(returns);
  
  if (downsideDeviation === 0) return 0;
  
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate rolling volatility for time series chart
 */
export function calculateRollingVolatility(
  prices: { date: string; close: number }[],
  window: number = 30
): VolatilityData[] {
  const result: VolatilityData[] = [];
  
  for (let i = window; i < prices.length; i++) {
    const windowPrices = prices.slice(i - window, i).map(p => p.close);
    const returns = calculateReturns(windowPrices);
    const volatility = calculateVolatility(returns);
    
    result.push({
      date: prices[i].date,
      volatility: volatility * 100 // Convert to percentage
    });
  }
  
  return result;
}

/**
 * Get comprehensive risk metrics for a portfolio
 */
export async function getPortfolioRiskMetrics(
  tickers: string[],
  weights?: number[]
): Promise<RiskMetrics & { volatilityHistory: VolatilityData[] }> {
  // Default to equal weights if not provided
  const portfolioWeights = weights || tickers.map(() => 1 / tickers.length);
  
  // Fetch 1 year of historical data for all stocks
  const priceDataPromises = tickers.map(ticker => 
    getChartData(ticker, '1y', '1d')
  );
  
  const priceDataResults = await Promise.all(priceDataPromises);
  
  // Get S&P 500 data for beta calculation
  const sp500Data = await getChartData('^GSPC', '1y', '1d');
  
  // Calculate portfolio prices (weighted average)
  const dates = priceDataResults[0]?.dataPoints.map(dp => dp.date) || [];
  const portfolioPrices: number[] = [];
  
  for (let i = 0; i < dates.length; i++) {
    let portfolioPrice = 0;
    for (let j = 0; j < tickers.length; j++) {
      const stockPrice = priceDataResults[j]?.dataPoints[i]?.close || 0;
      portfolioPrice += stockPrice * portfolioWeights[j];
    }
    portfolioPrices.push(portfolioPrice);
  }
  
  // Calculate returns
  const portfolioReturns = calculateReturns(portfolioPrices);
  const marketReturns = calculateReturns(
    sp500Data?.dataPoints.map(dp => dp.close) || []
  );
  
  // Calculate all risk metrics
  const sharpeRatio = calculateSharpeRatio(portfolioReturns);
  const beta = calculateBeta(portfolioReturns, marketReturns);
  const maxDrawdown = calculateMaxDrawdown(portfolioPrices);
  const valueAtRisk95 = calculateVaR(portfolioReturns, 0.95);
  const valueAtRisk99 = calculateVaR(portfolioReturns, 0.99);
  const annualizedVolatility = calculateVolatility(portfolioReturns);
  const downsideDeviation = calculateDownsideDeviation(portfolioReturns);
  const sortinoRatio = calculateSortinoRatio(portfolioReturns);
  
  // Calculate rolling volatility for chart
  const priceHistory = dates.map((date, i) => ({
    date,
    close: portfolioPrices[i]
  }));
  const volatilityHistory = calculateRollingVolatility(priceHistory);
  
  return {
    sharpeRatio,
    beta,
    maxDrawdown,
    valueAtRisk95,
    valueAtRisk99,
    annualizedVolatility,
    downsideDeviation,
    sortinoRatio,
    volatilityHistory
  };
}
