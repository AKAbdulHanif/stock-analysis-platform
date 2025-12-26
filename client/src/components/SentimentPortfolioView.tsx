/**
 * Sentiment Portfolio View Component
 * 
 * Displays sentiment-adjusted portfolio recommendations with rebalancing suggestions
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SentimentScore {
  ticker: string;
  currentScore: number;
  weekAverage: number;
  monthAverage: number;
  momentum: 'improving' | 'declining' | 'stable';
  confidence: number;
  articleCount: number;
  lastUpdated: string;
}

interface AdjustedStock {
  ticker: string;
  name: string;
  sector: string;
  originalAllocation: number;
  adjustedAllocation: number;
  sentiment: SentimentScore;
  sentimentWeight: number;
  currentPrice: number;
  peRatio: number;
}

interface SentimentPortfolio {
  portfolio: {
    id: string;
    name: string;
    riskLevel: string;
    stocks: AdjustedStock[];
  };
  sentimentMetrics: {
    averageSentiment: number;
    improvingStocks: number;
    decliningStocks: number;
    totalStocks: number;
  };
}

interface RebalanceRecommendation {
  ticker: string;
  action: 'increase' | 'reduce' | 'hold';
  reason: string;
  suggestedChange: number;
  sentiment: SentimentScore;
}

const SENTIMENT_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#64748b',
};

const getMomentumIcon = (momentum: string) => {
  if (momentum === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  if (momentum === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-slate-500" />;
};

const getSentimentColor = (score: number) => {
  if (score > 0.2) return SENTIMENT_COLORS.positive;
  if (score < -0.2) return SENTIMENT_COLORS.negative;
  return SENTIMENT_COLORS.neutral;
};

export default function SentimentPortfolioView({ portfolioId }: { portfolioId: string }) {
  const [sentimentPortfolio, setSentimentPortfolio] = useState<SentimentPortfolio | null>(null);
  const [rebalanceRecs, setRebalanceRecs] = useState<RebalanceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentimentPortfolio = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sentiment/portfolio/${portfolioId}`);
      if (!response.ok) throw new Error('Failed to fetch sentiment portfolio');
      
      const data = await response.json();
      setSentimentPortfolio(data);

      // Fetch rebalancing recommendations
      const rebalanceResponse = await fetch('/api/sentiment/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentHoldings: data.portfolio.stocks.map((s: AdjustedStock) => ({
            ticker: s.ticker,
            allocation: s.originalAllocation,
          })),
        }),
      });

      if (rebalanceResponse.ok) {
        const rebalanceData = await rebalanceResponse.json();
        setRebalanceRecs(rebalanceData.recommendations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentPortfolio();
  }, [portfolioId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-lg">Loading sentiment analysis...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !sentimentPortfolio) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || 'Failed to load sentiment data'}</AlertDescription>
      </Alert>
    );
  }

  const { portfolio, sentimentMetrics } = sentimentPortfolio;

  // Prepare chart data for allocation comparison
  const allocationData = portfolio.stocks.map(stock => ({
    ticker: stock.ticker,
    original: stock.originalAllocation,
    adjusted: stock.adjustedAllocation,
    change: stock.adjustedAllocation - stock.originalAllocation,
  }));

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Sentiment-Adjusted Portfolio
          </CardTitle>
          <CardDescription>
            Portfolio allocations adjusted based on recent news sentiment analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Average Sentiment</div>
              <div className="text-2xl font-bold" style={{ color: getSentimentColor(sentimentMetrics.averageSentiment) }}>
                {(sentimentMetrics.averageSentiment * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Improving Stocks</div>
              <div className="text-2xl font-bold text-emerald-500">
                {sentimentMetrics.improvingStocks}
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Declining Stocks</div>
              <div className="text-2xl font-bold text-red-500">
                {sentimentMetrics.decliningStocks}
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Total Holdings</div>
              <div className="text-2xl font-bold text-white">
                {sentimentMetrics.totalStocks}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation Adjustments</CardTitle>
          <CardDescription>Original vs Sentiment-Adjusted allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={allocationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="ticker" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" label={{ value: 'Allocation %', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Bar dataKey="original" fill="#64748b" name="Original" />
              <Bar dataKey="adjusted" fill="#10b981" name="Adjusted" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stock Details with Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings with Sentiment Analysis</CardTitle>
          <CardDescription>Detailed sentiment scores and momentum for each stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolio.stocks.map((stock) => (
              <div key={stock.ticker} className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg">{stock.ticker}</h4>
                      <Badge variant="outline">{stock.sector}</Badge>
                      {getMomentumIcon(stock.sentiment.momentum)}
                    </div>
                    <p className="text-sm text-slate-400">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Sentiment Score</div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: getSentimentColor(stock.sentiment.currentScore) }}
                    >
                      {(stock.sentiment.currentScore * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Original Allocation</div>
                    <div className="font-semibold">{stock.originalAllocation.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Adjusted Allocation</div>
                    <div className="font-semibold text-emerald-500">
                      {stock.adjustedAllocation.toFixed(1)}%
                      {stock.adjustedAllocation !== stock.originalAllocation && (
                        <span className="ml-1 text-xs">
                          ({stock.adjustedAllocation > stock.originalAllocation ? '+' : ''}
                          {(stock.adjustedAllocation - stock.originalAllocation).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Sentiment Weight</div>
                    <div className="font-semibold">{stock.sentimentWeight.toFixed(2)}x</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Confidence</div>
                    <div className="font-semibold">{(stock.sentiment.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="grid grid-cols-3 gap-4 text-xs text-slate-400">
                    <div>
                      <span>7-day avg: </span>
                      <span className="font-semibold" style={{ color: getSentimentColor(stock.sentiment.weekAverage) }}>
                        {(stock.sentiment.weekAverage * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span>30-day avg: </span>
                      <span className="font-semibold" style={{ color: getSentimentColor(stock.sentiment.monthAverage) }}>
                        {(stock.sentiment.monthAverage * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span>Articles: </span>
                      <span className="font-semibold">{stock.sentiment.articleCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rebalancing Recommendations */}
      {rebalanceRecs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Rebalancing Recommendations
            </CardTitle>
            <CardDescription>Suggested portfolio adjustments based on sentiment changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rebalanceRecs.map((rec) => (
                <div 
                  key={rec.ticker}
                  className={`p-4 rounded-lg border ${
                    rec.action === 'increase' 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : rec.action === 'reduce'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-slate-500/10 border-slate-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {rec.action === 'increase' && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                      {rec.action === 'reduce' && <TrendingDown className="w-5 h-5 text-red-500" />}
                      {rec.action === 'hold' && <CheckCircle2 className="w-5 h-5 text-slate-500" />}
                      <div>
                        <div className="font-semibold">{rec.ticker}</div>
                        <div className="text-sm text-slate-400">{rec.reason}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline"
                        className={
                          rec.action === 'increase'
                            ? 'border-emerald-500 text-emerald-500'
                            : rec.action === 'reduce'
                            ? 'border-red-500 text-red-500'
                            : 'border-slate-500 text-slate-500'
                        }
                      >
                        {rec.action === 'hold' ? 'Hold' : `${rec.suggestedChange > 0 ? '+' : ''}${rec.suggestedChange}%`}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchSentimentPortfolio} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Sentiment Analysis
        </Button>
      </div>
    </div>
  );
}
