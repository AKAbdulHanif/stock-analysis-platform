import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, Target, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface Stock {
  ticker: string;
  allocation: number;
}

interface SimulationResult {
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  finalValues: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    mean: number;
    worst: number;
    best: number;
  };
  probabilities: {
    positiveReturn: number;
    doubleReturn: number;
    lossGreaterThan20: number;
    lossGreaterThan50: number;
  };
  expectedValue: number;
  expectedReturn: number;
  riskMetrics: {
    volatility: number;
    valueAtRisk95: number;
    conditionalValueAtRisk95: number;
  };
}

export default function MonteCarloSimulation() {
  const [stocks, setStocks] = useState<Stock[]>([
    { ticker: 'AAPL', allocation: 33.33 },
    { ticker: 'NVDA', allocation: 33.33 },
    { ticker: 'TSM', allocation: 33.34 },
  ]);
  const [newTicker, setNewTicker] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('5');
  const [simulationsCount, setSimulationsCount] = useState('10000');
  const [initialCapital, setInitialCapital] = useState('10000');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const addStock = () => {
    if (!newTicker.trim()) {
      toast.error('Please enter a ticker');
      return;
    }
    
    const ticker = newTicker.trim().toUpperCase();
    if (stocks.some(s => s.ticker === ticker)) {
      toast.error('Stock already added');
      return;
    }

    setStocks([...stocks, { ticker, allocation: 0 }]);
    setNewTicker('');
  };

  const removeStock = (ticker: string) => {
    setStocks(stocks.filter(s => s.ticker !== ticker));
  };

  const updateAllocation = (ticker: string, allocation: number) => {
    setStocks(stocks.map(s => s.ticker === ticker ? { ...s, allocation } : s));
  };

  const totalAllocation = stocks.reduce((sum, s) => sum + s.allocation, 0);
  const isValidAllocation = Math.abs(totalAllocation - 100) < 0.01;

  const runSimulation = async () => {
    if (!isValidAllocation) {
      toast.error('Total allocation must equal 100%');
      return;
    }

    if (stocks.length === 0) {
      toast.error('Please add at least one stock');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/monte-carlo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers: stocks.map(s => s.ticker),
          allocations: stocks.map(s => s.allocation / 100),
          timeHorizonYears: parseInt(timeHorizon),
          simulationsCount: parseInt(simulationsCount),
          initialCapital: parseFloat(initialCapital),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run simulation');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Simulation completed successfully!');
    } catch (error) {
      console.error('Simulation error:', error);
      toast.error('Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = result ? result.percentiles.p50.map((_, index) => ({
    day: index,
    p10: result.percentiles.p10[index],
    p25: result.percentiles.p25[index],
    p50: result.percentiles.p50[index],
    p75: result.percentiles.p75[index],
    p90: result.percentiles.p90[index],
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Monte Carlo Simulation</h1>
          <p className="text-blue-200">
            Probabilistic portfolio forecasting with confidence intervals
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Simulation Configuration</h2>

            {/* Portfolio Stocks */}
            <div className="mb-6">
              <Label className="text-white mb-2">Portfolio Stocks</Label>
              <div className="space-y-2 mb-3">
                {stocks.map((stock) => (
                  <div key={stock.ticker} className="flex items-center gap-2">
                    <Input
                      value={stock.ticker}
                      disabled
                      className="flex-1 bg-slate-700 border-slate-600 text-white"
                    />
                    <Input
                      type="number"
                      value={stock.allocation}
                      onChange={(e) => updateAllocation(stock.ticker, parseFloat(e.target.value) || 0)}
                      className="w-24 bg-slate-700 border-slate-600 text-white"
                      placeholder="%"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeStock(stock.ticker)}
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addStock()}
                  placeholder="Enter ticker"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button onClick={addStock} className="bg-blue-600 hover:bg-blue-700">
                  Add
                </Button>
              </div>
              <div className={`text-sm font-medium ${isValidAllocation ? 'text-green-400' : 'text-red-400'}`}>
                Total Allocation: {totalAllocation.toFixed(2)}%
              </div>
            </div>

            {/* Time Horizon */}
            <div className="mb-4">
              <Label className="text-white mb-2">Time Horizon</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                  <SelectItem value="20">20 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Simulations Count */}
            <div className="mb-4">
              <Label className="text-white mb-2">Simulations Count</Label>
              <Select value={simulationsCount} onValueChange={setSimulationsCount}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1,000</SelectItem>
                  <SelectItem value="5000">5,000</SelectItem>
                  <SelectItem value="10000">10,000</SelectItem>
                  <SelectItem value="20000">20,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Initial Capital */}
            <div className="mb-6">
              <Label className="text-white mb-2">Initial Capital</Label>
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="$10,000"
              />
            </div>

            <Button
              onClick={runSimulation}
              disabled={loading || !isValidAllocation}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
          </Card>

          {/* Right Panel - Results */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700 p-6">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center">
                <TrendingUp className="w-16 h-16 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Simulation Results Yet</h3>
                <p className="text-slate-400 max-w-md">
                  Configure your portfolio on the left and click "Run Simulation" to see probabilistic forecasts
                  with confidence intervals.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-700/50 border-slate-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">Expected Value</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      ${result.expectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-sm ${result.expectedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {result.expectedReturn >= 0 ? '+' : ''}{result.expectedReturn.toFixed(2)}%
                    </div>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-300">Volatility</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {result.riskMetrics.volatility.toFixed(2)}%
                    </div>
                    <div className="text-sm text-slate-400">Annualized</div>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-slate-300">Value at Risk (95%)</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      ${result.riskMetrics.valueAtRisk95.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-slate-400">Maximum loss</div>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">Best Case</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      ${result.finalValues.best.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-green-400">
                      +{(((result.finalValues.best - parseFloat(initialCapital)) / parseFloat(initialCapital)) * 100).toFixed(0)}%
                    </div>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-300">Median (50th)</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      ${result.finalValues.p50.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-sm ${result.finalValues.p50 >= parseFloat(initialCapital) ? 'text-green-400' : 'text-red-400'}`}>
                      {result.finalValues.p50 >= parseFloat(initialCapital) ? '+' : ''}
                      {(((result.finalValues.p50 - parseFloat(initialCapital)) / parseFloat(initialCapital)) * 100).toFixed(0)}%
                    </div>
                  </Card>

                  <Card className="bg-slate-700/50 border-slate-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-slate-300">Worst Case</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      ${result.finalValues.worst.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-red-400">
                      {(((result.finalValues.worst - parseFloat(initialCapital)) / parseFloat(initialCapital)) * 100).toFixed(0)}%
                    </div>
                  </Card>
                </div>

                {/* Fan Chart */}
                <Card className="bg-slate-700/30 border-slate-600 p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Portfolio Value Forecast (Confidence Intervals)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        label={{ value: 'Trading Days', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, '']}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="p90"
                        stroke="none"
                        fill="#3b82f6"
                        fillOpacity={0.1}
                        name="90th Percentile"
                      />
                      <Area
                        type="monotone"
                        dataKey="p75"
                        stroke="none"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        name="75th Percentile"
                      />
                      <Area
                        type="monotone"
                        dataKey="p50"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="Median (50th)"
                      />
                      <Area
                        type="monotone"
                        dataKey="p25"
                        stroke="none"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        name="25th Percentile"
                      />
                      <Area
                        type="monotone"
                        dataKey="p10"
                        stroke="none"
                        fill="#3b82f6"
                        fillOpacity={0.1}
                        name="10th Percentile"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Probability Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-green-900/30 border-green-700 p-4">
                    <div className="text-sm text-green-300 mb-1">Positive Return</div>
                    <div className="text-3xl font-bold text-green-400">
                      {result.probabilities.positiveReturn.toFixed(1)}%
                    </div>
                  </Card>

                  <Card className="bg-blue-900/30 border-blue-700 p-4">
                    <div className="text-sm text-blue-300 mb-1">Double Return (2x)</div>
                    <div className="text-3xl font-bold text-blue-400">
                      {result.probabilities.doubleReturn.toFixed(1)}%
                    </div>
                  </Card>

                  <Card className="bg-yellow-900/30 border-yellow-700 p-4">
                    <div className="text-sm text-yellow-300 mb-1">Loss &gt; 20%</div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {result.probabilities.lossGreaterThan20.toFixed(1)}%
                    </div>
                  </Card>

                  <Card className="bg-red-900/30 border-red-700 p-4">
                    <div className="text-sm text-red-300 mb-1">Loss &gt; 50%</div>
                    <div className="text-3xl font-bold text-red-400">
                      {result.probabilities.lossGreaterThan50.toFixed(1)}%
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
