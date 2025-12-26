import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Zap, Pause } from "lucide-react";
import { usePrices } from "@/contexts/PriceContext";

export default function PriceUpdateIndicator() {
  const { lastUpdate, isLive, toggleLiveUpdates, refreshAllPrices } = usePrices();
  const [timeAgo, setTimeAgo] = useState<string>("just now");

  // Update "time ago" display
  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const lastUpdateTime = new Date(lastUpdate);
      const diffMs = now.getTime() - lastUpdateTime.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 60) {
        setTimeAgo("just now");
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diffMins / 60)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const baseTickers = ["TSM", "NVDA", "AVGO", "ASML", "UNH", "JNJ", "JPM", "BAC", "GLD", "SLV"];

  return (
    <Card className="bg-slate-800 border-slate-700 p-4 sticky top-4 z-40">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <Badge className="bg-emerald-600/20 border-emerald-600/50 text-emerald-400 border">
                  <Zap size={12} className="mr-1" />
                  Live Updates
                </Badge>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <Badge className="bg-slate-600/20 border-slate-600/50 text-slate-400 border">
                  <Pause size={12} className="mr-1" />
                  Paused
                </Badge>
              </>
            )}
          </div>
          <span className="text-xs text-slate-400">Updated {timeAgo}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => refreshAllPrices(baseTickers)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            onClick={toggleLiveUpdates}
            size="sm"
            className={`flex items-center gap-1 text-xs ${
              isLive
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            {isLive ? (
              <>
                <Pause size={14} />
                Pause
              </>
            ) : (
              <>
                <Zap size={14} />
                Resume
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
