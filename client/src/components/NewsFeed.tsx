/**
 * NewsFeed Component
 * 
 * Displays recent financial news for portfolio stocks
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, RefreshCw, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  thumbnail?: string;
  ticker: string;
  sentiment?: {
    type: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
  };
}

interface NewsFeedProps {
  tickers?: string[];
  limit?: number;
  showFilter?: boolean;
}

export default function NewsFeed({ tickers, limit = 20, showFilter = true }: NewsFeedProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async () => {
    if (!tickers || tickers.length === 0) {
      setNews([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/news/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tickers,
          limitPerStock: Math.ceil(limit / tickers.length)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNews(data.articles || []);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [tickers?.join(',')]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  let filteredNews = selectedTicker === "all" 
    ? news 
    : news.filter(article => article.ticker === selectedTicker);
  
  // Filter by sentiment
  if (selectedSentiment !== "all") {
    filteredNews = filteredNews.filter(article => article.sentiment?.type === selectedSentiment);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && !refreshing) {
    return (
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="flex items-center gap-2 text-slate-400">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading news...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (news.length === 0) {
    return (
      <Card className="p-6 bg-slate-800 border-slate-700">
        <div className="text-center text-slate-400">
          <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
          <p>No news available for your portfolio stocks</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="text-emerald-400" size={24} />
          <h3 className="text-xl font-semibold text-white">Latest News</h3>
          <Badge variant="secondary" className="ml-2">
            {filteredNews.length} articles
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {showFilter && (
            <>
              {/* Sentiment Filter */}
              <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="All Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>

              {/* Ticker Filter */}
              {tickers && tickers.length > 1 && (
                <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                  <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
                    <Filter size={16} className="mr-2" />
                    <SelectValue placeholder="All Stocks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stocks</SelectItem>
                    {tickers.map(ticker => (
                      <SelectItem key={ticker} value={ticker}>
                        {ticker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-slate-700"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
          </Button>
        </div>
      </div>

      {/* News articles */}
      <div className="grid grid-cols-1 gap-4">
        {filteredNews.map((article, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-colors overflow-hidden">
            <div className="flex gap-4 p-4">
              {/* Thumbnail */}
              {article.thumbnail && (
                <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-slate-700">
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-white font-semibold line-clamp-2 hover:text-emerald-400 transition-colors">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Sentiment Badge */}
                    {article.sentiment && (
                      <Badge className={
                        article.sentiment.type === 'positive'
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : article.sentiment.type === 'negative'
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }>
                        {article.sentiment.type === 'positive' ? '📈' : article.sentiment.type === 'negative' ? '📉' : '➖'}
                        {article.sentiment.type}
                      </Badge>
                    )}
                    {/* Ticker Badge */}
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {article.ticker}
                    </Badge>
                  </div>
                </div>

                <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                  {article.summary}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
                  >
                    Read More
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
