import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import SentimentTrendChart from "@/components/SentimentTrendChart";
import { StockNews } from "@/components/StockNews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Watchlist {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WatchlistStock {
  id: number;
  watchlistId: number;
  ticker: string;
  addedAt: string;
}

interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function Watchlists() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [newStockTicker, setNewStockTicker] = useState("");
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  // Mock user ID for development
  const userId = 1;

  // Fetch watchlists
  useEffect(() => {
    fetchWatchlists();
  }, []);

  // Fetch stocks when watchlist is selected
  useEffect(() => {
    if (selectedWatchlist) {
      fetchWatchlistStocks(selectedWatchlist.id);
    }
  }, [selectedWatchlist]);

  // Fetch stock quotes when stocks change
  useEffect(() => {
    if (watchlistStocks.length > 0) {
      fetchStockQuotes(watchlistStocks.map(s => s.ticker));
    }
  }, [watchlistStocks]);

  const fetchWatchlists = async () => {
    try {
      const response = await fetch("/api/watchlists", {
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch watchlists");
      }

      const data = await response.json();
      setWatchlists(data.watchlists);
      
      // Select first watchlist by default
      if (data.watchlists.length > 0 && !selectedWatchlist) {
        setSelectedWatchlist(data.watchlists[0]);
      }
    } catch (error) {
      console.error("Error fetching watchlists:", error);
      toast.error("Failed to load watchlists");
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlistStocks = async (watchlistId: number) => {
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/stocks`, {
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch watchlist stocks");
      }

      const data = await response.json();
      setWatchlistStocks(data.stocks);
    } catch (error) {
      console.error("Error fetching watchlist stocks:", error);
      toast.error("Failed to load stocks");
    }
  };

  const fetchStockQuotes = async (tickers: string[]) => {
    try {
      const response = await fetch("/api/stock-quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tickers }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stock quotes");
      }

      const data = await response.json();
      const quotesMap: Record<string, StockQuote> = {};
      data.quotes.forEach((quote: StockQuote) => {
        quotesMap[quote.ticker] = quote;
      });
      setStockQuotes(quotesMap);
    } catch (error) {
      console.error("Error fetching stock quotes:", error);
      toast.error("Failed to load stock prices");
    }
  };

  const createWatchlist = async () => {
    if (!newWatchlistName.trim()) {
      toast.error("Please enter a watchlist name");
      return;
    }

    try {
      const response = await fetch("/api/watchlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({
          name: newWatchlistName,
          description: newWatchlistDescription || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create watchlist" }));
        throw new Error(errorData.message || "Failed to create watchlist");
      }

      const newWatchlist = await response.json();
      
      // Update state and close dialog
      setWatchlists(prev => [...prev, newWatchlist]);
      setSelectedWatchlist(newWatchlist);
      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setCreateDialogOpen(false);
      
      toast.success("Watchlist created successfully");
      
      // Refresh watchlists to ensure sync
      await fetchWatchlists();
    } catch (error: any) {
      console.error("Error creating watchlist:", error);
      toast.error(error.message || "Failed to create watchlist");
    }
  };

  const deleteWatchlist = async (watchlistId: number) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) {
      return;
    }

    try {
      const response = await fetch(`/api/watchlists/${watchlistId}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete watchlist");
      }

      setWatchlists(watchlists.filter(w => w.id !== watchlistId));
      if (selectedWatchlist?.id === watchlistId) {
        setSelectedWatchlist(watchlists[0] || null);
      }
      toast.success("Watchlist deleted successfully");
    } catch (error) {
      console.error("Error deleting watchlist:", error);
      toast.error("Failed to delete watchlist");
    }
  };

  const addStock = async () => {
    if (!selectedWatchlist) {
      toast.error("Please select a watchlist");
      return;
    }

    if (!newStockTicker.trim()) {
      toast.error("Please enter a ticker symbol");
      return;
    }

    try {
      const ticker = newStockTicker.toUpperCase();
      const response = await fetch(`/api/watchlists/${selectedWatchlist.id}/stocks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({ ticker }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add stock" }));
        throw new Error(errorData.message || "Failed to add stock");
      }

      const newStock = await response.json();
      
      // Update state and close dialog
      setWatchlistStocks(prev => [...prev, newStock]);
      setNewStockTicker("");
      setAddStockDialogOpen(false);
      
      toast.success(`${ticker} added to watchlist`);
      
      // Refresh stocks and quotes to ensure sync
      await fetchWatchlistStocks(selectedWatchlist.id);
    } catch (error: any) {
      console.error("Error adding stock:", error);
      toast.error(error.message || "Failed to add stock");
    }
  };

  const removeStock = async (ticker: string) => {
    if (!selectedWatchlist) return;

    try {
      const response = await fetch(`/api/watchlists/${selectedWatchlist.id}/stocks/${ticker}`, {
        method: "DELETE",
        headers: {
          "X-User-Id": userId.toString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove stock");
      }

      setWatchlistStocks(watchlistStocks.filter(s => s.ticker !== ticker));
      toast.success(`${ticker} removed from watchlist`);
    } catch (error) {
      console.error("Error removing stock:", error);
      toast.error("Failed to remove stock");
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading watchlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">My Watchlists</h1>
          <p className="text-muted-foreground mt-2">
            Track your favorite stocks and monitor their performance
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Watchlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Watchlist</DialogTitle>
              <DialogDescription>
                Create a new watchlist to organize and track stocks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Tech Stocks"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="My favorite technology companies"
                  value={newWatchlistDescription}
                  onChange={(e) => setNewWatchlistDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createWatchlist}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {watchlists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">You don't have any watchlists yet</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Watchlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Watchlist Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {watchlists.map((watchlist) => (
              <Card
                key={watchlist.id}
                className={`cursor-pointer transition-colors ${
                  selectedWatchlist?.id === watchlist.id
                    ? "border-primary bg-accent"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedWatchlist(watchlist)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{watchlist.name}</CardTitle>
                      {watchlist.description && (
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {watchlist.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWatchlist(watchlist.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Watchlist Content */}
          <div className="lg:col-span-3">
            {selectedWatchlist ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedWatchlist.name}</CardTitle>
                      {selectedWatchlist.description && (
                        <CardDescription className="mt-1">
                          {selectedWatchlist.description}
                        </CardDescription>
                      )}
                    </div>

                    <Dialog open={addStockDialogOpen} onOpenChange={setAddStockDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Stock
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Stock to Watchlist</DialogTitle>
                          <DialogDescription>
                            Enter a ticker symbol to add to your watchlist
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="ticker">Ticker Symbol</Label>
                            <Input
                              id="ticker"
                              placeholder="AAPL"
                              value={newStockTicker}
                              onChange={(e) => setNewStockTicker(e.target.value.toUpperCase())}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  addStock();
                                }
                              }}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddStockDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addStock}>Add Stock</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {watchlistStocks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No stocks in this watchlist yet</p>
                      <Button onClick={() => setAddStockDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Stock
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {watchlistStocks.map((stock) => {
                        const quote = stockQuotes[stock.ticker];
                        const isExpanded = expandedStock === stock.ticker;
                        return (
                          <div key={stock.id} className="rounded-lg border bg-card">
                            <div
                              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                              onClick={() => setExpandedStock(isExpanded ? null : stock.ticker)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">{stock.ticker}</h3>
                                  {quote && (
                                    <>
                                      <span className="text-2xl font-bold">
                                        ${quote.price.toFixed(2)}
                                      </span>
                                      <div
                                        className={`flex items-center gap-1 ${
                                          quote.change >= 0 ? "text-green-600" : "text-red-600"
                                        }`}
                                      >
                                        {quote.change >= 0 ? (
                                          <TrendingUp className="h-4 w-4" />
                                        ) : (
                                          <TrendingDown className="h-4 w-4" />
                                        )}
                                        <span className="font-medium">
                                          {quote.change >= 0 ? "+" : ""}
                                          {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Added {new Date(stock.addedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeStock(stock.ticker);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="p-4 border-t space-y-6">
                                <SentimentTrendChart ticker={stock.ticker} />
                                <div className="border-t pt-6">
                                  <StockNews ticker={stock.ticker} maxArticles={5} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <p className="text-muted-foreground">Select a watchlist to view stocks</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
