import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation, type SimulationParams } from './monteCarloService';

describe('monteCarloService', () => {
  it('should run Monte Carlo simulation', () => {
    const params: SimulationParams = {
      initialValue: 100000,
      expectedReturn: 0.08,
      volatility: 0.15,
      years: 10,
      simulations: 1000,
    };
    
    const results = runMonteCarloSimulation(params);
    
    expect(results).toBeDefined();
    expect(results.simulations).toBe(1000);
    expect(results.percentiles).toBeDefined();
    expect(results.mean).toBeGreaterThan(0);
  });

  it('should handle different simulation counts', () => {
    const params: SimulationParams = {
      initialValue: 50000,
      expectedReturn: 0.07,
      volatility: 0.12,
      years: 5,
      simulations: 500,
    };
    
    const results = runMonteCarloSimulation(params);
    
    expect(results.simulations).toBe(500);
  });
});
