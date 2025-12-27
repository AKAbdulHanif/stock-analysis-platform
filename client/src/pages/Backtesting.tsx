import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, Play, Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

interface BacktestConfig {
  tickers: string[];
  allocations: { [ticker: string]: number };
  startDate: string;
  endDate: string;
  initialCapital: number;
  rebalancingFrequency: "monthly" | "quarterly" | "annually" | "none";
}

interface BacktestResults {
  config: BacktestConfig;
  snapshots: Array<{
    date: string;
    value: number;
    holdings: { [ticker: string]: { shares: number; value: number } };
  }>;
  metrics: {
    totalReturn: number;
    cagr: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    finalValue: number;
  };
  benchmark: {
    ticker: string;
    totalReturn: number;
    cagr: number;
    volatility: number;
    finalValue: number;
  };
  annualReturns: Array<{ year: number; return: number }>;
}

export default function Backtesting() {
  const [tickers, setTickers] = useState<string[]>(["AAPL", "NVDA", "TSM"]);
  const [tickerInput, setTickerInput] = useState("");
  const [allocations, setAllocations] = useState<{ [ticker: string]: number }>({
    AAPL: 33.33,
    NVDA: 33.33,
    TSM: 33.34,
  });
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [initialCapital, setInitialCapital] = useState(10000);
  const [rebalancingFrequency, setRebalancingFrequency] = useState<
    "monthly" | "quarterly" | "annually" | "none"
  >("quarterly");
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [loading, setLoading] = useState(false);

  const addTicker = () => {
    const ticker = tickerInput.trim().toUpperCase();
    if (!ticker) return;

    if (tickers.includes(ticker)) {
      toast.error(`${ticker} is already in the portfolio`);
      return;
    }

    // Add ticker with equal allocation
    const newTickers = [...tickers, ticker];
    const equalAllocation = 100 / newTickers.length;
    const newAllocations: { [ticker: string]: number } = {};
    newTickers.forEach((t) => {
      newAllocations[t] = equalAllocation;
    });

    setTickers(newTickers);
    setAllocations(newAllocations);
    setTickerInput("");
    toast.success(`Added ${ticker} to portfolio`);
  };

  const removeTicker = (ticker: string) => {
    const newTickers = tickers.filter((t) => t !== ticker);
    if (newTickers.length === 0) {
      toast.error("Portfolio must have at least one stock");
      return;
    }

    // Redistribute allocations
    const equalAllocation = 100 / newTickers.length;
    const newAllocations: { [ticker: string]: number } = {};
    newTickers.forEach((t) => {
      newAllocations[t] = equalAllocation;
    });

    setTickers(newTickers);
    setAllocations(newAllocations);
    toast.success(`Removed ${ticker} from portfolio`);
  };

  const updateAllocation = (ticker: string, value: number) => {
    setAllocations({
      ...allocations,
      [ticker]: value,
    });
  };

  const runBacktest = async () => {
    // Validate allocations sum to 100%
    const totalAllocation = Object.values(allocations).reduce(
      (sum, val) => sum + val,
      0
    );
    if (Math.abs(totalAllocation - 100) > 0.01) {
      toast.error("Allocations must sum to 100%");
      return;
    }

    setLoading(true);
    try {
      const config: BacktestConfig = {
        tickers,
        allocations,
        startDate,
        endDate,
        initialCapital,
        rebalancingFrequency,
      };

      const response = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to run backtest");
      }

      const data = await response.json();
      setResults(data);
      toast.success("Backtest completed successfully!");
    } catch (error) {
      console.error("Error running backtest:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to run backtest"
      );
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const portfolioChartData = results?.snapshots.map((snapshot) => ({
    date: new Date(snapshot.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    portfolio: snapshot.value,
    benchmark:
      (results.benchmark.finalValue / results.snapshots[results.snapshots.length - 1].value) *
      snapshot.value,
  }));

  const annualReturnsChartData = results?.annualReturns.map((ar) => ({
    year: ar.year.toString(),
    return: ar.return,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">
              Portfolio Backtesting
            </h1>
            <p className="text-slate-400">
              Test your investment strategies against historical market data
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1 p-6 bg-slate-900/50 border-slate-800">
            <h2 className="text-xl font-semibold text-white mb-4">
              Strategy Configuration
            </h2>

            {/* Portfolio Stocks */}
            <div className="mb-6">
              <Label className="text-slate-300 mb-2">Portfolio Stocks</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && addTicker()}
                  placeholder="Enter ticker (e.g., AAPL)"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button onClick={addTicker} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Stock List with Allocations */}
              <div className="space-y-2">
                {tickers.map((ticker) => (
                  <div
                    key={ticker}
                    className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">{ticker}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={allocations[ticker]}
                          onChange={(e) =>
                            updateAllocation(ticker, parseFloat(e.target.value))
                          }
                          className="w-20 h-8 bg-slate-700 border-slate-600 text-white text-sm"
                          step="0.01"
                        />
                        <span className="text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTicker(ticker)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Total Allocation */}
              <div className="mt-3 p-2 bg-slate-800/30 rounded text-sm">
                <span className="text-slate-400">Total Allocation: </span>
                <span
                  className={
                    Math.abs(
                      Object.values(allocations).reduce(
                        (sum, val) => sum + val,
                        0
                      ) - 100
                    ) < 0.01
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {Object.values(allocations)
                    .reduce((sum, val) => sum + val, 0)
                    .toFixed(2)}
                  %
                </span>
              </div>
            </div>

            {/* Date Range */}
            <div className="mb-6">
              <Label className="text-slate-300 mb-2">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mb-3"
              />
              <Label className="text-slate-300 mb-2">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Initial Capital */}
            <div className="mb-6">
              <Label className="text-slate-300 mb-2">Initial Capital</Label>
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
                className="bg-slate-800 border-slate-700 text-white"
                step="1000"
              />
            </div>

            {/* Rebalancing Frequency */}
            <div className="mb-6">
              <Label className="text-slate-300 mb-2">
                Rebalancing Frequency
              </Label>
              <Select
                value={rebalancingFrequency}
                onValueChange={(value: any) => setRebalancingFrequency(value)}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="none">Buy & Hold (No Rebalancing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Run Button */}
            <Button
              onClick={runBacktest}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                "Running Backtest..."
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Backtest
                </>
              )}
            </Button>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!results ? (
              <Card className="p-12 bg-slate-900/50 border-slate-800 text-center">
                <div className="text-slate-400 mb-4">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    No Backtest Results Yet
                  </h3>
                  <p>
                    Configure your portfolio strategy on the left and click "Run
                    Backtest" to see historical performance analysis.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-slate-900/50 border-slate-800">
                    <div className="text-slate-400 text-sm mb-1">
                      Total Return
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        results.metrics.totalReturn >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {results.metrics.totalReturn >= 0 ? "+" : ""}
                      {results.metrics.totalReturn.toFixed(2)}%
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/50 border-slate-800">
                    <div className="text-slate-400 text-sm mb-1">CAGR</div>
                    <div className="text-2xl font-bold text-white">
                      {results.metrics.cagr.toFixed(2)}%
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/50 border-slate-800">
                    <div className="text-slate-400 text-sm mb-1">
                      Sharpe Ratio
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {results.metrics.sharpeRatio.toFixed(2)}
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/50 border-slate-800">
                    <div className="text-slate-400 text-sm mb-1">
                      Volatility
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {results.metrics.volatility.toFixed(2)}%
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/50 border-slate-800">
                    <div className="text-slate-400 text-sm mb-1">
                      Max Drawdown
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      -{results.metrics.maxDrawdown.toFixed(2)}%
                    </div>
                  </Card>

                  <Card className="p-4 bg-slate-900/50 border-slate-800">
                    <div className="text-slate-400 text-sm mb-1">
                      Final Value
                    </div>
                    <div className="text-2xl font-bold text-white">
                      ${results.metrics.finalValue.toLocaleString()}
                    </div>
                  </Card>
                </div>

                {/* Charts */}
                <Tabs defaultValue="portfolio" className="w-full">
                  <TabsList className="bg-slate-800 border-slate-700">
                    <TabsTrigger value="portfolio">Portfolio Value</TabsTrigger>
                    <TabsTrigger value="benchmark">vs Benchmark</TabsTrigger>
                    <TabsTrigger value="annual">Annual Returns</TabsTrigger>
                  </TabsList>

                  <TabsContent value="portfolio">
                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Portfolio Value Over Time
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={portfolioChartData}>
                          <defs>
                            <linearGradient
                              id="portfolioGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3b82f6"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3b82f6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#94a3b8" />
                          <YAxis
                            stroke="#94a3b8"
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e293b",
                              border: "1px solid #475569",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [
                              `$${value.toLocaleString()}`,
                              "Portfolio Value",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="portfolio"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#portfolioGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </TabsContent>

                  <TabsContent value="benchmark">
                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Portfolio vs S&P 500 Benchmark
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={portfolioChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#94a3b8" />
                          <YAxis
                            stroke="#94a3b8"
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e293b",
                              border: "1px solid #475569",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => `$${value.toLocaleString()}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="portfolio"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Your Portfolio"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="benchmark"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="S&P 500"
                            dot={false}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Benchmark Comparison Table */}
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 text-sm mb-2">
                            Your Portfolio
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Return:</span>
                              <span
                                className={
                                  results.metrics.totalReturn >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {results.metrics.totalReturn.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">CAGR:</span>
                              <span className="text-white">
                                {results.metrics.cagr.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Volatility:</span>
                              <span className="text-white">
                                {results.metrics.volatility.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-400 text-sm mb-2">
                            S&P 500 Benchmark
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-slate-300">Return:</span>
                              <span
                                className={
                                  results.benchmark.totalReturn >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {results.benchmark.totalReturn.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">CAGR:</span>
                              <span className="text-white">
                                {results.benchmark.cagr.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-300">Volatility:</span>
                              <span className="text-white">
                                {results.benchmark.volatility.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="annual">
                    <Card className="p-6 bg-slate-900/50 border-slate-800">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Annual Returns
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={annualReturnsChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="year" stroke="#94a3b8" />
                          <YAxis
                            stroke="#94a3b8"
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e293b",
                              border: "1px solid #475569",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [
                              `${value.toFixed(2)}%`,
                              "Return",
                            ]}
                          />
                          <Bar
                            dataKey="return"
                            fill="#3b82f6"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
