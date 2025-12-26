import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, RefreshCw } from "lucide-react";
import { recordTradeEntry, closeTradeEntry, type TradeEntry } from "@/lib/performanceTracking";
import { ALERT_TEMPLATES } from "@/lib/alertTemplates";
import { useStockPrice } from "@/contexts/PriceContext";

interface TradeEntryFormProps {
  stockTicker: string;
  currentPrice: number;
  onTradeRecorded?: (trade: TradeEntry) => void;
}

export default function TradeEntryForm({ stockTicker, currentPrice: initialPrice, onTradeRecorded }: TradeEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [exitPrice, setExitPrice] = useState<string>("");
  const [showExitForm, setShowExitForm] = useState(false);

  const { price: livePrice, refresh } = useStockPrice(stockTicker);
  const currentPrice = livePrice || initialPrice;
  const templateNames = ALERT_TEMPLATES.map((t) => t.name);

  const handleRecordEntry = () => {
    if (!entryPrice || !selectedTemplate) {
      alert("Please enter entry price and select a template");
      return;
    }

    const templateId = selectedTemplate.toLowerCase().replace(/\s+/g, "-");
    const trade = recordTradeEntry(
      stockTicker,
      templateId,
      selectedTemplate,
      parseFloat(entryPrice),
      parseInt(quantity) || 1,
      notes
    );

    onTradeRecorded?.(trade);

    // Reset form
    setEntryPrice("");
    setQuantity("1");
    setSelectedTemplate("");
    setNotes("");
    setIsOpen(false);
  };

  const handleRecordExit = (tradeId: string) => {
    if (!exitPrice) {
      alert("Please enter exit price");
      return;
    }

    closeTradeEntry(tradeId, parseFloat(exitPrice));
    setExitPrice("");
    setShowExitForm(false);
  };

  const unrealizedReturn = entryPrice
    ? (((currentPrice - parseFloat(entryPrice)) / parseFloat(entryPrice)) * 100).toFixed(2)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2" size="sm">
          <Plus size={16} />
          Record Trade
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Record Trade - {stockTicker}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Entry Price */}
          <div>
            <label className="text-slate-300 text-sm font-semibold mb-2 block">Entry Price ($)</label>
            <Input
              type="number"
              placeholder="Enter entry price"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              step="0.01"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="text-slate-300 text-sm font-semibold mb-2 block">Quantity (Shares)</label>
            <Input
              type="number"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              min="1"
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="text-slate-300 text-sm font-semibold mb-2 block">Strategy Template</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {templateNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Price & Unrealized Return */}
          {entryPrice && (
            <Card className="bg-slate-700 border-slate-600 p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-semibold">Live Price Data</p>
                <Button
                  onClick={refresh}
                  size="sm"
                  className="bg-slate-600 hover:bg-slate-500 text-white h-6 px-2 text-xs"
                >
                  <RefreshCw size={12} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Current Price</p>
                  <p className="text-white font-semibold">${currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Unrealized Return</p>
                  <p className={`font-semibold ${unrealizedReturn && parseFloat(unrealizedReturn) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {unrealizedReturn}%
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          <div>
            <label className="text-slate-300 text-sm font-semibold mb-2 block">Notes (Optional)</label>
            <Textarea
              placeholder="Add notes about this trade..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 text-sm"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleRecordEntry}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Record Entry
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300"
            >
              Cancel
            </Button>
          </div>

          {/* Exit Price Form */}
          {showExitForm && (
            <Card className="bg-emerald-600/10 border-emerald-600/30 p-3">
              <p className="text-emerald-400 text-sm font-semibold mb-2">Close Trade</p>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Exit price"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 text-sm"
                  step="0.01"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRecordExit(`${stockTicker}-${Date.now()}`)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                  >
                    Close Trade
                  </Button>
                  <Button
                    onClick={() => setShowExitForm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
