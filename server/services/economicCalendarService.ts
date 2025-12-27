/**
 * Economic Calendar Service
 * Fetches earnings dates, dividend payments, and other key events for stocks
 */

import yahooFinance from 'yahoo-finance2';

export interface CalendarEvent {
  id: string;
  ticker: string;
  type: 'earnings' | 'dividend' | 'split' | 'economic';
  title: string;
  date: string;
  timestamp: number;
  description: string;
  importance: 'high' | 'medium' | 'low';
  metadata?: {
    earningsTime?: 'BMO' | 'AMC' | 'Unknown'; // Before Market Open, After Market Close
    dividendAmount?: number;
    exDividendDate?: string;
    splitRatio?: string;
  };
}

/**
 * Get upcoming events for a specific stock
 */
export async function getStockEvents(ticker: string): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  try {
    // Fetch quote summary with calendar events
    const quoteSummary = await yahooFinance.quoteSummary(ticker, {
      modules: ['calendarEvents', 'summaryDetail']
    });

    // Extract earnings date
    if (quoteSummary.calendarEvents?.earnings) {
      const earningsData = quoteSummary.calendarEvents.earnings;
      
      if (earningsData.earningsDate && earningsData.earningsDate.length > 0) {
        const earningsDate = earningsData.earningsDate[0];
        
        events.push({
          id: `${ticker}-earnings-${earningsDate.getTime()}`,
          ticker,
          type: 'earnings',
          title: `${ticker} Earnings Report`,
          date: earningsDate.toISOString().split('T')[0],
          timestamp: earningsDate.getTime(),
          description: `Quarterly earnings report for ${ticker}`,
          importance: 'high',
          metadata: {
            earningsTime: determineEarningsTime(earningsDate)
          }
        });
      }
    }

    // Extract dividend information
    if (quoteSummary.summaryDetail) {
      const { dividendDate, exDividendDate, dividendRate } = quoteSummary.summaryDetail;
      
      if (dividendDate) {
        events.push({
          id: `${ticker}-dividend-${dividendDate.getTime()}`,
          ticker,
          type: 'dividend',
          title: `${ticker} Dividend Payment`,
          date: dividendDate.toISOString().split('T')[0],
          timestamp: dividendDate.getTime(),
          description: `Dividend payment date for ${ticker}`,
          importance: 'medium',
          metadata: {
            dividendAmount: dividendRate,
            exDividendDate: exDividendDate?.toISOString().split('T')[0]
          }
        });
      }

      // Add ex-dividend date as separate event if available
      if (exDividendDate && exDividendDate.getTime() > Date.now()) {
        events.push({
          id: `${ticker}-exdividend-${exDividendDate.getTime()}`,
          ticker,
          type: 'dividend',
          title: `${ticker} Ex-Dividend Date`,
          date: exDividendDate.toISOString().split('T')[0],
          timestamp: exDividendDate.getTime(),
          description: `Last day to buy ${ticker} to receive upcoming dividend`,
          importance: 'medium',
          metadata: {
            dividendAmount: dividendRate
          }
        });
      }
    }

  } catch (error) {
    console.error(`[Economic Calendar] Error fetching events for ${ticker}:`, error);
  }

  // Sort events by date (earliest first)
  return events.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get upcoming events for multiple stocks
 */
export async function getMultipleStockEvents(tickers: string[]): Promise<CalendarEvent[]> {
  const allEvents: CalendarEvent[] = [];

  for (const ticker of tickers) {
    try {
      const events = await getStockEvents(ticker);
      allEvents.push(...events);
    } catch (error) {
      console.error(`[Economic Calendar] Error fetching events for ${ticker}:`, error);
    }
  }

  // Sort all events by date
  return allEvents.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  return events.filter(event => 
    event.timestamp >= startTimestamp && event.timestamp <= endTimestamp
  );
}

/**
 * Get upcoming events (next N days)
 */
export function getUpcomingEvents(events: CalendarEvent[], days: number = 30): CalendarEvent[] {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return filterEventsByDateRange(events, now, future);
}

/**
 * Determine if earnings are before market open (BMO) or after market close (AMC)
 */
function determineEarningsTime(date: Date): 'BMO' | 'AMC' | 'Unknown' {
  const hours = date.getHours();
  
  // If time is before 9:30 AM ET, it's BMO
  if (hours < 9 || (hours === 9 && date.getMinutes() < 30)) {
    return 'BMO';
  }
  
  // If time is after 4:00 PM ET, it's AMC
  if (hours >= 16) {
    return 'AMC';
  }
  
  return 'Unknown';
}

/**
 * Calculate days until event
 */
export function getDaysUntilEvent(event: CalendarEvent): number {
  const now = Date.now();
  const eventTime = event.timestamp;
  const diff = eventTime - now;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format event date for display
 */
export function formatEventDate(event: CalendarEvent): string {
  const date = new Date(event.timestamp);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get event importance color
 */
export function getEventImportanceColor(importance: CalendarEvent['importance']): string {
  switch (importance) {
    case 'high':
      return '#ef4444'; // red-500
    case 'medium':
      return '#f59e0b'; // amber-500
    case 'low':
      return '#10b981'; // green-500
    default:
      return '#6b7280'; // gray-500
  }
}
