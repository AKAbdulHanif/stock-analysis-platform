import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BarChart3 } from "lucide-react";
import CandlestickChart from "./CandlestickChart";

interface PriceChartModalProps {
  ticker: string;
  currentPrice: number;
}

type TimePeriod = "1h" | "4h" | "1d" | "7d" | "30d";

export default function PriceChartModal({ ticker, currentPrice }: PriceChartModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState<TimePeriod>("1h");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2" size="sm">
          <BarChart3 size={16} />
          View Chart
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{ticker} - Price Chart</span>
            <span className="text-sm font-normal text-slate-400">${currentPrice.toFixed(2)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Period Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-300">Time Period:</span>
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(value) => {
                if (value) setPeriod(value as TimePeriod);
              }}
              className="justify-start"
            >
              <ToggleGroupItem
                value="1h"
                className="bg-slate-700 border-slate-600 text-slate-300 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                1H
              </ToggleGroupItem>
              <ToggleGroupItem
                value="4h"
                className="bg-slate-700 border-slate-600 text-slate-300 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                4H
              </ToggleGroupItem>
              <ToggleGroupItem
                value="1d"
                className="bg-slate-700 border-slate-600 text-slate-300 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                1D
              </ToggleGroupItem>
              <ToggleGroupItem
                value="7d"
                className="bg-slate-700 border-slate-600 text-slate-300 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                7D
              </ToggleGroupItem>
              <ToggleGroupItem
                value="30d"
                className="bg-slate-700 border-slate-600 text-slate-300 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                30D
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Chart */}
          <div className="bg-slate-900 rounded-lg p-4">
            <CandlestickChart ticker={ticker} basePrice={currentPrice} period={period} />
          </div>

          {/* Technical Analysis Info */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 text-sm">
            <h4 className="font-semibold mb-2 text-slate-200">Technical Indicators</h4>
            <div className="grid grid-cols-2 gap-4 text-slate-300">
              <div>
                <p className="text-slate-400 text-xs mb-1">SMA 20</p>
                <p className="text-sm">20-period Simple Moving Average - Short-term trend</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">SMA 50</p>
                <p className="text-sm">50-period Simple Moving Average - Medium-term trend</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Bollinger Bands</p>
                <p className="text-sm">Volatility indicator - Support/Resistance levels</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Candlesticks</p>
                <p className="text-sm">Green: Bullish | Red: Bearish</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
