/**
 * Sector Rotation Page
 * Display sector rotation heatmap and analysis
 */

import { SectorRotationHeatmap } from "@/components/SectorRotationHeatmap";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function SectorRotation() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sector Rotation Analysis</h1>
          <p className="text-slate-400">
            Track relative strength across 11 market sectors to identify rotation opportunities
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <SectorRotationHeatmap />

      {/* Interpretation Guide */}
      <div className="mt-8 p-6 bg-slate-800 border border-slate-700 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">How to Use Sector Rotation</h2>
        <div className="space-y-4 text-slate-300">
          <div>
            <h3 className="font-semibold text-white mb-2">Understanding Relative Strength</h3>
            <p className="text-sm">
              Relative strength shows how each sector is performing compared to the S&P 500 over the past 3 months.
              Positive values indicate outperformance, while negative values indicate underperformance.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Momentum Indicators</h3>
            <p className="text-sm">
              Momentum arrows show the trend direction based on recent performance (1 week, 1 month, 3 months).
              Strong uptrends suggest sustained outperformance, while strong downtrends indicate weakness.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Investment Strategy</h3>
            <p className="text-sm">
              Consider rotating into sectors showing strong relative strength and positive momentum.
              Sectors with strong downtrends may present buying opportunities if fundamentals remain strong.
              Use this alongside fundamental analysis and your risk tolerance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
