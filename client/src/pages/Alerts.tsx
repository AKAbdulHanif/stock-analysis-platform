import { useState, useEffect } from "react";
import { Bell, Plus, Trash2, Power, PowerOff, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Alert {
  id: number;
  userId: number;
  ticker: string;
  alertType: "price_above" | "price_below" | "sentiment_positive" | "sentiment_negative";
  targetValue: number;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: Date;
}

interface Notification {
  id: number;
  userId: number;
  alertId: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newAlertTicker, setNewAlertTicker] = useState("");
  const [newAlertType, setNewAlertType] = useState<Alert["alertType"]>("price_above");
  const [newAlertValue, setNewAlertValue] = useState("");
  const [newAlertRecurring, setNewAlertRecurring] = useState(false);

  const userId = 1; // TODO: Get from auth context

  useEffect(() => {
    fetchAlerts();
    fetchNotifications();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts", {
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/alerts/notifications", {
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const createAlert = async () => {
    if (!newAlertTicker.trim()) {
      toast.error("Please enter a ticker symbol");
      return;
    }

    if (!newAlertValue || isNaN(parseFloat(newAlertValue))) {
      toast.error("Please enter a valid target value");
      return;
    }

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({
          ticker: newAlertTicker.toUpperCase(),
          alertType: newAlertType,
          targetValue: parseFloat(newAlertValue),
          isRecurring: newAlertRecurring,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create alert" }));
        throw new Error(errorData.message || "Failed to create alert");
      }

      const newAlert = await response.json();
      setAlerts(prev => [...prev, newAlert]);
      setNewAlertTicker("");
      setNewAlertValue("");
      setNewAlertRecurring(false);
      setCreateDialogOpen(false);
      toast.success("Alert created successfully");
      await fetchAlerts();
    } catch (error: any) {
      console.error("Error creating alert:", error);
      toast.error(error.message || "Failed to create alert");
    }
  };

  const toggleAlertStatus = async (alertId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId ? { ...alert, isActive: !currentStatus } : alert
        )
      );
      toast.success(`Alert ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error("Failed to update alert");
    }
  };

  const deleteAlert = async (alertId: number) => {
    if (!confirm("Are you sure you want to delete this alert?")) {
      return;
    }

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success("Alert deleted successfully");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/alerts/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getAlertTypeLabel = (type: Alert["alertType"]) => {
    switch (type) {
      case "price_above":
        return "Price Above";
      case "price_below":
        return "Price Below";
      case "sentiment_positive":
        return "Sentiment Positive";
      case "sentiment_negative":
        return "Sentiment Negative";
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Alerts & Notifications</h1>
            <p className="text-slate-400">Manage your price and sentiment alerts</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Alert
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        notification.isRead
                          ? "bg-slate-800/30 border-slate-700/50"
                          : "bg-blue-900/20 border-blue-700/50"
                      }`}
                      onClick={() => !notification.isRead && markNotificationRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-300 flex-1">{notification.message}</p>
                        {!notification.isRead && (
                          <Circle className="w-3 h-3 fill-blue-500 text-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Alerts List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Active Alerts</h2>

              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 mb-4">You don't have any alerts yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Alert
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-white">{alert.ticker}</span>
                          <span className="text-sm px-2 py-1 rounded bg-slate-700 text-slate-300">
                            {getAlertTypeLabel(alert.alertType)}
                          </span>
                          {alert.isRecurring && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-300">
                              Recurring
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">
                          Target: {alert.alertType.includes("price") ? "$" : ""}
                          {alert.targetValue.toFixed(2)}
                          {alert.alertType.includes("sentiment") ? "%" : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlertStatus(alert.id, alert.isActive)}
                          className={alert.isActive ? "text-green-400" : "text-slate-500"}
                        >
                          {alert.isActive ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Create Alert Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Alert</DialogTitle>
              <DialogDescription className="text-slate-400">
                Set up a price or sentiment alert for a stock
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="ticker" className="text-slate-300">
                  Ticker Symbol
                </Label>
                <Input
                  id="ticker"
                  placeholder="AAPL"
                  value={newAlertTicker}
                  onChange={e => setNewAlertTicker(e.target.value.toUpperCase())}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="alertType" className="text-slate-300">
                  Alert Type
                </Label>
                <Select value={newAlertType} onValueChange={(value: Alert["alertType"]) => setNewAlertType(value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="price_above">Price Above</SelectItem>
                    <SelectItem value="price_below">Price Below</SelectItem>
                    <SelectItem value="sentiment_positive">Sentiment Positive</SelectItem>
                    <SelectItem value="sentiment_negative">Sentiment Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetValue" className="text-slate-300">
                  Target Value {newAlertType.includes("price") ? "($)" : "(%)"}
                </Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  placeholder={newAlertType.includes("price") ? "100.00" : "5.0"}
                  value={newAlertValue}
                  onChange={e => setNewAlertValue(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recurring" className="text-slate-300">
                  Recurring Alert
                </Label>
                <Switch
                  id="recurring"
                  checked={newAlertRecurring}
                  onCheckedChange={setNewAlertRecurring}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button onClick={createAlert} className="flex-1">
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
