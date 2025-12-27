/**
 * Risk Metrics Dashboard Component
 * Display Sharpe ratio, beta, max drawdown, VaR, and volatility charts
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Activity } from "lucide-react";

interface RiskMetrics {
  sharpeRatio: number;
  beta: number;
  maxDrawdown: number;
  valueAtRisk95: number;
  valueAtRisk99: number;
  annualizedVolatility: number;
  downsideDeviation: number;
  sortinoRatio: number;
}

interface VolatilityData {
  date: string;
  volatility: number;
}

interface RiskMetricsDashboardProps {
  tickers: string[];
  weights?: number[];
}

export function RiskMetricsDashboard({ tickers, weights }: RiskMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [volatilityHistory, setVolatilityHistory] = useState<VolatilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/risk-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers, weights })
        });

        if (!response.ok) {
          throw new Error("Failed to fetch risk metrics");
        }

        const data = await response.json();
        setMetrics(data.metrics);
        setVolatilityHistory(data.volatilityHistory || []);
      } catch (err) {
        console.error("Error fetching risk metrics:", err);
        setError("Failed to load risk metrics");
      } finally {
        setLoading(false);
      }
    };

    if (tickers.length > 0) {
      fetchRiskMetrics();
    }
  }, [tickers, weights]);

  const getRiskLevel = (sharpe: number): { label: string; color: string } => {
    if (sharpe >= 2) return { label: "Excellent", color: "text-green-400" };
    if (sharpe >= 1) return { label: "Good", color: "text-blue-400" };
    if (sharpe >= 0) return { label: "Fair", color: "text-yellow-400" };
    return { label: "Poor", color: "text-red-400" };
  };

  const getBetaLevel = (beta: number): { label: string; color: string } => {
    if (beta > 1.2) return { label: "High Volatility", color: "text-red-400" };
    if (beta > 0.8) return { label: "Market Average", color: "text-blue-400" };
    return { label: "Low Volatility", color: "text-green-400" };
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading risk metrics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-destructive">{error || "No data available"}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskLevel = getRiskLevel(metrics.sharpeRatio);
  const betaLevel = getBetaLevel(metrics.beta);

  return (
    <div className="space-y-4">
      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sharpe Ratio */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sharpeRatio.toFixed(2)}</div>
            <p className={`text-xs ${riskLevel.color} mt-1`}>{riskLevel.label}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Risk-adjusted return vs 4.5% risk-free rate
            </p>
          </CardContent>
        </Card>

        {/* Beta */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Beta (vs S&P 500)</CardTitle>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.beta.toFixed(2)}</div>
            <p className={`text-xs ${betaLevel.color} mt-1`}>{betaLevel.label}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.beta > 1 ? "More volatile than market" : "Less volatile than market"}
            </p>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">-{metrics.maxDrawdown.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.maxDrawdown > 20 ? "High risk" : metrics.maxDrawdown > 10 ? "Moderate risk" : "Low risk"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Largest peak-to-trough decline
            </p>
          </CardContent>
        </Card>

        {/* Value at Risk (95%) */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Value at Risk (95%)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{metrics.valueAtRisk95.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              95% confidence level
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Maximum expected daily loss
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Annualized Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{metrics.annualizedVolatility.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Standard deviation of returns
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sortino Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{metrics.sortinoRatio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Downside risk-adjusted return
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">VaR (99%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-400">{metrics.valueAtRisk99.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              99% confidence worst-case loss
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Volatility Chart */}
      {volatilityHistory.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Historical Volatility (30-Day Rolling)</CardTitle>
            <CardDescription>
              Annualized volatility over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volatilityHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  label={{ value: 'Volatility (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '6px'
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Volatility']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="volatility" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="Volatility (%)"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <Shield className="inline h-3 w-3 mr-1" />
                <strong>Interpretation:</strong> Higher volatility indicates greater price fluctuations and risk. 
                Stable volatility suggests consistent market conditions, while spikes indicate increased uncertainty.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
