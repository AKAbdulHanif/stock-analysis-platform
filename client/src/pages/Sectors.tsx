import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Building2, ShoppingCart, ShoppingBag, Zap, Building, Heart, 
  Factory, Cpu, Gem, Home, Lightbulb, TrendingUp, ArrowRight 
} from 'lucide-react';
import { SECTORS, getSecuritiesBySector } from '../../../shared/stockUniverse';

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

export default function Sectors() {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const sectorStocks = selectedSector ? getSecuritiesBySector(selectedSector) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Sector Browser</h1>
              <p className="text-slate-400">Explore S&P 500 stocks by GICS sector</p>
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
              <p className="text-slate-400">Select a sector to explore stocks and ETFs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SECTORS.map((sector) => {
                const Icon = sectorIcons[sector] || TrendingUp;
                const gradient = sectorColors[sector] || 'from-gray-500 to-slate-500';
                const stockCount = getSecuritiesBySector(sector).length;

                return (
                  <Card
                    key={sector}
                    className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
                    onClick={() => setSelectedSector(sector)}
                  >
                    <div className="p-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {sector}
                      </h3>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                          {stockCount} stocks
                        </Badge>
                        <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSector(null)}
                  className="text-slate-400 hover:text-white mb-2"
                >
                  ← Back to Sectors
                </Button>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedSector}</h2>
                <p className="text-slate-400">{sectorStocks.length} stocks in this sector</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sectorStocks.map((stock) => (
                <Link key={stock.ticker} href={`/stock/${stock.ticker}`}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">
                            {stock.ticker}
                          </h3>
                          <p className="text-sm text-slate-400 line-clamp-2">{stock.name}</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
