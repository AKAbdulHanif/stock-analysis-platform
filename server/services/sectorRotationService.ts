/**
 * Sector Rotation Analysis Service
 * Track 11 sector ETFs and calculate relative strength
 */

import { getStockQuote, getChartData } from './yahooFinanceService';

export interface SectorData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  relativeStrength: number; // vs S&P 500
  momentum: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
  performance: {
    oneWeek: number;
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
  };
}

// 11 Sector SPDR ETFs
export const SECTOR_ETFS = [
  { ticker: 'XLK', name: 'Technology' },
  { ticker: 'XLV', name: 'Healthcare' },
  { ticker: 'XLF', name: 'Financials' },
  { ticker: 'XLE', name: 'Energy' },
  { ticker: 'XLY', name: 'Consumer Discretionary' },
  { ticker: 'XLP', name: 'Consumer Staples' },
  { ticker: 'XLI', name: 'Industrials' },
  { ticker: 'XLB', name: 'Materials' },
  { ticker: 'XLU', name: 'Utilities' },
  { ticker: 'XLRE', name: 'Real Estate' },
  { ticker: 'XLC', name: 'Communication Services' }
];

/**
 * Calculate returns over a period
 */
function calculateReturn(prices: number[]): number {
  if (prices.length < 2) return 0;
  const start = prices[0];
  const end = prices[prices.length - 1];
  return ((end - start) / start) * 100;
}

/**
 * Calculate relative strength vs S&P 500
 * Positive = outperforming, Negative = underperforming
 */
function calculateRelativeStrength(
  sectorReturn: number,
  marketReturn: number
): number {
  return sectorReturn - marketReturn;
}

/**
 * Determine momentum based on recent performance
 */
function determineMomentum(
  oneWeek: number,
  oneMonth: number,
  threeMonth: number
): 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down' {
  const avgReturn = (oneWeek + oneMonth + threeMonth) / 3;
  
  if (avgReturn > 5 && oneWeek > 2) return 'strong_up';
  if (avgReturn > 2) return 'up';
  if (avgReturn < -5 && oneWeek < -2) return 'strong_down';
  if (avgReturn < -2) return 'down';
  return 'neutral';
}

/**
 * Get sector rotation data
 */
export async function getSectorRotationData(): Promise<SectorData[]> {
  try {
    // Fetch S&P 500 data for relative strength calculation
    const sp500Quote = await getStockQuote('^GSPC');
    const sp500History = await getChartData('^GSPC', '1y', '1d');
    
    if (!sp500History || !sp500History.dataPoints || sp500History.dataPoints.length === 0) {
      throw new Error('Failed to fetch S&P 500 data');
    }
    
    const sp500Prices = sp500History.dataPoints.map(dp => dp.close);
    
    // Calculate S&P 500 returns for different periods
    const sp500Returns = {
      oneWeek: calculateReturn(sp500Prices.slice(-5)),
      oneMonth: calculateReturn(sp500Prices.slice(-21)),
      threeMonth: calculateReturn(sp500Prices.slice(-63)),
      sixMonth: calculateReturn(sp500Prices.slice(-126)),
      oneYear: calculateReturn(sp500Prices)
    };
    
    // Fetch data for all sector ETFs
    const sectorDataPromises = SECTOR_ETFS.map(async (sector) => {
      try {
        const quote = await getStockQuote(sector.ticker);
        const history = await getChartData(sector.ticker, '1y', '1d');
        
        if (!history || !history.dataPoints || history.dataPoints.length === 0) {
          console.warn(`No history data for ${sector.ticker}`);
          return null;
        }
        
        const prices = history.dataPoints.map(dp => dp.close);
        
        // Calculate returns for different periods
        const performance = {
          oneWeek: calculateReturn(prices.slice(-5)),
          oneMonth: calculateReturn(prices.slice(-21)),
          threeMonth: calculateReturn(prices.slice(-63)),
          sixMonth: calculateReturn(prices.slice(-126)),
          oneYear: calculateReturn(prices)
        };
        
        // Calculate relative strength vs S&P 500 (using 3-month return)
        const relativeStrength = calculateRelativeStrength(
          performance.threeMonth,
          sp500Returns.threeMonth
        );
        
        // Determine momentum
        const momentum = determineMomentum(
          performance.oneWeek,
          performance.oneMonth,
          performance.threeMonth
        );
        
        return {
          ticker: sector.ticker,
          name: sector.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          relativeStrength,
          momentum,
          performance
        };
      } catch (error) {
        console.error(`Error fetching data for ${sector.ticker}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(sectorDataPromises);
    
    // Filter out null results and sort by relative strength
    return results
      .filter((data): data is SectorData => data !== null)
      .sort((a, b) => b.relativeStrength - a.relativeStrength);
      
  } catch (error) {
    console.error('Error in getSectorRotationData:', error);
    throw error;
  }
}

/**
 * Get top performing sectors
 */
export async function getTopSectors(count: number = 3): Promise<SectorData[]> {
  const allSectors = await getSectorRotationData();
  return allSectors.slice(0, count);
}

/**
 * Get bottom performing sectors
 */
export async function getBottomSectors(count: number = 3): Promise<SectorData[]> {
  const allSectors = await getSectorRotationData();
  return allSectors.slice(-count).reverse();
}
