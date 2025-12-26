/**
 * Performance Dashboard Page
 * 
 * Displays portfolio performance metrics and comparison with S&P 500 benchmark
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Activity,
  Target,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PerformanceMetrics {
  totalReturn: number;
  dailyReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentValue: number;
  initialValue: number;
}

interface PerformanceDataPoint {
  date: string;
  value: number;
  return: number;
  cumulativeReturn: number;
}

interface BenchmarkDataPoint {
  date: string;
  price: number;
  return: number;
}

interface BenchmarkComparison {
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  outperformance: boolean;
}

interface StockAllocation {
  ticker: string;
  value: number;
  percentage: number;
  sector: string;
}

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
}

interface AllocationData {
  byStock: StockAllocation[];
  bySector: SectorAllocation[];
  totalValue: number;
}

// Color palette for pie chart
const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#14b8a6", // teal
];

export default function Performance() {
  const [watchlistId] = useState(1); // Default to first watchlist
  const [period, setPeriod] = useState<30 | 90 | 180 | 365>(30);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<PerformanceDataPoint[]>([]);
  const [benchmarkHistory, setBenchmarkHistory] = useState<BenchmarkDataPoint[]>([]);
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null);
  const [allocation, setAllocation] = useState<AllocationData | null>(null);
  const [allocationView, setAllocationView] = useState<"stock" | "sector">("stock");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [period]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch portfolio metrics
      const metricsRes = await fetch(`/api/performance/${watchlistId}?days=${period}`);
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      // Fetch portfolio history
      const historyRes = await fetch(`/api/performance/${watchlistId}/history?days=${period}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setPortfolioHistory(
          historyData.map((d: any) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          }))
        );
      }

      // Fetch benchmark history
      const benchmarkRes = await fetch(`/api/performance/benchmark/history?days=${period}`);
      if (benchmarkRes.ok) {
        const benchmarkData = await benchmarkRes.json();
        setBenchmarkHistory(
          benchmarkData.map((d: any) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          }))
        );
      }

      // Fetch comparison
      const comparisonRes = await fetch(`/api/performance/${watchlistId}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: period }),
      });
      if (comparisonRes.ok) {
        const comparisonData = await comparisonRes.json();
        setComparison(comparisonData);
      }

      // Fetch allocation data
      const allocationRes = await fetch(`/api/performance/${watchlistId}/allocation`);
      if (allocationRes.ok) {
        const allocationData = await allocationRes.json();
        setAllocation(allocationData);
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recordSnapshot = async () => {
    try {
      const res = await fetch(`/api/performance/${watchlistId}/snapshot`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchPerformanceData();
      }
    } catch (error) {
      console.error("Error recording snapshot:", error);
    }
  };

  const fetchBenchmarkData = async () => {
    try {
      await fetch("/api/performance/benchmark/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: period }),
      });
      await fetchPerformanceData();
    } catch (error) {
      console.error("Error fetching benchmark data:", error);
    }
  };

  // Combine portfolio and benchmark data for comparison chart
  const combinedChartData = portfolioHistory.map((p, index) => {
    const benchmark = benchmarkHistory[index];
    return {
      date: p.date,
      portfolio: p.cumulativeReturn,
      benchmark: benchmark ? ((benchmark.price - benchmarkHistory[benchmarkHistory.length - 1].price) / benchmarkHistory[benchmarkHistory.length - 1].price) * 100 : 0,
    };
  }).reverse();

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-slate-400">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Performance</h1>
          <p className="text-slate-400">Track your returns and compare against the S&P 500</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={recordSnapshot}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Activity className="w-4 h-4 mr-2" />
            Record Snapshot
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBenchmarkData}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Benchmark
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2 mb-6">
        {[30, 90, 180, 365].map((days) => (
          <Button
            key={days}
            variant={period === days ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod(days as any)}
            className={period === days ? "bg-green-600 hover:bg-green-700" : "text-slate-400 hover:text-white"}
          >
            {days === 30 ? "1M" : days === 90 ? "3M" : days === 180 ? "6M" : "1Y"}
          </Button>
        ))}
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Total Return</p>
              {metrics.totalReturn >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
              {metrics.totalReturn.toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ${metrics.initialValue.toFixed(2)} → ${metrics.currentValue.toFixed(2)}
            </p>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Daily Return</p>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className={`text-2xl font-bold ${metrics.dailyReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
              {metrics.dailyReturn.toFixed(2)}%
            </p>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Volatility</p>
              <BarChart3 className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.volatility.toFixed(2)}%</p>
            <p className="text-xs text-slate-500 mt-1">Annualized</p>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Sharpe Ratio</p>
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">{metrics.sharpeRatio.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">Risk-adjusted return</p>
          </Card>
        </div>
      )}

      {/* Benchmark Comparison */}
      {comparison && (
        <Card className="bg-slate-900/50 border-slate-800 p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">S&P 500 Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Portfolio Return</p>
              <p className={`text-xl font-bold ${comparison.portfolioReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                {comparison.portfolioReturn.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">S&P 500 Return</p>
              <p className={`text-xl font-bold ${comparison.benchmarkReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                {comparison.benchmarkReturn.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Alpha</p>
              <p className={`text-xl font-bold ${comparison.alpha >= 0 ? "text-green-400" : "text-red-400"}`}>
                {comparison.alpha.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {comparison.outperformance ? "Outperforming" : "Underperforming"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Beta</p>
              <p className="text-xl font-bold text-white">{comparison.beta.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">Relative volatility</p>
            </div>
          </div>
        </Card>
      )}

      {/* Portfolio Allocation Pie Chart */}
      {allocation && (
        <Card className="bg-slate-900/50 border-slate-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Portfolio Allocation</h3>
            <div className="flex gap-2">
              <Button
                variant={allocationView === "stock" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAllocationView("stock")}
                className={allocationView === "stock" ? "bg-green-600 hover:bg-green-700" : "text-slate-400 hover:text-white"}
              >
                By Stock
              </Button>
              <Button
                variant={allocationView === "sector" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAllocationView("sector")}
                className={allocationView === "sector" ? "bg-green-600 hover:bg-green-700" : "text-slate-400 hover:text-white"}
              >
                By Sector
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationView === "stock" ? allocation.byStock : allocation.bySector}
                  dataKey="percentage"
                  nameKey={allocationView === "stock" ? "ticker" : "sector"}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                  labelLine={false}
                >
                  {(allocationView === "stock" ? allocation.byStock : allocation.bySector).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(2)}% ($${props.payload.value.toFixed(2)})`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Allocation Table */}
            <div className="space-y-2">
              <div className="text-sm text-slate-400 mb-3">
                Total Portfolio Value: <span className="text-white font-semibold">${allocation.totalValue.toFixed(2)}</span>
              </div>
              <div className="max-h-[260px] overflow-y-auto space-y-2">
                {(allocationView === "stock" ? allocation.byStock : allocation.bySector).map((item, index) => (
                  <div
                    key={allocationView === "stock" ? (item as StockAllocation).ticker : (item as SectorAllocation).sector}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="text-white font-medium">
                          {allocationView === "stock" ? (item as StockAllocation).ticker : (item as SectorAllocation).sector}
                        </p>
                        {allocationView === "stock" && (
                          <p className="text-xs text-slate-400">{(item as StockAllocation).sector}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{item.percentage.toFixed(1)}%</p>
                      <p className="text-xs text-slate-400">${item.value.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Performance Chart */}
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Portfolio vs S&P 500</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, ""]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#10b981"
              strokeWidth={2}
              name="Portfolio"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#3b82f6"
              strokeWidth={2}
              name="S&P 500"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
