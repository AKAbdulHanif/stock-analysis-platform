import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, Activity } from "lucide-react";
import { calculatePortfolioMetrics, calculateSectorAllocation, getStockPositions } from "@/lib/portfolioAnalytics";
import NewsFeed from "@/components/NewsFeed";

const SECTOR_COLORS: Record<string, string> = {
  "Semiconductors": "#3b82f6",
  "Healthcare": "#10b981",
  "Financials": "#f59e0b",
  "Precious Metals": "#ec4899",
  "Other": "#8b5cf6"
};

export default function PortfolioDashboard() {
  const metrics = useMemo(() => calculatePortfolioMetrics(), []);
  const sectors = useMemo(() => calculateSectorAllocation(), []);
  const positions = useMemo(() => getStockPositions(), []);

  const sectorChartData = sectors.map((s) => ({
    name: s.sector,
    value: s.percent,
    amount: s.value
  }));

  const positionChartData = positions.slice(0, 5).map((p) => ({
    name: p.ticker,
    value: p.currentValue,
    return: p.unrealizedReturnPercent
  }));

  const performanceData = [
    { name: "Invested", value: metrics.totalInvested },
    { name: "Current", value: metrics.currentValue }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Return */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-2">Total Return</p>
              <p className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ${Math.abs(metrics.totalReturn).toFixed(2)}
              </p>
              <p className={`text-sm mt-1 ${metrics.totalReturnPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {metrics.totalReturnPercent >= 0 ? "+" : ""}{metrics.totalReturnPercent.toFixed(2)}%
              </p>
            </div>
            {metrics.totalReturn >= 0 ? (
              <TrendingUp size={24} className="text-emerald-400" />
            ) : (
              <TrendingDown size={24} className="text-red-400" />
            )}
          </div>
        </Card>

        {/* Portfolio Value */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-2">Current Value</p>
              <p className="text-2xl font-bold text-white">
                ${metrics.currentValue.toFixed(0)}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Invested: ${metrics.totalInvested.toFixed(0)}
              </p>
            </div>
            <DollarSign size={24} className="text-blue-400" />
          </div>
        </Card>

        {/* Win Rate */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-2">Win Rate</p>
              <p className="text-2xl font-bold text-white">
                {metrics.winRate.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {metrics.activeTradesCount + metrics.closedTradesCount} trades
              </p>
            </div>
            <Target size={24} className="text-cyan-400" />
          </div>
        </Card>

        {/* Active Trades */}
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-2">Active Trades</p>
              <p className="text-2xl font-bold text-white">
                {metrics.activeTradesCount}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Closed: {metrics.closedTradesCount}
              </p>
            </div>
            <Activity size={24} className="text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Allocation */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Sector Allocation</h3>
          {sectors.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sectors.map((sector, index) => (
                    <Cell key={`cell-${index}`} fill={SECTOR_COLORS[sector.sector] || "#8b5cf6"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No trades yet
            </div>
          )}
        </Card>

        {/* Top Positions */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top 5 Positions</h3>
          {positions.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(value: any) => `$${value.toFixed(0)}`}
                />
                <Bar dataKey="value" fill="#3b82f6" name="Position Value" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No positions yet
            </div>
          )}
        </Card>
      </div>

      {/* Sector Details Table */}
      {sectors.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Sector Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Sector</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Value</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">% of Portfolio</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Trades</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Return</th>
                </tr>
              </thead>
              <tbody>
                {sectors.map((sector, index) => (
                  <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SECTOR_COLORS[sector.sector] || "#8b5cf6" }}
                        ></div>
                        {sector.sector}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-white">
                      ${sector.value.toFixed(0)}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300">
                      {sector.percent.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300">
                      {sector.tradeCount}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${sector.returnPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {sector.returnPercent >= 0 ? "+" : ""}{sector.returnPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* News Feed */}
      {positions.length > 0 && (
        <NewsFeed 
          tickers={positions.map(p => p.ticker)}
          limit={20}
          showFilter={true}
        />
      )}

      {/* Portfolio Summary */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Portfolio Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Best Trade</p>
            <p className={`text-lg font-semibold ${metrics.bestTrade >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${metrics.bestTrade.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Worst Trade</p>
            <p className={`text-lg font-semibold ${metrics.worstTrade >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${metrics.worstTrade.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Avg Return/Trade</p>
            <p className={`text-lg font-semibold ${metrics.averageReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${metrics.averageReturn.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Total Trades</p>
            <p className="text-lg font-semibold text-white">
              {metrics.activeTradesCount + metrics.closedTradesCount}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
