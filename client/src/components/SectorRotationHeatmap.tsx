/**
 * Sector Rotation Heatmap Component
 * Visualize relative strength across 11 sectors
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";

interface SectorData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  relativeStrength: number;
  momentum: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
  performance: {
    oneWeek: number;
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
  };
}

export function SectorRotationHeatmap() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/sector-rotation");
        
        if (!response.ok) {
          throw new Error("Failed to fetch sector rotation data");
        }

        const data = await response.json();
        setSectors(data.sectors || []);
      } catch (err) {
        console.error("Error fetching sector rotation data:", err);
        setError("Failed to load sector rotation data");
      } finally {
        setLoading(false);
      }
    };

    fetchSectorData();
  }, []);

  const getHeatmapColor = (value: number): string => {
    // Color scale from red (negative) to green (positive)
    if (value >= 10) return "bg-green-600";
    if (value >= 5) return "bg-green-500";
    if (value >= 2) return "bg-green-400";
    if (value >= 0) return "bg-blue-400";
    if (value >= -2) return "bg-orange-400";
    if (value >= -5) return "bg-orange-500";
    return "bg-red-500";
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'strong_up':
        return <ArrowUp className="h-4 w-4 text-green-400" />;
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'strong_down':
        return <ArrowDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMomentumLabel = (momentum: string): string => {
    switch (momentum) {
      case 'strong_up': return 'Strong Uptrend';
      case 'up': return 'Uptrend';
      case 'down': return 'Downtrend';
      case 'strong_down': return 'Strong Downtrend';
      default: return 'Neutral';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading sector rotation data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || sectors.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-destructive">{error || "No data available"}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle>Sector Rotation Heatmap</CardTitle>
        <CardDescription>
          Relative strength vs S&P 500 (3-month performance)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Heatmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {sectors.map((sector) => (
            <div
              key={sector.ticker}
              className={`${getHeatmapColor(sector.relativeStrength)} p-4 rounded-lg transition-all hover:scale-105 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-white font-bold text-sm">{sector.name}</div>
                  <div className="text-white/80 text-xs">{sector.ticker}</div>
                </div>
                {getMomentumIcon(sector.momentum)}
              </div>
              <div className="text-white font-bold text-lg">
                {sector.relativeStrength >= 0 ? '+' : ''}{sector.relativeStrength.toFixed(2)}%
              </div>
              <div className="text-white/80 text-xs mt-1">
                vs S&P 500
              </div>
            </div>
          ))}
        </div>

        {/* Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Sector</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Price</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Today</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">1W</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">1M</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">3M</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">6M</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">1Y</th>
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Momentum</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector) => (
                <tr key={sector.ticker} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-2">
                    <div className="font-medium text-white">{sector.name}</div>
                    <div className="text-xs text-slate-400">{sector.ticker}</div>
                  </td>
                  <td className="text-right py-3 px-2 text-white font-medium">
                    ${sector.price.toFixed(2)}
                  </td>
                  <td className={`text-right py-3 px-2 font-medium ${sector.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                  </td>
                  <td className={`text-right py-3 px-2 ${sector.performance.oneWeek >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.performance.oneWeek >= 0 ? '+' : ''}{sector.performance.oneWeek.toFixed(2)}%
                  </td>
                  <td className={`text-right py-3 px-2 ${sector.performance.oneMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.performance.oneMonth >= 0 ? '+' : ''}{sector.performance.oneMonth.toFixed(2)}%
                  </td>
                  <td className={`text-right py-3 px-2 ${sector.performance.threeMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.performance.threeMonth >= 0 ? '+' : ''}{sector.performance.threeMonth.toFixed(2)}%
                  </td>
                  <td className={`text-right py-3 px-2 ${sector.performance.sixMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.performance.sixMonth >= 0 ? '+' : ''}{sector.performance.sixMonth.toFixed(2)}%
                  </td>
                  <td className={`text-right py-3 px-2 ${sector.performance.oneYear >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.performance.oneYear >= 0 ? '+' : ''}{sector.performance.oneYear.toFixed(2)}%
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {getMomentumIcon(sector.momentum)}
                      <span className="text-xs text-slate-300">{getMomentumLabel(sector.momentum)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
          <div className="text-sm font-medium text-white mb-3">Heatmap Legend</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-slate-300">Strong Outperformance (&gt;10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-slate-300">Moderate Outperformance (2-10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span className="text-slate-300">Moderate Underperformance (-2 to -5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-slate-300">Strong Underperformance (&lt;-5%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
