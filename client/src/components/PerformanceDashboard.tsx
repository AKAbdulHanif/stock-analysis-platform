import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, BarChart3, Zap, RefreshCw, Trash2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  getAllTemplatePerformance,
  getPerformanceStats,
  getTemplateTradeHistory,
  recordTradeEntry,
  closeTradeEntry,
  generateSampleTradeData,
  clearAllTradeData,
  calculateTradeReturn,
  type TemplatePerformance,
  type TradeEntry
} from "@/lib/performanceTracking";
import StrategyComparisonReport from "./StrategyComparisonReport";

export default function PerformanceDashboard() {
  const [templatePerformance, setTemplatePerformance] = useState<TemplatePerformance[]>([]);
  const [stats, setStats] = useState(getPerformanceStats());
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePerformance | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeEntry[]>([]);
  const [showSampleData, setShowSampleData] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = () => {
    const perf = getAllTemplatePerformance();
    setTemplatePerformance(perf);
    setStats(getPerformanceStats());
  };

  const handleLoadSampleData = () => {
    generateSampleTradeData();
    loadPerformanceData();
    setShowSampleData(true);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all trade data? This cannot be undone.")) {
      clearAllTradeData();
      loadPerformanceData();
      setShowSampleData(false);
    }
  };

  const handleSelectTemplate = (template: TemplatePerformance) => {
    setSelectedTemplate(template);
    const history = getTemplateTradeHistory(template.templateId);
    setTradeHistory(history);
  };

  const chartData = templatePerformance.map((t) => ({
    name: t.templateName,
    "Win Rate": t.winRate,
    "Avg Return": t.totalReturn,
    "Profit Factor": Math.min(t.profitFactor, 5) // Cap for visualization
  }));

  const winLossData = [
    { name: "Wins", value: stats.totalWins, fill: "#10b981" },
    { name: "Losses", value: stats.totalLosses, fill: "#ef4444" }
  ];

  const templateChartData = templatePerformance.map((t) => ({
    name: t.templateName,
    return: t.totalReturn,
    trades: t.totalTrades
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
          <BarChart3 size={18} />
          Performance Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Template Performance Analytics</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-slate-700 border-slate-600 p-4">
              <p className="text-slate-400 text-xs mb-1">Total Trades</p>
              <p className="text-white text-2xl font-bold">{stats.totalTrades}</p>
              <p className="text-slate-500 text-xs mt-1">{stats.closedTrades} closed, {stats.openTrades} open</p>
            </Card>
            <Card className="bg-slate-700 border-slate-600 p-4">
              <p className="text-slate-400 text-xs mb-1">Win Rate</p>
              <p className="text-emerald-400 text-2xl font-bold">{stats.overallWinRate.toFixed(1)}%</p>
              <p className="text-slate-500 text-xs mt-1">{stats.totalWins}W / {stats.totalLosses}L</p>
            </Card>
            <Card className="bg-slate-700 border-slate-600 p-4">
              <p className="text-slate-400 text-xs mb-1">Avg Return</p>
              <p className={`text-2xl font-bold ${stats.overallReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {stats.overallReturn.toFixed(2)}%
              </p>
              <p className="text-slate-500 text-xs mt-1">per trade</p>
            </Card>
            <Card className="bg-slate-700 border-slate-600 p-4">
              <p className="text-slate-400 text-xs mb-1">Best Template</p>
              <p className="text-blue-400 text-lg font-bold truncate">
                {stats.bestTemplate?.templateName || "N/A"}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {stats.bestTemplate ? `${stats.bestTemplate.totalReturn.toFixed(2)}%` : "No data"}
              </p>
            </Card>
          </div>

          {/* Sample Data Controls */}
          {templatePerformance.length === 0 && (
            <Card className="bg-blue-600/10 border-blue-600/30 p-4">
              <p className="text-blue-300 text-sm mb-3">
                <span className="font-semibold">💡 Demo Mode:</span> No trade data yet. Load sample data to explore the
                performance dashboard.
              </p>
              <Button
                onClick={handleLoadSampleData}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                size="sm"
              >
                Load Sample Trade Data
              </Button>
            </Card>
          )}

          {templatePerformance.length > 0 && (
            <>
              {/* Template Performance Table */}
              <div>
                <h3 className="text-white font-semibold mb-3">Template Performance Rankings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left text-slate-400 py-2 px-3">Template</th>
                        <th className="text-right text-slate-400 py-2 px-3">Trades</th>
                        <th className="text-right text-slate-400 py-2 px-3">Win Rate</th>
                        <th className="text-right text-slate-400 py-2 px-3">Avg Return</th>
                        <th className="text-right text-slate-400 py-2 px-3">Best Trade</th>
                        <th className="text-right text-slate-400 py-2 px-3">Worst Trade</th>
                        <th className="text-center text-slate-400 py-2 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templatePerformance.map((template) => (
                        <tr key={template.templateId} className="border-b border-slate-700 hover:bg-slate-700/30">
                          <td className="text-white py-3 px-3 font-semibold">{template.templateName}</td>
                          <td className="text-right text-slate-300 py-3 px-3">{template.totalTrades}</td>
                          <td className="text-right py-3 px-3">
                            <span className="text-emerald-400 font-semibold">{template.winRate.toFixed(1)}%</span>
                          </td>
                          <td className="text-right py-3 px-3">
                            <span
                              className={`font-semibold ${
                                template.totalReturn >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {template.totalReturn.toFixed(2)}%
                            </span>
                          </td>
                          <td className="text-right text-emerald-400 py-3 px-3">+{template.bestTrade.toFixed(2)}%</td>
                          <td className="text-right text-red-400 py-3 px-3">{template.worstTrade.toFixed(2)}%</td>
                          <td className="text-center py-3 px-3">
                            <Button
                              onClick={() => handleSelectTemplate(template)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              size="sm"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Win/Loss Distribution */}
                <Card className="bg-slate-700 border-slate-600 p-4">
                  <h4 className="text-white font-semibold mb-3">Win/Loss Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Template Return Comparison */}
                <Card className="bg-slate-700 border-slate-600 p-4">
                  <h4 className="text-white font-semibold mb-3">Template Returns</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={templateChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Bar dataKey="return" fill="#3b82f6" name="Avg Return %" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Selected Template Trade History */}
              {selectedTemplate && (
                <Card className="bg-slate-700 border-slate-600 p-4">
                  <h4 className="text-white font-semibold mb-3">
                    Trade History: {selectedTemplate.templateName}
                  </h4>
                  {tradeHistory.length === 0 ? (
                    <p className="text-slate-400 text-sm">No trades recorded for this template</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tradeHistory.map((trade) => {
                        const returnPct = calculateTradeReturn(trade);
                        return (
                          <div
                            key={trade.id}
                            className="bg-slate-600/50 p-3 rounded flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-semibold">{trade.ticker}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    trade.status === "closed"
                                      ? "bg-emerald-600/20 text-emerald-400"
                                      : trade.status === "open"
                                        ? "bg-blue-600/20 text-blue-400"
                                        : "bg-slate-600 text-slate-400"
                                  }`}
                                >
                                  {trade.status}
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs">
                                Entry: ${trade.entryPrice.toFixed(2)}
                                {trade.exitPrice && ` → Exit: $${trade.exitPrice.toFixed(2)}`}
                              </p>
                            </div>
                            {returnPct !== null && (
                              <div
                                className={`text-right font-semibold ${
                                  returnPct >= 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                              >
                                {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {/* Strategy Comparison Reports */}
              <StrategyComparisonReport />

              {/* Data Management */}
              <div className="flex gap-2">
                <Button
                  onClick={loadPerformanceData}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center gap-2"
                  size="sm"
                >
                  <RefreshCw size={16} />
                  Refresh Data
                </Button>
                <Button
                  onClick={handleClearData}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30 flex items-center justify-center gap-2"
                  size="sm"
                >
                  <Trash2 size={16} />
                  Clear Data
                </Button>
              </div>
            </>
          )}

          {/* Info Box */}
          <Card className="bg-amber-600/10 border-amber-600/30 p-4">
            <p className="text-amber-300 text-sm">
              <span className="font-semibold">📊 How it works:</span> Track your trades by recording entry and exit
              prices for each alert template. The dashboard automatically calculates win rates, returns, and identifies
              your best-performing strategies.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
