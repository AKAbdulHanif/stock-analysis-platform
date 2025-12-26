import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SentimentDataPoint {
  id: number;
  ticker: string;
  sentimentScore: number;
  confidence: number;
  articleCount: number;
  recordedAt: Date;
}

interface SentimentTrendChartProps {
  ticker: string;
}

export default function SentimentTrendChart({ ticker }: SentimentTrendChartProps) {
  const [data, setData] = useState<SentimentDataPoint[]>([]);
  const [period, setPeriod] = useState<30 | 60 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<"improving" | "declining" | "stable">("stable");

  useEffect(() => {
    fetchSentimentHistory();
  }, [ticker, period]);

  const fetchSentimentHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sentiment-history/${ticker}?days=${period}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setData([]);
          return;
        }
        throw new Error("Failed to fetch sentiment history");
      }

      const history = await response.json();
      setData(history);

      // Calculate trend
      if (history.length > 0) {
        const midpoint = Math.floor(history.length / 2);
        const recentAvg = history.slice(0, midpoint).reduce((sum: number, h: SentimentDataPoint) => sum + h.sentimentScore, 0) / midpoint;
        const olderAvg = history.slice(midpoint).reduce((sum: number, h: SentimentDataPoint) => sum + h.sentimentScore, 0) / (history.length - midpoint);
        
        const changePercent = ((recentAvg - olderAvg) / Math.abs(olderAvg || 1)) * 100;
        
        if (changePercent > 10) setTrend("improving");
        else if (changePercent < -10) setTrend("declining");
        else setTrend("stable");
      }
    } catch (error) {
      console.error("Error fetching sentiment history:", error);
      toast.error("Failed to load sentiment history");
    } finally {
      setLoading(false);
    }
  };

  const chartData = data.map(point => ({
    date: new Date(point.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    sentiment: point.sentimentScore,
    confidence: point.confidence * 100,
    articles: point.articleCount,
  })).reverse(); // Reverse to show oldest to newest

  const getTrendIcon = () => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case "declining":
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "improving":
        return "text-green-400";
      case "declining":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case "improving":
        return "Improving";
      case "declining":
        return "Declining";
      default:
        return "Stable";
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="text-center text-slate-400">Loading sentiment history...</div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 p-6">
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 mb-2">No sentiment history available</p>
          <p className="text-sm text-slate-500">
            Sentiment data will be collected over time as news articles are analyzed
          </p>
        </div>
      </Card>
    );
  }

  const currentScore = data[0]?.sentimentScore || 0;
  const avgScore = data.reduce((sum, d) => sum + d.sentimentScore, 0) / data.length;

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Sentiment Trend</h3>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {getTrendLabel()} Trend
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSentimentHistory}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {[30, 60, 90].map(days => (
          <Button
            key={days}
            variant={period === days ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(days as 30 | 60 | 90)}
            className={period === days ? "" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}
          >
            {days}D
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Current</p>
          <p className={`text-lg font-semibold ${currentScore > 0 ? "text-green-400" : currentScore < 0 ? "text-red-400" : "text-slate-300"}`}>
            {currentScore.toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Average</p>
          <p className={`text-lg font-semibold ${avgScore > 0 ? "text-green-400" : avgScore < 0 ? "text-red-400" : "text-slate-300"}`}>
            {avgScore.toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Data Points</p>
          <p className="text-lg font-semibold text-slate-300">{data.length}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: "12px" }}
              tick={{ fill: "#94a3b8" }}
              label={{ value: "Sentiment (%)", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              formatter={(value: number, name: string) => {
                if (name === "sentiment") return [`${value.toFixed(2)}%`, "Sentiment"];
                if (name === "confidence") return [`${value.toFixed(0)}%`, "Confidence"];
                if (name === "articles") return [value, "Articles"];
                return [value, name];
              }}
            />
            <Legend
              wrapperStyle={{ color: "#94a3b8" }}
              formatter={(value) => {
                if (value === "sentiment") return "Sentiment Score";
                if (value === "confidence") return "Confidence";
                if (value === "articles") return "Article Count";
                return value;
              }}
            />
            <Area
              type="monotone"
              dataKey="sentiment"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#sentimentGradient)"
            />
            <Line
              type="monotone"
              dataKey="confidence"
              stroke="#10b981"
              strokeWidth={1}
              dot={false}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Info */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Sentiment Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
          <span>Confidence Level</span>
        </div>
      </div>
    </Card>
  );
}
