import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Building2, ShoppingCart, ShoppingBag, Zap, Building, Heart, 
  Factory, Cpu, Gem, Home, Lightbulb, TrendingUp, ArrowRight,
  TrendingDown, Activity
} from 'lucide-react';
import { SECTORS, getSecuritiesBySector } from '../../../shared/stockUniverse';
import { QuickAddToWatchlist } from '@/components/QuickAddToWatchlist';

const sectorIcons: Record<string, any> = {
  'Communication Services': Lightbulb,
  'Consumer Discretionary': ShoppingCart,
  'Consumer Staples': ShoppingBag,
  'Energy': Zap,
  'Financials': Building,
  'Health Care': Heart,
  'Industrials': Factory,
  'Information Technology': Cpu,
  'Materials': Gem,
  'Real Estate': Home,
  'Utilities': Building2,
};

const sectorColors: Record<string, string> = {
  'Communication Services': 'from-purple-500 to-pink-500',
  'Consumer Discretionary': 'from-blue-500 to-cyan-500',
  'Consumer Staples': 'from-green-500 to-emerald-500',
  'Energy': 'from-yellow-500 to-orange-500',
  'Financials': 'from-indigo-500 to-blue-500',
  'Health Care': 'from-red-500 to-pink-500',
  'Industrials': 'from-gray-500 to-slate-500',
  'Information Technology': 'from-cyan-500 to-blue-500',
  'Materials': 'from-amber-500 to-yellow-500',
  'Real Estate': 'from-teal-500 to-green-500',
  'Utilities': 'from-slate-500 to-gray-500',
};

interface SectorPerformance {
  sector: string;
  avgReturn: number;
  volatility: number;
  topGainers: Array<{ ticker: string; name: string; change: number }>;
  topLosers: Array<{ ticker: string; name: string; change: number }>;
  stockCount: number;
  momentum: 'strong' | 'moderate' | 'weak' | 'negative';
}

export default function Sectors() {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sectorPerformance, setSectorPerformance] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectorPerformance = async () => {
      try {
        const response = await fetch('/api/sector-performance');
        const data = await response.json();
        setSectorPerformance(data);
      } catch (error) {
        console.error('Failed to fetch sector performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSectorPerformance();
  }, []);

  const sectorStocks = selectedSector ? getSecuritiesBySector(selectedSector) : [];
  const selectedPerformance = sectorPerformance.find(p => p.sector === selectedSector);

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'strong': return 'text-green-400 bg-green-500/10';
      case 'moderate': return 'text-blue-400 bg-blue-500/10';
      case 'weak': return 'text-yellow-400 bg-yellow-500/10';
      case 'negative': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Sector Browser</h1>
              <p className="text-slate-400">Explore S&P 500 stocks by GICS sector with real-time performance metrics</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {!selectedSector ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">11 GICS Sectors</h2>
              <p className="text-slate-400">Select a sector to explore stocks and view performance metrics</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Activity className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading sector performance data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SECTORS.map((sector) => {
                  const Icon = sectorIcons[sector] || TrendingUp;
                  const gradient = sectorColors[sector] || 'from-gray-500 to-slate-500';
                  const performance = sectorPerformance.find(p => p.sector === sector);

                  return (
                    <Card
                      key={sector}
                      className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
                      onClick={() => setSelectedSector(sector)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          {performance && (
                            <Badge className={getMomentumColor(performance.momentum)}>
                              {performance.momentum}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                          {sector}
                        </h3>

                        {performance && (
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Avg Return:</span>
                              <span className={performance.avgReturn >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                {performance.avgReturn >= 0 ? '+' : ''}{performance.avgReturn.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Volatility:</span>
                              <span className="text-slate-300">{performance.volatility.toFixed(2)}%</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                          <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                            {performance?.stockCount || 0} stocks
                          </Badge>
                          <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setSelectedSector(null)}
                className="text-slate-400 hover:text-white mb-4"
              >
                ← Back to Sectors
              </Button>
              
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedSector}</h2>
                  <p className="text-slate-400">{sectorStocks.length} stocks in this sector</p>
                </div>

                {selectedPerformance && (
                  <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Sector Performance</div>
                        <div className={`text-2xl font-bold ${selectedPerformance.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {selectedPerformance.avgReturn >= 0 ? '+' : ''}{selectedPerformance.avgReturn.toFixed(2)}%
                        </div>
                      </div>
                      <div className="border-l border-slate-700 pl-6">
                        <div className="text-xs text-slate-400 mb-1">Volatility</div>
                        <div className="text-2xl font-bold text-slate-300">
                          {selectedPerformance.volatility.toFixed(2)}%
                        </div>
                      </div>
                      <Badge className={getMomentumColor(selectedPerformance.momentum)}>
                        {selectedPerformance.momentum}
                      </Badge>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {selectedPerformance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Top Gainers</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedPerformance.topGainers.map((stock) => (
                      <Link key={stock.ticker} href={`/stock/${stock.ticker}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                          <div>
                            <div className="font-semibold text-white">{stock.ticker}</div>
                            <div className="text-xs text-slate-400 truncate max-w-[200px]">{stock.name}</div>
                          </div>
                          <div className="text-green-400 font-semibold">
                            +{stock.change.toFixed(2)}%
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Top Losers</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedPerformance.topLosers.map((stock) => (
                      <Link key={stock.ticker} href={`/stock/${stock.ticker}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                          <div>
                            <div className="font-semibold text-white">{stock.ticker}</div>
                            <div className="text-xs text-slate-400 truncate max-w-[200px]">{stock.name}</div>
                          </div>
                          <div className="text-red-400 font-semibold">
                            {stock.change.toFixed(2)}%
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-white mb-4">All Stocks in {selectedSector}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sectorStocks.map((stock) => (
                  <Card key={stock.ticker} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/stock/${stock.ticker}`} className="flex-1 cursor-pointer">
                          <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">
                            {stock.ticker}
                          </h3>
                          <p className="text-sm text-slate-400 line-clamp-2">{stock.name}</p>
                        </Link>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <QuickAddToWatchlist ticker={stock.ticker} name={stock.name} variant="icon" size="sm" />
                          <Link href={`/stock/${stock.ticker}`}>
                            <TrendingUp className="h-5 w-5 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
