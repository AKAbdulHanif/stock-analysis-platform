/**
 * Sentiment Distribution Chart
 * Displays a pie chart showing the distribution of positive/negative/neutral sentiment
 */

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SentimentStats {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

interface SentimentDistributionChartProps {
  ticker?: string;
  tickers?: string[];
}

const COLORS = {
  positive: "#10b981", // green
  negative: "#ef4444", // red
  neutral: "#6b7280", // gray
};

export function SentimentDistributionChart({ ticker, tickers }: SentimentDistributionChartProps) {
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentimentStats = async () => {
      try {
        setLoading(true);
        
        let articles: any[] = [];
        
        if (ticker) {
          // Fetch news for single ticker
          const response = await fetch(`/api/news/${ticker}`);
          if (response.ok) {
            const data = await response.json();
            articles = data.articles || [];
          }
        } else if (tickers && tickers.length > 0) {
          // Fetch news for multiple tickers
          const response = await fetch("/api/news/portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tickers, maxArticles: 50 }),
          });
          if (response.ok) {
            articles = await response.json();
          }
        }

        // Calculate sentiment distribution
        const sentimentCounts = {
          positive: 0,
          negative: 0,
          neutral: 0,
        };

        articles.forEach((article) => {
          if (article.sentiment) {
            const label = article.sentiment.label.toLowerCase();
            if (label === "positive") sentimentCounts.positive++;
            else if (label === "negative") sentimentCounts.negative++;
            else sentimentCounts.neutral++;
          } else {
            sentimentCounts.neutral++;
          }
        });

        setStats({
          ...sentimentCounts,
          total: articles.length,
        });
      } catch (error) {
        console.error("Error fetching sentiment stats:", error);
        setStats({ positive: 0, negative: 0, neutral: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentStats();
  }, [ticker, tickers]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>Loading sentiment data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>No sentiment data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = [
    { name: "Positive", value: stats.positive, color: COLORS.positive },
    { name: "Negative", value: stats.negative, color: COLORS.negative },
    { name: "Neutral", value: stats.neutral, color: COLORS.neutral },
  ].filter((item) => item.value > 0);

  const getPercentage = (value: number) => ((value / stats.total) * 100).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
        <CardDescription>
          Analysis of {stats.total} news articles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Positive</p>
                  <p className="text-xs text-green-700">{stats.positive} articles</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {getPercentage(stats.positive)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900">Negative</p>
                  <p className="text-xs text-red-700">{stats.negative} articles</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">
                {getPercentage(stats.negative)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <Minus className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Neutral</p>
                  <p className="text-xs text-gray-700">{stats.neutral} articles</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-600">
                {getPercentage(stats.neutral)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
