import { describe, it, expect, vi } from 'vitest';
import { getEarningsCalendar, getDividendCalendar } from './economicCalendarService';

// Mock the dataApi
vi.mock('../_core/dataApi', () => ({
  callDataApi: vi.fn().mockResolvedValue({
    earningsChart: {
      result: [{
        earningsDate: []
      }]
    }
  })
}));

describe('economicCalendarService', () => {
  it('should fetch earnings calendar', async () => {
    const earnings = await getEarningsCalendar('AAPL');
    
    expect(Array.isArray(earnings)).toBe(true);
  });

  it('should fetch dividend calendar', async () => {
    const dividends = await getDividendCalendar('AAPL');
    
    expect(Array.isArray(dividends)).toBe(true);
  });
});
