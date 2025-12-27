import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ArrowUpDown,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface ScreenerResult {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  rsi: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  bollingerPercent: number | null;
  signals: string[];
}

interface ScreenerFilters {
  // Technical
  rsiMin?: number;
  rsiMax?: number;
  macdBullish?: boolean;
  macdBearish?: boolean;
  bollinger?: 'oversold' | 'overbought' | 'neutral';
  
  // Fundamental
  peRatioMin?: number;
  peRatioMax?: number;
  dividendYieldMin?: number;
  dividendYieldMax?: number;
  marketCapMin?: number;
  marketCapMax?: number;
  
  // Price
  priceMin?: number;
  priceMax?: number;
  priceChangeMin?: number;
  priceChangeMax?: number;
  
  // Volume
  volumeMin?: number;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function StockScreener() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filtered, setFiltered] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<ScreenerFilters>({});
  const [sortBy, setSortBy] = useState<string>('ticker');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const runScreen = async (preset?: string) => {
    try {
      setLoading(true);
      
      const url = preset 
        ? `/api/screener/preset/${preset}`
        : '/api/screener';
      
      const options = preset 
        ? { method: 'GET' }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...filters, sortBy, sortOrder })
          };
      
      const response = await fetch(url, options);
      if (!response.ok) throw new Error('Failed to screen stocks');
      
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
      setFiltered(data.filtered || 0);
      
      toast.success(`Found ${data.filtered} matching stocks`);
      
    } catch (error) {
      console.error('Error screening stocks:', error);
      toast.error('Failed to screen stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const presets = [
    { name: 'value', label: 'Value Stocks', description: 'Low P/E, high dividend' },
    { name: 'growth', label: 'Growth Stocks', description: 'High momentum' },
    { name: 'dividend', label: 'Dividend Stocks', description: 'High yield' },
    { name: 'momentum', label: 'Momentum', description: 'Strong uptrend' },
    { name: 'oversold', label: 'Oversold', description: 'RSI < 30' },
    { name: 'overbought', label: 'Overbought', description: 'RSI > 70' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Stock Screener</h1>
              <p className="text-slate-400">Filter stocks by technical signals and fundamental metrics</p>
            </div>
            <Button
              onClick={() => runScreen()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Screening...' : 'Run Screen'}
            </Button>
          </div>
        </div>

        {/* Preset Screens */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Preset Screens</CardTitle>
            <CardDescription className="text-slate-400">Quick access to common screening criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {presets.map(preset => (
                <Button
                  key={preset.name}
                  variant="outline"
                  onClick={() => runScreen(preset.name)}
                  disabled={loading}
                  className="flex flex-col h-auto py-3 text-left"
                >
                  <span className="font-semibold text-white">{preset.label}</span>
                  <span className="text-xs text-slate-400 mt-1">{preset.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Technical Filters */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Technical Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-xs">RSI Range</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.rsiMin || ''}
                      onChange={(e) => setFilters({ ...filters, rsiMin: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.rsiMax || ''}
                      onChange={(e) => setFilters({ ...filters, rsiMax: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">MACD Signal</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.macdBullish ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, macdBullish: !filters.macdBullish, macdBearish: false })}
                      className="flex-1"
                    >
                      Bullish
                    </Button>
                    <Button
                      variant={filters.macdBearish ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, macdBearish: !filters.macdBearish, macdBullish: false })}
                      className="flex-1"
                    >
                      Bearish
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 text-xs">Bollinger Bands</Label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <Button
                      variant={filters.bollinger === 'oversold' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, bollinger: filters.bollinger === 'oversold' ? undefined : 'oversold' })}
                      className="text-xs"
                    >
                      Oversold
                    </Button>
                    <Button
                      variant={filters.bollinger === 'neutral' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, bollinger: filters.bollinger === 'neutral' ? undefined : 'neutral' })}
                      className="text-xs"
                    >
                      Neutral
                    </Button>
                    <Button
                      variant={filters.bollinger === 'overbought' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters({ ...filters, bollinger: filters.bollinger === 'overbought' ? undefined : 'overbought' })}
                      className="text-xs"
                    >
                      Overbought
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fundamental Filters */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Fundamental Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-xs">P/E Ratio</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.peRatioMin || ''}
                      onChange={(e) => setFilters({ ...filters, peRatioMin: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.peRatioMax || ''}
                      onChange={(e) => setFilters({ ...filters, peRatioMax: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 text-xs">Dividend Yield (%)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.dividendYieldMin || ''}
                      onChange={(e) => setFilters({ ...filters, dividendYieldMin: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.dividendYieldMax || ''}
                      onChange={(e) => setFilters({ ...filters, dividendYieldMax: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 text-xs">Market Cap (B)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.marketCapMin || ''}
                      onChange={(e) => setFilters({ ...filters, marketCapMin: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.marketCapMax || ''}
                      onChange={(e) => setFilters({ ...filters, marketCapMax: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 text-xs">Price Change (%)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceChangeMin || ''}
                      onChange={(e) => setFilters({ ...filters, priceChangeMin: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceChangeMax || ''}
                      onChange={(e) => setFilters({ ...filters, priceChangeMax: e.target.value ? Number(e.target.value) : undefined })}
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setResults([]);
                setSortBy('ticker');
                setSortOrder('asc');
              }}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>

          {/* Results Table */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Screening Results</CardTitle>
                    <CardDescription className="text-slate-400">
                      {filtered > 0 ? `${filtered} of ${total} stocks match your criteria` : 'Run a screen to see results'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-slate-400">Screening stocks...</div>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No results yet. Select filters and run a screen.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('ticker')}>
                            <div className="flex items-center gap-1">
                              Ticker
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="text-right py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                            <div className="flex items-center justify-end gap-1">
                              Price
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="text-right py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('change')}>
                            <div className="flex items-center justify-end gap-1">
                              Change
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="text-right py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('pe')}>
                            <div className="flex items-center justify-end gap-1">
                              P/E
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="text-right py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('yield')}>
                            <div className="flex items-center justify-end gap-1">
                              Yield
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="text-right py-3 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('rsi')}>
                            <div className="flex items-center justify-end gap-1">
                              RSI
                              <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </th>
                          <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                            Signals
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((stock) => (
                          <tr key={stock.ticker} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="py-3 px-4">
                              <Link href={`/stock/${stock.ticker}`}>
                                <a className="text-blue-400 hover:text-blue-300 font-semibold">
                                  {stock.ticker}
                                </a>
                              </Link>
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              ${stock.price.toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-4">
                              <div className={`flex items-center justify-end gap-1 ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stock.changePercent.toFixed(2)}%
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              {stock.peRatio?.toFixed(2) || 'N/A'}
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              {stock.dividendYield?.toFixed(2) || 'N/A'}%
                            </td>
                            <td className="text-right py-3 px-4 text-white">
                              {stock.rsi?.toFixed(1) || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {stock.signals.slice(0, 2).map((signal, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white"
                                  >
                                    {signal}
                                  </span>
                                ))}
                                {stock.signals.length > 2 && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-slate-600 text-white">
                                    +{stock.signals.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
