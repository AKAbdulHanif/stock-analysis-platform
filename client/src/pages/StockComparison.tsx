import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, BarChart3Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

interface StockQuote {
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
}

interface StockSentiment {
  currentScore: number;
  weekAverage: number;
  monthAverage: number;
  momentum: string;
  confidence: number;
}

interface StockPerformance {
  day1: number;
  week1: number;
  month1: number;
  month3: number;
  month6: number;
  year1: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
  normalizedPrice: number;
}

interface StockComparisonData {
  ticker: string;
  quote: StockQuote;
  sentiment: StockSentiment;
  performance: StockPerformance;
  chartData: ChartDataPoint[];
  newsCount: number;
}

interface ComparisonMetrics {
  correlation: { [key: string]: number };
  relativeStrength: { [key: string]: number };
  volatility: { [key: string]: number };
  averageSentiment: { [key: string]: number };
}

interface ComparisonResponse {
  stocks: StockComparisonData[];
  metrics: ComparisonMetrics;
  timestamp: string;
}

const STOCK_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function StockComparison() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  // Using sonner toast

  const addTicker = () => {
    const ticker = inputValue.trim().toUpperCase();
    if (!ticker) return;

    if (tickers.includes(ticker)) {
      toast({
        title: "Duplicate ticker",
        description: `${ticker} is already in the comparison list`,
        variant: "destructive",
      });
      return;
    }

    if (tickers.length >= 5) {
      toast({
        title: "Maximum reached",
        description: "You can compare up to 5 stocks at a time",
        variant: "destructive",
      });
      return;
    }

    setTickers([...tickers, ticker]);
    setInputValue("");
  };

  const removeTicker = (ticker: string) => {
    setTickers(tickers.filter((t) => t !== ticker));
    setComparison(null);
  };

  const compareStocks = async () => {
    if (tickers.length < 2) {
      toast({
        title: "Not enough stocks",
        description: "Please add at least 2 stocks to compare",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stock/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });

      if (!response.ok) {
        throw new Error("Failed to compare stocks");
      }

      const data: ComparisonResponse = await response.json();
      setComparison(data);
    } catch (error) {
      console.error("Error comparing stocks:", error);
      toast({
        title: "Comparison failed",
        description: "Failed to compare stocks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  // Prepare chart data for synchronized view
  const prepareChartData = () => {
    if (!comparison) return [];

    const dateMap = new Map<string, any>();

    comparison.stocks.forEach((stock, idx) => {
      stock.chartData.forEach((point) => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        const entry = dateMap.get(point.date);
        entry[`${stock.ticker}_price`] = point.price;
        entry[`${stock.ticker}_normalized`] = point.normalizedPrice;
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Stock Comparison</h1>
          <p className="text-muted-foreground">
            Compare multiple stocks side-by-side with synchronized charts and metrics
          </p>
        </div>

        {/* Ticker Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Stocks to Compare</CardTitle>
            <CardDescription>Add 2-5 stock tickers for comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Enter ticker (e.g., AAPL)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && addTicker()}
                className="flex-1"
              />
              <Button onClick={addTicker} disabled={tickers.length >= 5}>
                Add Stock
              </Button>
              <Button
                onClick={compareStocks}
                disabled={tickers.length < 2 || loading}
                variant="default"
              >
                <BarChart3Icon className="w-4 h-4 mr-2" />
                {loading ? "Comparing..." : "Compare"}
              </Button>
            </div>

            {/* Selected Tickers */}
            <div className="flex flex-wrap gap-2">
              {tickers.map((ticker, idx) => (
                <Badge
                  key={ticker}
                  variant="secondary"
                  className="px-3 py-2 text-sm"
                  style={{ borderLeft: `4px solid ${STOCK_COLORS[idx]}` }}
                >
                  {ticker}
                  <button
                    onClick={() => removeTicker(ticker)}
                    className="ml-2 hover:text-destructive"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {comparison && (
          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="charts">Price Charts</TabsTrigger>
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
            </TabsList>

            {/* Price Charts Tab */}
            <TabsContent value="charts" className="space-y-6">
              {/* Normalized Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Normalized Price Comparison</CardTitle>
                  <CardDescription>
                    All stocks normalized to 100 at the start of the period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => formatNumber(value, 2)}
                      />
                      <Legend />
                      {comparison.stocks.map((stock, idx) => (
                        <Line
                          key={stock.ticker}
                          type="monotone"
                          dataKey={`${stock.ticker}_normalized`}
                          stroke={STOCK_COLORS[idx]}
                          name={stock.ticker}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Absolute Price Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Absolute Price Comparison</CardTitle>
                  <CardDescription>Actual stock prices over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => `$${formatNumber(value, 2)}`}
                      />
                      <Legend />
                      {comparison.stocks.map((stock, idx) => (
                        <Line
                          key={stock.ticker}
                          type="monotone"
                          dataKey={`${stock.ticker}_price`}
                          stroke={STOCK_COLORS[idx]}
                          name={stock.ticker}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Key Metrics Tab */}
            <TabsContent value="metrics">
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics Comparison</CardTitle>
                  <CardDescription>
                    Side-by-side comparison of fundamental metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Metric</th>
                          {comparison.stocks.map((stock, idx) => (
                            <th
                              key={stock.ticker}
                              className="text-right p-3 font-semibold"
                              style={{ color: STOCK_COLORS[idx] }}
                            >
                              {stock.ticker}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Current Price</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              ${formatNumber(stock.quote.price, 2)}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Change (%)</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              <span
                                className={
                                  stock.quote.changePercent >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {stock.quote.changePercent >= 0 ? "+" : ""}
                                {formatNumber(stock.quote.changePercent, 2)}%
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Market Cap</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              {formatLargeNumber(stock.quote.marketCap)}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">P/E Ratio</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              {stock.quote.peRatio > 0
                                ? formatNumber(stock.quote.peRatio, 2)
                                : "N/A"}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Volume</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              {formatLargeNumber(stock.quote.volume)}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Dividend Yield</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              {stock.quote.dividendYield > 0
                                ? `${formatNumber(stock.quote.dividendYield, 2)}%`
                                : "N/A"}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Sentiment Score</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              <span
                                className={
                                  stock.sentiment.currentScore > 0.05
                                    ? "text-green-600"
                                    : stock.sentiment.currentScore < -0.05
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }
                              >
                                {formatNumber(stock.sentiment.currentScore * 100, 2)}%
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">Volatility</td>
                          {comparison.stocks.map((stock) => (
                            <td key={stock.ticker} className="text-right p-3">
                              {formatNumber(comparison.metrics.volatility[stock.ticker], 2)}%
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>
                    Returns across different time periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Period</th>
                          {comparison.stocks.map((stock, idx) => (
                            <th
                              key={stock.ticker}
                              className="text-right p-3 font-semibold"
                              style={{ color: STOCK_COLORS[idx] }}
                            >
                              {stock.ticker}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "1 Day", key: "day1" },
                          { label: "1 Week", key: "week1" },
                          { label: "1 Month", key: "month1" },
                          { label: "3 Months", key: "month3" },
                          { label: "6 Months", key: "month6" },
                          { label: "1 Year", key: "year1" },
                        ].map(({ label, key }) => (
                          <tr key={key} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-medium">{label}</td>
                            {comparison.stocks.map((stock) => {
                              const value = stock.performance[key as keyof StockPerformance];
                              return (
                                <td key={stock.ticker} className="text-right p-3">
                                  <span
                                    className={
                                      value >= 0 ? "text-green-600" : "text-red-600"
                                    }
                                  >
                                    {value >= 0 ? (
                                      <ArrowUpIcon className="inline w-4 h-4 mr-1" />
                                    ) : (
                                      <ArrowDownIcon className="inline w-4 h-4 mr-1" />
                                    )}
                                    {formatNumber(Math.abs(value), 2)}%
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Correlation Tab */}
            <TabsContent value="correlation">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Correlation Matrix</CardTitle>
                    <CardDescription>
                      Price correlation between stocks (-1 to 1)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(comparison.metrics.correlation).map(([pair, corr]) => (
                        <div key={pair} className="flex items-center justify-between">
                          <span className="font-medium">{pair}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${((corr + 1) / 2) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono w-12 text-right">
                              {formatNumber(corr, 2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Relative Strength Ranking</CardTitle>
                    <CardDescription>
                      Based on 3-month performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comparison.stocks
                        .sort(
                          (a, b) =>
                            comparison.metrics.relativeStrength[a.ticker] -
                            comparison.metrics.relativeStrength[b.ticker]
                        )
                        .map((stock, idx) => (
                          <div
                            key={stock.ticker}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: STOCK_COLORS[idx] }}
                              >
                                #{comparison.metrics.relativeStrength[stock.ticker]}
                              </div>
                              <span className="font-semibold">{stock.ticker}</span>
                            </div>
                            <div className="text-right">
                              <div
                                className={
                                  stock.performance.month3 >= 0
                                    ? "text-green-600 font-semibold"
                                    : "text-red-600 font-semibold"
                                }
                              >
                                {stock.performance.month3 >= 0 ? "+" : ""}
                                {formatNumber(stock.performance.month3, 2)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                3-month return
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!comparison && !loading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUpIcon className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Comparison Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Add at least 2 stock tickers above and click "Compare" to see side-by-side
                analysis with synchronized charts and metrics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
