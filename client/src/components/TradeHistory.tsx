import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, History, Trash2 } from "lucide-react";
import { getAllTrades, calculateTradeReturn, type TradeEntry } from "@/lib/performanceTracking";

interface TradeHistoryProps {
  stockTicker?: string;
  onlyActive?: boolean;
}

export default function TradeHistory({ stockTicker, onlyActive = false }: TradeHistoryProps) {
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<TradeEntry[]>([]);

  useEffect(() => {
    const allTrades = getAllTrades();
    setTrades(allTrades);

    let filtered = allTrades;
    if (stockTicker) {
      filtered = filtered.filter((t) => t.ticker === stockTicker);
    }
    if (onlyActive) {
      filtered = filtered.filter((t) => t.status === "open");
    }

    setFilteredTrades(filtered);
  }, [stockTicker, onlyActive]);

  const activeTrades = filteredTrades.filter((t) => t.status === "open");
  const closedTrades = filteredTrades.filter((t) => t.status === "closed");

  const calculateMetrics = (tradeList: TradeEntry[]) => {
    let totalReturn = 0;
    let winCount = 0;
    let lossCount = 0;

    tradeList.forEach((trade) => {
      const returnPct = calculateTradeReturn(trade);
      if (returnPct !== null) {
        totalReturn += returnPct;
        if (returnPct > 0) winCount++;
        else if (returnPct < 0) lossCount++;
      }
    });

    return {
      totalReturn: totalReturn.toFixed(2),
      winCount,
      lossCount,
      winRate: tradeList.length > 0 ? ((winCount / tradeList.length) * 100).toFixed(1) : "0"
    };
  };

  const closedMetrics = calculateMetrics(closedTrades);
  const activeMetrics = calculateMetrics(activeTrades);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2" size="sm">
          <History size={16} />
          Trade History
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            Trade History {stockTicker && `- ${stockTicker}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-slate-700 border-slate-600 p-3">
              <p className="text-slate-400 text-xs mb-1">Total Trades</p>
              <p className="text-white text-lg font-bold">{filteredTrades.length}</p>
            </Card>
            <Card className="bg-slate-700 border-slate-600 p-3">
              <p className="text-slate-400 text-xs mb-1">Active Trades</p>
              <p className="text-blue-400 text-lg font-bold">{activeTrades.length}</p>
            </Card>
            <Card className="bg-slate-700 border-slate-600 p-3">
              <p className="text-slate-400 text-xs mb-1">Closed Trades</p>
              <p className="text-emerald-400 text-lg font-bold">{closedTrades.length}</p>
            </Card>
            <Card className="bg-slate-700 border-slate-600 p-3">
              <p className="text-slate-400 text-xs mb-1">Overall Return</p>
              <p className={`text-lg font-bold ${parseFloat(closedMetrics.totalReturn) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {closedMetrics.totalReturn}%
              </p>
            </Card>
          </div>

          {/* Active Trades Section */}
          {activeTrades.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-400" />
                Active Trades ({activeTrades.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeTrades.map((trade) => (
                  <Card key={trade.id} className="bg-slate-700 border-slate-600 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold">{trade.ticker}</p>
                        <p className="text-slate-400 text-xs">{trade.templateName}</p>
                      </div>
                      <Badge className="bg-blue-600 text-white text-xs">OPEN</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400 mb-1">Entry Price</p>
                        <p className="text-white font-semibold">${trade.entryPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">Quantity</p>
                        <p className="text-white font-semibold">{trade.quantity || 1}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">Entry Date</p>
                        <p className="text-white font-semibold">{new Date(trade.entryDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {trade.notes && (
                      <p className="text-slate-400 text-xs mt-2 italic">Note: {trade.notes}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Closed Trades Section */}
          {closedTrades.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <TrendingDown size={18} className="text-emerald-400" />
                  Closed Trades ({closedTrades.length})
                </h3>
                <div className="text-xs">
                  <span className="text-emerald-400 font-semibold">{closedMetrics.winCount}W</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-red-400 font-semibold">{closedMetrics.lossCount}L</span>
                  <span className="text-slate-400 mx-1">|</span>
                  <span className="text-blue-400 font-semibold">{closedMetrics.winRate}%</span>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {closedTrades.map((trade) => {
                  const returnPct = calculateTradeReturn(trade);
                  const isWin = returnPct !== null && returnPct > 0;

                  return (
                    <Card
                      key={trade.id}
                      className={`border p-3 ${
                        isWin
                          ? "bg-emerald-600/10 border-emerald-600/30"
                          : "bg-red-600/10 border-red-600/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-semibold">{trade.ticker}</p>
                          <p className="text-slate-400 text-xs">{trade.templateName}</p>
                        </div>
                        <Badge
                          className={`text-white text-xs ${
                            isWin ? "bg-emerald-600" : "bg-red-600"
                          }`}
                        >
                          {returnPct?.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400 mb-1">Entry</p>
                          <p className="text-white font-semibold">${trade.entryPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Exit</p>
                          <p className="text-white font-semibold">
                            ${trade.exitPrice?.toFixed(2) || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Qty</p>
                          <p className="text-white font-semibold">{trade.quantity || 1}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 mb-1">Duration</p>
                          <p className="text-white font-semibold">
                            {trade.exitDate
                              ? Math.floor(
                                  (new Date(trade.exitDate).getTime() -
                                    new Date(trade.entryDate).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              : 0}
                            d
                          </p>
                        </div>
                      </div>
                      {trade.notes && (
                        <p className="text-slate-400 text-xs mt-2 italic">Note: {trade.notes}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {filteredTrades.length === 0 && (
            <Card className="bg-blue-600/10 border-blue-600/30 p-4">
              <p className="text-blue-300 text-sm">
                No trades recorded yet. Use the "Record Trade" button to start tracking your investments.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
