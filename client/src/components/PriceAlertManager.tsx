import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Trash2, CheckCircle, AlertCircle, History } from "lucide-react";
import {
  createPriceAlert,
  getStockAlerts,
  deletePriceAlert,
  deactivatePriceAlert,
  getAlertHistory,
  clearAlertHistory,
  requestNotificationPermission,
  simulatePriceCheck,
  getAlertStats,
  type PriceAlert,
  type AlertHistory
} from "@/lib/priceAlerts";

interface PriceAlertManagerProps {
  ticker: string;
  currentPrice: number;
}

export default function PriceAlertManager({ ticker, currentPrice }: PriceAlertManagerProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const [notes, setNotes] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [stats, setStats] = useState({ totalAlerts: 0, activeAlerts: 0, triggeredAlerts: 0, historyCount: 0 });

  // Load alerts and history on mount
  useEffect(() => {
    loadAlerts();
    loadHistory();
    loadStats();
    checkNotificationPermission();
  }, [ticker]);

  const loadAlerts = () => {
    const stockAlerts = getStockAlerts(ticker);
    setAlerts(stockAlerts);
  };

  const loadHistory = () => {
    const alertHistory = getAlertHistory();
    const tickerHistory = alertHistory.filter((h) => h.ticker === ticker);
    setHistory(tickerHistory);
  };

  const loadStats = () => {
    const alertStats = getAlertStats();
    setStats(alertStats);
  };

  const checkNotificationPermission = async () => {
    if ("Notification" in window) {
      setNotificationEnabled(Notification.permission === "granted");
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
  };

  const handleCreateAlert = () => {
    if (!targetPrice || isNaN(parseFloat(targetPrice))) {
      alert("Please enter a valid target price");
      return;
    }

    createPriceAlert(ticker, parseFloat(targetPrice), alertType, notes);
    setTargetPrice("");
    setNotes("");
    setAlertType("above");
    setIsCreateDialogOpen(false);
    loadAlerts();
    loadStats();
  };

  const handleDeleteAlert = (id: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deletePriceAlert(id);
      loadAlerts();
      loadStats();
    }
  };

  const handleDeactivateAlert = (id: string) => {
    deactivatePriceAlert(id);
    loadAlerts();
    loadStats();
  };

  const handleSimulatePrice = () => {
    const priceInput = prompt("Enter a test price:", currentPrice.toString());
    if (priceInput !== null) {
      const newPrice = parseFloat(priceInput);
      if (!isNaN(newPrice)) {
        simulatePriceCheck(ticker, newPrice);
        loadHistory();
        loadStats();
      }
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all alert history?")) {
      clearAlertHistory();
      loadHistory();
      loadStats();
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Alert Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
            <Bell size={18} />
            Set Price Alert
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Set Price Alert for {ticker}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-700/50 p-3 rounded">
              <p className="text-slate-300 text-sm">
                Current Price: <span className="font-bold text-white">${currentPrice.toFixed(2)}</span>
              </p>
            </div>

            <div>
              <Label htmlFor="target-price" className="text-slate-300 mb-2 block">
                Target Price
              </Label>
              <Input
                id="target-price"
                type="number"
                placeholder="e.g., 350.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                step="0.01"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Alert Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="above"
                    checked={alertType === "above"}
                    onChange={(e) => setAlertType(e.target.value as "above" | "below")}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600"
                  />
                  <span className="text-slate-300">Alert when price goes above</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="below"
                    checked={alertType === "below"}
                    onChange={(e) => setAlertType(e.target.value as "above" | "below")}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600"
                  />
                  <span className="text-slate-300">Alert when price goes below</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="alert-notes" className="text-slate-300 mb-2 block">
                Notes (Optional)
              </Label>
              <Textarea
                id="alert-notes"
                placeholder="Add notes about this alert..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                rows={2}
              />
            </div>

            {!notificationEnabled && (
              <div className="bg-amber-600/20 border border-amber-600/30 p-3 rounded">
                <p className="text-amber-400 text-sm mb-2">Enable notifications to receive alerts</p>
                <Button
                  onClick={handleEnableNotifications}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm"
                  size="sm"
                >
                  Enable Notifications
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreateDialogOpen(false)}
                variant="outline"
                className="flex-1 bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAlert}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Alerts List */}
      {alerts.length > 0 && (
        <Card className="bg-slate-700 border-slate-600 p-4">
          <h4 className="text-white font-semibold mb-3">Active Alerts ({alerts.length})</h4>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-slate-600/50 p-3 rounded flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={16} className="text-blue-400" />
                    <span className="text-white font-semibold">
                      Alert when price goes {alert.alertType} ${alert.targetPrice.toFixed(2)}
                    </span>
                  </div>
                  {alert.notes && <p className="text-slate-400 text-sm">{alert.notes}</p>}
                  <p className="text-slate-500 text-xs mt-1">
                    Created: {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDeactivateAlert(alert.id)}
                    variant="outline"
                    className="bg-slate-600 text-slate-300 border-slate-500 hover:bg-slate-500 text-xs"
                    size="sm"
                  >
                    Deactivate
                  </Button>
                  <Button
                    onClick={() => handleDeleteAlert(alert.id)}
                    variant="outline"
                    className="bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30 text-xs"
                    size="sm"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alert Statistics */}
      <Card className="bg-slate-700 border-slate-600 p-4">
        <h4 className="text-white font-semibold mb-3">Alert Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-600/50 p-3 rounded">
            <p className="text-slate-400 text-xs mb-1">Total Alerts</p>
            <p className="text-white text-lg font-bold">{stats.totalAlerts}</p>
          </div>
          <div className="bg-slate-600/50 p-3 rounded">
            <p className="text-slate-400 text-xs mb-1">Active</p>
            <p className="text-blue-400 text-lg font-bold">{stats.activeAlerts}</p>
          </div>
          <div className="bg-slate-600/50 p-3 rounded">
            <p className="text-slate-400 text-xs mb-1">Triggered</p>
            <p className="text-emerald-400 text-lg font-bold">{stats.triggeredAlerts}</p>
          </div>
          <div className="bg-slate-600/50 p-3 rounded">
            <p className="text-slate-400 text-xs mb-1">History</p>
            <p className="text-purple-400 text-lg font-bold">{stats.historyCount}</p>
          </div>
        </div>
      </Card>

      {/* Alert History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 flex items-center justify-center gap-2"
          >
            <History size={18} />
            View Alert History
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Alert History</DialogTitle>
          </DialogHeader>

          {history.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No triggered alerts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <Card key={entry.id} className="bg-slate-700 border-slate-600 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-semibold">{entry.ticker}</h4>
                      <p className="text-slate-400 text-sm">{entry.message}</p>
                    </div>
                    <span className="text-emerald-400 text-sm font-semibold">Triggered</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    {new Date(entry.triggeredAt).toLocaleString()}
                  </p>
                </Card>
              ))}

              <Button
                onClick={handleClearHistory}
                variant="outline"
                className="w-full bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30 mt-4"
              >
                Clear History
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Alert Button (for demo) */}
      <Button
        onClick={handleSimulatePrice}
        variant="outline"
        className="w-full bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 text-sm"
        size="sm"
      >
        Test Alert (Simulate Price)
      </Button>
    </div>
  );
}
