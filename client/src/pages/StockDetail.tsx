import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import SentimentTrendChart from "@/components/SentimentTrendChart";
import { StockNews } from "@/components/StockNews";
import { toast } from "sonner";

interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface ChartDataPoint {
  timestamp: number;
  price: number;
  date: string;
}

export default function StockDetail() {
  const [, params] = useRoute("/stock/:ticker");
  const ticker = params?.ticker?.toUpperCase() || "";
  
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [period, setPeriod] = useState<"1D" | "5D" | "1M" | "3M" | "6M" | "1Y">("1M");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticker) {
      fetchStockData();
      fetchChartData();
    }
  }, [ticker, period]);

  const fetchStockData = async () => {
    try {
      const response = await fetch(`/api/stock-quote/${ticker}`);
      if (!response.ok) throw new Error("Failed to fetch stock data");
      const data = await response.json();
      setQuote(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const periodMap = {
        "1D": "1d",
        "5D": "5d",
        "1M": "1mo",
        "3M": "3mo",
        "6M": "6mo",
        "1Y": "1y"
      };
      
      const response = await fetch(`/api/stock-chart/${ticker}?period=${periodMap[period]}`);
      if (!response.ok) throw new Error("Failed to fetch chart data");
      const data = await response.json();
      
      // Transform data for Recharts
      const transformed = data.dataPoints.map((point: any) => ({
        timestamp: point.timestamp,
        price: point.close,
        date: new Date(point.timestamp).toLocaleDateString()
      }));
      
      setChartData(transformed);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast.error("Failed to load chart data");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-center py-20">Loading...</div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-white text-center py-20">Stock not found</div>
        </div>
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStockData();
              fetchChartData();
            }}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stock Header */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-white">{ticker}</CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Real-time stock data and analysis
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">${quote.price?.toFixed(2) || '0.00'}</div>
                <div className={`flex items-center gap-1 justify-end mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">
                    {isPositive ? '+' : ''}{quote.change?.toFixed(2) || '0.00'} ({isPositive ? '+' : ''}{quote.changePercent?.toFixed(2) || '0.00'}%)
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-slate-400 text-sm mb-1">Market Cap</div>
              <div className="text-white text-xl font-bold">
                ${((quote.marketCap || 0) / 1e9).toFixed(2)}B
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-slate-400 text-sm mb-1">Volume</div>
              <div className="text-white text-xl font-bold">
                {((quote.volume || 0) / 1e6).toFixed(2)}M
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-slate-400 text-sm mb-1">Day High</div>
              <div className="text-white text-xl font-bold">${quote.high?.toFixed(2) || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="text-slate-400 text-sm mb-1">Day Low</div>
              <div className="text-white text-xl font-bold">${quote.low?.toFixed(2) || 'N/A'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Price Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Price History</CardTitle>
              <div className="flex gap-2">
                {(["1D", "5D", "1M", "3M", "6M", "1Y"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriod(p)}
                    className={period === p ? "" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="sentiment" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
            <TabsTrigger value="news">News Feed</TabsTrigger>
            <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
          </TabsList>

          <TabsContent value="sentiment" className="space-y-6">
            <SentimentTrendChart ticker={ticker} />
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <StockNews ticker={ticker} />
          </TabsContent>

          <TabsContent value="fundamentals" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Key Metrics</CardTitle>
                <CardDescription className="text-slate-400">
                  Fundamental financial data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quote ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Open</div>
                      <div className="text-white text-lg font-semibold">${quote.open?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Previous Close</div>
                      <div className="text-white text-lg font-semibold">${quote.previousClose?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Day Range</div>
                      <div className="text-white text-lg font-semibold">
                        ${quote.low?.toFixed(2) || 'N/A'} - ${quote.high?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Volume</div>
                      <div className="text-white text-lg font-semibold">
                        {quote.volume?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">Loading metrics...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
