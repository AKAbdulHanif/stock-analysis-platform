import { describe, it, expect, vi } from 'vitest';
import { analyzeSectorRotation, getSectorPerformance } from './sectorRotationService';

// Mock the dataApi
vi.mock('../_core/dataApi', () => ({
  callDataApi: vi.fn().mockResolvedValue({
    chart: {
      result: [{
        meta: { regularMarketPrice: 100 },
        timestamp: [Date.now() / 1000],
        indicators: {
          quote: [{
            close: [100]
          }]
        }
      }]
    }
  })
}));

describe('sectorRotationService', () => {
  it('should analyze sector rotation', async () => {
    const rotation = await analyzeSectorRotation();
    
    expect(rotation).toBeDefined();
    expect(Array.isArray(rotation.sectors)).toBe(true);
  });

  it('should get sector performance', async () => {
    const performance = await getSectorPerformance('Technology');
    
    expect(performance).toBeDefined();
  });
});
