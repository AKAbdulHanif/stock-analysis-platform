/**
 * Stock Screener Service
 * Filter stocks by technical signals and fundamental metrics
 */

import { getStockQuote, getChartData } from './yahooFinanceService';
import { calculateRSI, calculateMACD, calculateBollingerBands, type PriceData } from './technicalIndicatorsService';

// Universe of stocks to screen (can be expanded)
const STOCK_UNIVERSE = [
  // Tech
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'ORCL',
  'CRM', 'ADBE', 'CSCO', 'AVGO', 'QCOM', 'TXN', 'INTU', 'IBM', 'NOW', 'SNOW',
  // Healthcare
  'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'DHR', 'LLY', 'BMY',
  'AMGN', 'GILD', 'CVS', 'CI', 'HUM', 'ISRG', 'VRTX', 'REGN', 'ZTS', 'BIIB',
  // Finance
  'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'SCHW', 'AXP', 'USB',
  'PNC', 'TFC', 'COF', 'BK', 'STT', 'V', 'MA', 'PYPL', 'SQ', 'COIN',
  // Consumer
  'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'TJX', 'DG', 'COST',
  'KO', 'PEP', 'PM', 'MO', 'CL', 'PG', 'KMB', 'GIS', 'K', 'HSY',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',
  // Industrials
  'BA', 'CAT', 'GE', 'HON', 'UPS', 'RTX', 'LMT', 'DE', 'MMM', 'EMR',
  // Materials
  'LIN', 'APD', 'ECL', 'SHW', 'NEM', 'FCX', 'NUE', 'DOW', 'DD', 'ALB'
];

export interface ScreenerFilters {
  // Technical filters
  rsiMin?: number;
  rsiMax?: number;
  macdBullish?: boolean; // MACD line > signal line
  macdBearish?: boolean;
  bollinger?: 'oversold' | 'overbought' | 'neutral';
  
  // Fundamental filters
  peRatioMin?: number;
  peRatioMax?: number;
  dividendYieldMin?: number;
  dividendYieldMax?: number;
  marketCapMin?: number; // in billions
  marketCapMax?: number;
  
  // Price filters
  priceMin?: number;
  priceMax?: number;
  priceChangeMin?: number; // percentage
  priceChangeMax?: number;
  
  // Volume filters
  volumeMin?: number; // in millions
  
  // Sorting
  sortBy?: 'ticker' | 'price' | 'change' | 'volume' | 'pe' | 'yield' | 'rsi' | 'marketCap';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  offset?: number;
}

export interface ScreenerResult {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  rsi: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  bollingerPercent: number | null;
  signals: string[];
}

/**
 * Screen stocks based on filters
 */
export async function screenStocks(filters: ScreenerFilters): Promise<{
  results: ScreenerResult[];
  total: number;
  filtered: number;
}> {
  console.log('[Stock Screener] Starting screen with filters:', JSON.stringify(filters));
  
  const results: ScreenerResult[] = [];
  
  // Process stocks in parallel (batches of 10 to avoid rate limiting)
  const batchSize = 10;
  for (let i = 0; i < STOCK_UNIVERSE.length; i += batchSize) {
    const batch = STOCK_UNIVERSE.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(ticker => evaluateStock(ticker, filters))
    );
    
    // Filter out null results (stocks that don't match criteria)
    results.push(...batchResults.filter((r): r is ScreenerResult => r !== null));
  }
  
  // Sort results
  const sortedResults = sortResults(results, filters.sortBy || 'ticker', filters.sortOrder || 'asc');
  
  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  const paginatedResults = sortedResults.slice(offset, offset + limit);
  
  console.log(`[Stock Screener] Found ${results.length} matches out of ${STOCK_UNIVERSE.length} stocks`);
  
  return {
    results: paginatedResults,
    total: STOCK_UNIVERSE.length,
    filtered: results.length
  };
}

/**
 * Evaluate a single stock against filters
 */
async function evaluateStock(
  ticker: string,
  filters: ScreenerFilters
): Promise<ScreenerResult | null> {
  try {
    // Fetch quote data
    const quote = await getStockQuote(ticker);
    if (!quote) return null;
    
    const price = quote.price || 0;
    const change = quote.change || 0;
    const changePercent = quote.changePercent || 0;
    const volume = (quote.volume || 0) / 1_000_000; // Convert to millions
    const marketCap = (quote.marketCap || 0) / 1_000_000_000; // Convert to billions
    const peRatio = quote.trailingPE || null;
    const dividendYield = quote.dividendYield ? quote.dividendYield * 100 : null;
    
    // Apply fundamental filters
    if (filters.peRatioMin !== undefined && (peRatio === null || peRatio < filters.peRatioMin)) return null;
    if (filters.peRatioMax !== undefined && (peRatio === null || peRatio > filters.peRatioMax)) return null;
    if (filters.dividendYieldMin !== undefined && (dividendYield === null || dividendYield < filters.dividendYieldMin)) return null;
    if (filters.dividendYieldMax !== undefined && (dividendYield === null || dividendYield > filters.dividendYieldMax)) return null;
    if (filters.marketCapMin !== undefined && marketCap < filters.marketCapMin) return null;
    if (filters.marketCapMax !== undefined && marketCap > filters.marketCapMax) return null;
    
    // Apply price filters
    if (filters.priceMin !== undefined && price < filters.priceMin) return null;
    if (filters.priceMax !== undefined && price > filters.priceMax) return null;
    if (filters.priceChangeMin !== undefined && changePercent < filters.priceChangeMin) return null;
    if (filters.priceChangeMax !== undefined && changePercent > filters.priceChangeMax) return null;
    
    // Apply volume filter
    if (filters.volumeMin !== undefined && volume < filters.volumeMin) return null;
    
    // Fetch technical indicators if needed
    let rsi: number | null = null;
    let macd: { value: number; signal: number; histogram: number } | null = null;
    let bollingerPercent: number | null = null;
    
    const needsTechnicals = 
      filters.rsiMin !== undefined ||
      filters.rsiMax !== undefined ||
      filters.macdBullish !== undefined ||
      filters.macdBearish !== undefined ||
      filters.bollinger !== undefined;
    
    if (needsTechnicals) {
      try {
        const chartData = await getChartData(ticker, '3mo', '1d');
        if (chartData && chartData.dataPoints.length > 0) {
          const priceData: PriceData[] = chartData.dataPoints.map(dp => ({
            date: dp.date,
            close: dp.close
          }));
          
          const rsiData = calculateRSI(priceData);
          const macdData = calculateMACD(priceData);
          const bollingerData = calculateBollingerBands(priceData);
          
          if (rsiData.length > 0) {
            rsi = rsiData[rsiData.length - 1].rsi;
          }
          
          if (macdData.length > 0) {
            const latest = macdData[macdData.length - 1];
            macd = {
              value: latest.macd,
              signal: latest.signal,
              histogram: latest.histogram
            };
          }
          
          if (bollingerData.length > 0) {
            const latest = bollingerData[bollingerData.length - 1];
            const price = chartData.dataPoints[chartData.dataPoints.length - 1].close;
            const range = latest.upper - latest.lower;
            bollingerPercent = range > 0 ? ((price - latest.lower) / range) * 100 : 50;
          }
        }
      } catch (error) {
        console.error(`[Stock Screener] Error fetching technicals for ${ticker}:`, error);
      }
    }
    
    // Apply technical filters
    if (filters.rsiMin !== undefined && (rsi === null || rsi < filters.rsiMin)) return null;
    if (filters.rsiMax !== undefined && (rsi === null || rsi > filters.rsiMax)) return null;
    
    if (filters.macdBullish && (macd === null || macd.value <= macd.signal)) return null;
    if (filters.macdBearish && (macd === null || macd.value >= macd.signal)) return null;
    
    if (filters.bollinger) {
      if (bollingerPercent === null) return null;
      if (filters.bollinger === 'oversold' && bollingerPercent > 20) return null;
      if (filters.bollinger === 'overbought' && bollingerPercent < 80) return null;
      if (filters.bollinger === 'neutral' && (bollingerPercent < 40 || bollingerPercent > 60)) return null;
    }
    
    // Generate signals
    const signals: string[] = [];
    if (rsi !== null && rsi < 30) signals.push('RSI Oversold');
    if (rsi !== null && rsi > 70) signals.push('RSI Overbought');
    if (macd !== null && macd.histogram > 0) signals.push('MACD Bullish');
    if (macd !== null && macd.histogram < 0) signals.push('MACD Bearish');
    if (bollingerPercent !== null && bollingerPercent < 20) signals.push('BB Oversold');
    if (bollingerPercent !== null && bollingerPercent > 80) signals.push('BB Overbought');
    if (dividendYield !== null && dividendYield > 3) signals.push('High Dividend');
    if (peRatio !== null && peRatio < 15) signals.push('Low P/E');
    
    return {
      ticker,
      name: quote.longName || ticker,
      price,
      change,
      changePercent,
      volume,
      marketCap,
      peRatio,
      dividendYield,
      rsi,
      macd,
      bollingerPercent,
      signals
    };
    
  } catch (error) {
    console.error(`[Stock Screener] Error evaluating ${ticker}:`, error);
    return null;
  }
}

/**
 * Sort results by specified field
 */
function sortResults(
  results: ScreenerResult[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): ScreenerResult[] {
  const sorted = [...results].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    switch (sortBy) {
      case 'ticker':
        aVal = a.ticker;
        bVal = b.ticker;
        break;
      case 'price':
        aVal = a.price;
        bVal = b.price;
        break;
      case 'change':
        aVal = a.changePercent;
        bVal = b.changePercent;
        break;
      case 'volume':
        aVal = a.volume;
        bVal = b.volume;
        break;
      case 'pe':
        aVal = a.peRatio ?? Infinity;
        bVal = b.peRatio ?? Infinity;
        break;
      case 'yield':
        aVal = a.dividendYield ?? 0;
        bVal = b.dividendYield ?? 0;
        break;
      case 'rsi':
        aVal = a.rsi ?? 50;
        bVal = b.rsi ?? 50;
        break;
      case 'marketCap':
        aVal = a.marketCap;
        bVal = b.marketCap;
        break;
      default:
        aVal = a.ticker;
        bVal = b.ticker;
    }
    
    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });
  
  return sorted;
}

/**
 * Get preset screens
 */
export function getPresetScreens(): Record<string, ScreenerFilters> {
  return {
    value: {
      peRatioMax: 15,
      dividendYieldMin: 2,
      sortBy: 'yield',
      sortOrder: 'desc'
    },
    growth: {
      priceChangeMin: 10,
      marketCapMin: 10,
      sortBy: 'change',
      sortOrder: 'desc'
    },
    dividend: {
      dividendYieldMin: 3,
      peRatioMax: 20,
      sortBy: 'yield',
      sortOrder: 'desc'
    },
    momentum: {
      rsiMin: 50,
      rsiMax: 70,
      macdBullish: true,
      priceChangeMin: 5,
      sortBy: 'change',
      sortOrder: 'desc'
    },
    oversold: {
      rsiMax: 30,
      bollinger: 'oversold',
      sortBy: 'rsi',
      sortOrder: 'asc'
    },
    overbought: {
      rsiMin: 70,
      bollinger: 'overbought',
      sortBy: 'rsi',
      sortOrder: 'desc'
    }
  };
}
