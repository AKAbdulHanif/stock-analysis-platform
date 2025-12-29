import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchX, ArrowLeft, TrendingUp } from "lucide-react";

interface StockNotFoundProps {
  ticker: string;
}

export default function StockNotFound({ ticker }: StockNotFoundProps) {
  const popularTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardContent className="p-12 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
              <SearchX className="w-12 h-12 text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Stock Not Found</h1>
            <p className="text-lg text-slate-400">
              We couldn't find any data for ticker <span className="font-mono text-red-400">{ticker}</span>
            </p>
          </div>

          {/* Description */}
          <div className="text-slate-400 space-y-2 max-w-md mx-auto">
            <p>This could mean:</p>
            <ul className="text-sm space-y-1 text-left list-disc list-inside">
              <li>The ticker symbol is incorrect or doesn't exist</li>
              <li>The stock has been delisted</li>
              <li>There's a temporary issue with our data provider</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/">
              <Button variant="default" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/compare">
              <Button variant="outline" className="gap-2 bg-slate-700 border-slate-600 hover:bg-slate-600">
                <TrendingUp className="w-4 h-4" />
                Compare Stocks
              </Button>
            </Link>
          </div>

          {/* Popular Tickers */}
          <div className="pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-3">Try these popular stocks instead:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularTickers.map((popularTicker) => (
                <Link key={popularTicker} href={`/stock/${popularTicker}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-slate-700/50 border-slate-600 hover:bg-slate-600 hover:border-emerald-500 transition-colors"
                  >
                    {popularTicker}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
