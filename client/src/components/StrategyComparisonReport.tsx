import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  generateStrategyComparisonReport,
  downloadReport,
  type TimePeriod,
  type StrategyComparisonReport
} from "@/lib/reportGeneration";

export default function StrategyComparisonReport() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const [report, setReport] = useState<StrategyComparisonReport | null>(null);

  const handleGenerateReport = () => {
    const newReport = generateStrategyComparisonReport(timePeriod);
    setReport(newReport);
  };

  const handleExport = (format: "csv" | "json") => {
    if (report) {
      downloadReport(report, format);
    }
  };

  const chartData = report?.periodReports.map((period) => ({
    period: period.period.length > 15 ? period.period.substring(0, 12) + "..." : period.period,
    fullPeriod: period.period,
    winRate: parseFloat(period.winRate.toFixed(2)),
    avgReturn: parseFloat(period.avgReturn.toFixed(2)),
    trades: period.totalTrades
  })) || [];

  const periodPerformanceData = report?.periodReports.map((period) => ({
    period: period.period.length > 15 ? period.period.substring(0, 12) + "..." : period.period,
    fullPeriod: period.period,
    wins: period.winningTrades,
    losses: period.losingTrades
  })) || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2">
          <BarChart3 size={18} />
          Strategy Comparison Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Strategy Comparison Reports</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Configuration */}
          <Card className="bg-slate-700 border-slate-600 p-4">
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-semibold mb-2 block">Time Period</label>
                <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="daily">Daily (Last 30 days)</SelectItem>
                    <SelectItem value="weekly">Weekly (Last 12 weeks)</SelectItem>
                    <SelectItem value="monthly">Monthly (Last 12 months)</SelectItem>
                    <SelectItem value="quarterly">Quarterly (Last 4 quarters)</SelectItem>
                    <SelectItem value="yearly">Yearly (Last 3 years)</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateReport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Generate Report
              </Button>
            </div>
          </Card>

          {report && (
            <>
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="bg-slate-700 border-slate-600 p-3">
                  <p className="text-slate-400 text-xs mb-1">Total Trades</p>
                  <p className="text-white text-xl font-bold">{report.overallStats.totalTrades}</p>
                </Card>
                <Card className="bg-slate-700 border-slate-600 p-3">
                  <p className="text-slate-400 text-xs mb-1">Win Rate</p>
                  <p className="text-emerald-400 text-xl font-bold">{report.overallStats.overallWinRate.toFixed(1)}%</p>
                </Card>
                <Card className="bg-slate-700 border-slate-600 p-3">
                  <p className="text-slate-400 text-xs mb-1">Avg Return</p>
                  <p
                    className={`text-xl font-bold ${
                      report.overallStats.overallAvgReturn >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {report.overallStats.overallAvgReturn.toFixed(2)}%
                  </p>
                </Card>
                <Card className="bg-slate-700 border-slate-600 p-3">
                  <p className="text-slate-400 text-xs mb-1">Wins</p>
                  <p className="text-emerald-400 text-xl font-bold">{report.overallStats.totalWins}</p>
                </Card>
                <Card className="bg-slate-700 border-slate-600 p-3">
                  <p className="text-slate-400 text-xs mb-1">Losses</p>
                  <p className="text-red-400 text-xl font-bold">{report.overallStats.totalLosses}</p>
                </Card>
              </div>

              {/* Best and Worst Periods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.overallStats.bestPeriod && (
                  <Card className="bg-emerald-600/10 border-emerald-600/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-emerald-400" size={18} />
                      <h4 className="text-emerald-400 font-semibold">Best Period</h4>
                    </div>
                    <p className="text-white font-bold text-lg">{report.overallStats.bestPeriod.period}</p>
                    <p className="text-slate-300 text-sm mt-1">
                      {report.overallStats.bestPeriod.winningTrades}W / {report.overallStats.bestPeriod.losingTrades}L
                      ({report.overallStats.bestPeriod.winRate.toFixed(1)}% win rate)
                    </p>
                    <p className="text-emerald-400 text-sm font-semibold mt-1">
                      +{report.overallStats.bestPeriod.avgReturn.toFixed(2)}% avg return
                    </p>
                  </Card>
                )}

                {report.overallStats.worstPeriod && (
                  <Card className="bg-red-600/10 border-red-600/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="text-red-400" size={18} />
                      <h4 className="text-red-400 font-semibold">Worst Period</h4>
                    </div>
                    <p className="text-white font-bold text-lg">{report.overallStats.worstPeriod.period}</p>
                    <p className="text-slate-300 text-sm mt-1">
                      {report.overallStats.worstPeriod.winningTrades}W / {report.overallStats.worstPeriod.losingTrades}L
                      ({report.overallStats.worstPeriod.winRate.toFixed(1)}% win rate)
                    </p>
                    <p className="text-red-400 text-sm font-semibold mt-1">
                      {report.overallStats.worstPeriod.avgReturn.toFixed(2)}% avg return
                    </p>
                  </Card>
                )}
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Win Rate and Return Trend */}
                <Card className="bg-slate-700 border-slate-600 p-4">
                  <h4 className="text-white font-semibold mb-3">Performance Trend</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                        labelStyle={{ color: "#e2e8f0" }}
                        formatter={(value: any) => value.toFixed(2)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="winRate"
                        stroke="#10b981"
                        name="Win Rate %"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgReturn"
                        stroke="#3b82f6"
                        name="Avg Return %"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Wins vs Losses by Period */}
                <Card className="bg-slate-700 border-slate-600 p-4">
                  <h4 className="text-white font-semibold mb-3">Wins vs Losses</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={periodPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend />
                      <Bar dataKey="wins" fill="#10b981" name="Wins" />
                      <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Period Details Table */}
              <Card className="bg-slate-700 border-slate-600 p-4">
                <h4 className="text-white font-semibold mb-3">Period Details</h4>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="text-left text-slate-400 py-2 px-2">Period</th>
                        <th className="text-right text-slate-400 py-2 px-2">Trades</th>
                        <th className="text-right text-slate-400 py-2 px-2">W/L</th>
                        <th className="text-right text-slate-400 py-2 px-2">Win %</th>
                        <th className="text-right text-slate-400 py-2 px-2">Avg Return</th>
                        <th className="text-right text-slate-400 py-2 px-2">Best</th>
                        <th className="text-right text-slate-400 py-2 px-2">Worst</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.periodReports.map((period, idx) => (
                        <tr key={idx} className="border-b border-slate-700 hover:bg-slate-600/30">
                          <td className="text-white py-2 px-2 font-semibold">{period.period}</td>
                          <td className="text-right text-slate-300 py-2 px-2">{period.totalTrades}</td>
                          <td className="text-right text-slate-300 py-2 px-2">
                            <span className="text-emerald-400">{period.winningTrades}</span>/
                            <span className="text-red-400">{period.losingTrades}</span>
                          </td>
                          <td className="text-right py-2 px-2">
                            <span className="text-emerald-400 font-semibold">{period.winRate.toFixed(1)}%</span>
                          </td>
                          <td className="text-right py-2 px-2">
                            <span
                              className={`font-semibold ${
                                period.avgReturn >= 0 ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {period.avgReturn.toFixed(2)}%
                            </span>
                          </td>
                          <td className="text-right text-emerald-400 py-2 px-2">+{period.bestTrade.toFixed(2)}%</td>
                          <td className="text-right text-red-400 py-2 px-2">{period.worstTrade.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Export Options */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport("csv")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Export as CSV
                </Button>
                <Button
                  onClick={() => handleExport("json")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Export as JSON
                </Button>
              </div>
            </>
          )}

          {!report && (
            <Card className="bg-blue-600/10 border-blue-600/30 p-4">
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">📊 How it works:</span> Select a time period and generate a report to
                analyze your strategy performance across different time frames. Identify seasonal patterns and optimize
                your trading approach.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
