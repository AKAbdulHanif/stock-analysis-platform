import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { ArrowLeft, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SECTORS } from '../../../shared/stockUniverse';

interface SectorData {
  sector: string;
  historicalPerformance: Array<{ date: string; value: number }>;
  currentReturn: number;
  volatility: number;
  momentum: string;
}

interface RotationSignal {
  sector: string;
  signal: string;
  trend: number;
  momentum: string;
}

export default function SectorComparison() {
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    'Information Technology',
    'Health Care',
    'Financials',
  ]);
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<Record<string, Record<string, number>>>({});
  const [rotationSignals, setRotationSignals] = useState<RotationSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3mo');

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sector-comparison?sectors=${selectedSectors.join(',')}&period=${period}`
        );
        const data = await response.json();
        setSectorData(data.sectors);
        setCorrelationMatrix(data.correlationMatrix);
        setRotationSignals(data.rotationSignals);
      } catch (error) {
        console.error('Failed to fetch sector comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSectors.length > 0) {
      fetchComparison();
    }
  }, [selectedSectors, period]);

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) => {
      if (prev.includes(sector)) {
        return prev.filter((s) => s !== sector);
      } else if (prev.length < 5) {
        return [...prev, sector];
      }
      return prev;
    });
  };

  // Transform data for chart
  const chartData = sectorData.length > 0 && sectorData[0].historicalPerformance.length > 0
    ? sectorData[0].historicalPerformance.map((_, index) => {
        const dataPoint: any = {
          date: new Date(sectorData[0].historicalPerformance[index].date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };
        sectorData.forEach((sector) => {
          dataPoint[sector.sector] = sector.historicalPerformance[index]?.value.toFixed(2) || 0;
        });
        return dataPoint;
      })
    : [];

  const sectorColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
  ];

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'Buy': return 'bg-green-500/10 text-green-500';
      case 'Sell': return 'bg-red-500/10 text-red-500';
      case 'Accumulate': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'strong': return 'text-green-400';
      case 'moderate': return 'text-blue-400';
      case 'weak': return 'text-yellow-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-slate-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Sector Comparison</h1>
          <p className="text-slate-300">
            Compare sector performance, analyze correlations, and identify rotation opportunities
          </p>
        </div>

        {/* Sector Selection */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Select Sectors (up to 5)</h2>
            <p className="text-sm text-slate-400">Click to add or remove sectors from comparison</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <Button
                key={sector}
                variant={selectedSectors.includes(sector) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSector(sector)}
                disabled={!selectedSectors.includes(sector) && selectedSectors.length >= 5}
                className={selectedSectors.includes(sector) ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {sector}
              </Button>
            ))}
          </div>
        </Card>

        {/* Period Selector */}
        <div className="flex gap-2 mb-8">
          {['1mo', '3mo', '6mo', '1y'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === '1mo' && '1 Month'}
              {p === '3mo' && '3 Months'}
              {p === '6mo' && '6 Months'}
              {p === '1y' && '1 Year'}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-300">Loading sector comparison...</p>
          </div>
        ) : (
          <>
            {/* Performance Chart */}
            <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Relative Performance</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend />
                  {sectorData.map((sector, index) => (
                    <Line
                      key={sector.sector}
                      type="monotone"
                      dataKey={sector.sector}
                      stroke={sectorColors[index % sectorColors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Metrics Table */}
            <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Sector Metrics</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-semibold">Sector</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Return</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-semibold">Volatility</th>
                      <th className="text-center py-3 px-4 text-slate-300 font-semibold">Momentum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorData.map((sector) => (
                      <tr key={sector.sector} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-4 text-white font-medium">{sector.sector}</td>
                        <td className={`text-right py-3 px-4 font-semibold ${
                          sector.currentReturn >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {sector.currentReturn >= 0 ? '+' : ''}{sector.currentReturn.toFixed(2)}%
                        </td>
                        <td className="text-right py-3 px-4 text-slate-300">
                          {sector.volatility.toFixed(2)}%
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge className={getMomentumColor(sector.momentum)}>
                            {sector.momentum}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Rotation Signals */}
            <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Sector Rotation Signals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rotationSignals.map((signal) => (
                  <Card key={signal.sector} className="bg-slate-700/30 border-slate-600 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{signal.sector}</h3>
                      {signal.trend >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Badge className={getSignalColor(signal.signal)}>{signal.signal}</Badge>
                      <div className="text-sm text-slate-400">
                        Trend: <span className={signal.trend >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {signal.trend >= 0 ? '+' : ''}{signal.trend.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Correlation Matrix */}
            {Object.keys(correlationMatrix).length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Correlation Matrix</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-2 px-3 text-slate-300 font-semibold"></th>
                        {Object.keys(correlationMatrix).map((sector) => (
                          <th key={sector} className="text-center py-2 px-3 text-slate-300 font-semibold text-sm">
                            {sector.split(' ')[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(correlationMatrix).map(([sector1, correlations]) => (
                        <tr key={sector1} className="border-t border-slate-700/50">
                          <td className="py-2 px-3 text-white font-medium text-sm">{sector1.split(' ')[0]}</td>
                          {Object.entries(correlations).map(([sector2, correlation]) => {
                            const intensity = Math.abs(correlation);
                            const bgColor = correlation > 0
                              ? `rgba(16, 185, 129, ${intensity * 0.5})` // green
                              : `rgba(239, 68, 68, ${intensity * 0.5})`; // red
                            
                            return (
                              <td
                                key={sector2}
                                className="text-center py-2 px-3 text-sm font-semibold"
                                style={{ backgroundColor: bgColor }}
                              >
                                {correlation.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Correlation values range from -1 (inverse relationship) to +1 (strong positive relationship).
                  Green indicates positive correlation, red indicates negative correlation.
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
