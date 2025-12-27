import { describe, it, expect, vi } from 'vitest';
import { runMonteCarloSimulation } from './monteCarloService';

// Mock the dataApi and chartService
vi.mock('../_core/dataApi', () => ({
  callDataApi: vi.fn().mockResolvedValue({
    chart: {
      result: [{
        timestamp: Array.from({length: 500}, (_, i) => Date.now()/1000 - i*86400),
        indicators: {
          quote: [{
            close: Array.from({length: 500}, () => 100 + Math.random() * 20)
          }]
        }
      }]
    }
  })
}));

vi.mock('./chartService', () => ({
  getChartData: vi.fn().mockResolvedValue({
    dataPoints: Array.from({length: 500}, (_, i) => ({
      date: new Date(Date.now() - i*86400000).toISOString(),
      close: 100 + Math.random() * 20
    }))
  })
}));

describe('monteCarloService', () => {
  it('should run Monte Carlo simulation with correct config', async () => {
    const config = {
      tickers: ['AAPL'],
      allocations: [1.0],
      timeHorizonYears: 5,
      simulationsCount: 100,
      initialCapital: 100000,
    };
    
    const results = await runMonteCarloSimulation(config);
    
    expect(results).toBeDefined();
    expect(results.finalValues).toBeDefined();
    expect(results.percentiles).toBeDefined();
    expect(results.probabilities).toBeDefined();
  });

  it('should handle multiple tickers', async () => {
    const config = {
      tickers: ['AAPL', 'GOOGL'],
      allocations: [0.6, 0.4],
      timeHorizonYears: 3,
      simulationsCount: 50,
      initialCapital: 50000,
    };
    
    const results = await runMonteCarloSimulation(config);
    
    expect(results.finalValues.mean).toBeGreaterThan(0);
  });
});
