/**
 * Stock News Component
 * Displays recent news articles for a specific stock
 */

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { Card } from "./ui/card";

interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  summary?: string;
  sentiment?: {
    score: number;
    label: string;
  };
}

interface StockNewsProps {
  ticker: string;
  maxArticles?: number;
}

export function StockNews({ ticker, maxArticles = 5 }: StockNewsProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/news/${ticker}?limit=${maxArticles}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to load news");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchNews();
    }
  }, [ticker, maxArticles]);

  const getSentimentColor = (label: string) => {
    switch (label) {
      case "positive":
        return "text-green-600 bg-green-100";
      case "negative":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Newspaper className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No recent news available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">Recent News</h4>
        <span className="text-sm text-muted-foreground">({articles.length} articles)</span>
      </div>
      
      {articles.map((article, index) => (
        <Card key={index} className="p-3 hover:bg-accent/50 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
              >
                {article.title}
              </a>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {article.source}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(article.pubDate).toLocaleDateString()}
                </span>
                {article.sentiment && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSentimentColor(
                        article.sentiment.label
                      )}`}
                    >
                      {article.sentiment.label}
                    </span>
                  </>
                )}
              </div>
            </div>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Card>
      ))}
    </div>
  );
}
