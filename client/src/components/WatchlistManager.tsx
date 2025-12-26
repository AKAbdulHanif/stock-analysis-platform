import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkPlus, Trash2, Copy, Download, Upload, ChevronDown } from "lucide-react";
import {
  getAllWatchlists,
  createWatchlist,
  deleteWatchlist,
  duplicateWatchlist,
  exportWatchlistAsJSON,
  importWatchlistFromJSON,
  getWatchlistStats
} from "@/lib/watchlistStorage";

interface Watchlist {
  id: string;
  name: string;
  description: string;
  stocks: string[];
  createdAt: string;
  updatedAt: string;
}

interface WatchlistManagerProps {
  selectedStocks: string[];
  onLoadWatchlist: (stocks: string[]) => void;
}

export default function WatchlistManager({ selectedStocks, onLoadWatchlist }: WatchlistManagerProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDesc, setNewWatchlistDesc] = useState("");
  const [expandedWatchlist, setExpandedWatchlist] = useState<string | null>(null);

  // Load watchlists on mount
  useEffect(() => {
    loadWatchlists();
  }, []);

  const loadWatchlists = () => {
    const lists = getAllWatchlists();
    setWatchlists(lists);
  };

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) {
      alert("Please enter a watchlist name");
      return;
    }

    createWatchlist(newWatchlistName, newWatchlistDesc, selectedStocks);
    setNewWatchlistName("");
    setNewWatchlistDesc("");
    setIsCreateDialogOpen(false);
    loadWatchlists();
  };

  const handleDeleteWatchlist = (id: string) => {
    if (confirm("Are you sure you want to delete this watchlist?")) {
      deleteWatchlist(id);
      loadWatchlists();
    }
  };

  const handleDuplicateWatchlist = (id: string) => {
    duplicateWatchlist(id);
    loadWatchlists();
  };

  const handleExportWatchlist = (id: string) => {
    const json = exportWatchlistAsJSON(id);
    if (!json) return;

    const watchlist = watchlists.find((w) => w.id === id);
    const filename = `watchlist-${watchlist?.name.replace(/\s+/g, "-").toLowerCase()}-${new Date()
      .toISOString()
      .split("T")[0]}.json`;

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportWatchlist = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const imported = importWatchlistFromJSON(json);
        if (imported) {
          loadWatchlists();
          alert(`Watchlist "${imported.name}" imported successfully!`);
        } else {
          alert("Failed to import watchlist. Invalid format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLoadWatchlist = (watchlist: Watchlist) => {
    onLoadWatchlist(watchlist.stocks);
    setIsViewDialogOpen(false);
  };

  const stats = selectedWatchlist ? getWatchlistStats(selectedWatchlist.id) : null;

  return (
    <div className="space-y-4">
      {/* Create Watchlist Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2">
            <BookmarkPlus size={18} />
            Save Selected Stocks as Watchlist
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="watchlist-name" className="text-slate-300 mb-2 block">
                Watchlist Name
              </Label>
              <Input
                id="watchlist-name"
                placeholder="e.g., Tech Semiconductors 2026"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
            <div>
              <Label htmlFor="watchlist-desc" className="text-slate-300 mb-2 block">
                Description (Optional)
              </Label>
              <Textarea
                id="watchlist-desc"
                placeholder="Add notes about this watchlist..."
                value={newWatchlistDesc}
                onChange={(e) => setNewWatchlistDesc(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                rows={3}
              />
            </div>
            <div className="bg-slate-700/50 p-3 rounded">
              <p className="text-slate-300 text-sm">
                <span className="font-semibold text-emerald-400">{selectedStocks.length}</span> stock
                {selectedStocks.length !== 1 ? "s" : ""} will be saved
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreateDialogOpen(false)}
                variant="outline"
                className="flex-1 bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWatchlist}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Create Watchlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Watchlists Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 flex items-center justify-center gap-2"
          >
            <ChevronDown size={18} />
            View Saved Watchlists ({watchlists.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Your Watchlists</DialogTitle>
          </DialogHeader>

          {watchlists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">No watchlists yet. Create one to get started!</p>
              <Button
                onClick={handleImportWatchlist}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 mx-auto"
              >
                <Upload size={16} />
                Import Watchlist
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlists.map((watchlist) => (
                <Card key={watchlist.id} className="bg-slate-700 border-slate-600 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-600/50 transition-colors"
                    onClick={() => setExpandedWatchlist(expandedWatchlist === watchlist.id ? null : watchlist.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{watchlist.name}</h4>
                        {watchlist.description && (
                          <p className="text-slate-400 text-sm mt-1">{watchlist.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>{watchlist.stocks.length} stocks</span>
                          <span>Updated: {new Date(watchlist.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-slate-400 transition-transform ${
                          expandedWatchlist === watchlist.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {expandedWatchlist === watchlist.id && (
                    <div className="border-t border-slate-600 p-4 space-y-3">
                      {/* Stocks List */}
                      <div>
                        <p className="text-slate-300 text-sm font-semibold mb-2">Stocks in this watchlist:</p>
                        <div className="flex flex-wrap gap-2">
                          {watchlist.stocks.length > 0 ? (
                            watchlist.stocks.map((ticker) => (
                              <span
                                key={ticker}
                                className="px-3 py-1 bg-slate-600 text-slate-200 text-xs rounded-full"
                              >
                                {ticker}
                              </span>
                            ))
                          ) : (
                            <p className="text-slate-500 text-sm">No stocks in this watchlist</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-slate-600">
                        <Button
                          onClick={() => handleLoadWatchlist(watchlist)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                          size="sm"
                        >
                          Load Watchlist
                        </Button>
                        <Button
                          onClick={() => handleDuplicateWatchlist(watchlist.id)}
                          variant="outline"
                          className="bg-slate-600 text-slate-300 border-slate-500 hover:bg-slate-500 text-sm"
                          size="sm"
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          onClick={() => handleExportWatchlist(watchlist.id)}
                          variant="outline"
                          className="bg-slate-600 text-slate-300 border-slate-500 hover:bg-slate-500 text-sm"
                          size="sm"
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteWatchlist(watchlist.id)}
                          variant="outline"
                          className="bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30 text-sm"
                          size="sm"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              {/* Import Button */}
              <Button
                onClick={handleImportWatchlist}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 mt-4"
              >
                <Upload size={16} />
                Import Watchlist from File
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
