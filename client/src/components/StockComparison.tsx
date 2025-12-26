import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, ChevronDown, Download } from "lucide-react";
import { exportFilteredStocksAsCSV, exportComparisonAsCSV, exportDetailedReport } from "@/lib/csvExport";
import WatchlistManager from "./WatchlistManager";
import PriceAlertManager from "./PriceAlertManager";

interface Stock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  target: string;
  upside: string;
  upsideMin: number;
  upsideMax: number;
  thesis: string;
  pe: number;
  growth: string;
}

const stocks: Stock[] = [
  {
    ticker: "TSM",
    name: "Taiwan Semiconductor",
    sector: "Semiconductors",
    price: 298,
    target: "320-360",
    upside: "7-21%",
    upsideMin: 7,
    upsideMax: 21,
    thesis: "Foundry leader, 2nm capacity sold out, earnings growth likely to exceed 20%",
    pe: 20.66,
    growth: "+20%"
  },
  {
    ticker: "NVDA",
    name: "NVIDIA",
    sector: "Semiconductors",
    price: 188,
    target: "220-280",
    upside: "17-49%",
    upsideMin: 17,
    upsideMax: 49,
    thesis: "AI chip leader, $275B backlog, China market opening, 63% revenue growth",
    pe: 32,
    growth: "+63%"
  },
  {
    ticker: "AVGO",
    name: "Broadcom",
    sector: "Semiconductors",
    price: 340,
    target: "380-450",
    upside: "12-32%",
    upsideMin: 12,
    upsideMax: 32,
    thesis: "$73B AI backlog, 47% revenue growth, networking exposure",
    pe: 28,
    growth: "+47%"
  },
  {
    ticker: "ASML",
    name: "ASML",
    sector: "Semiconductors",
    price: 1065,
    target: "1150-1350",
    upside: "8-27%",
    upsideMin: 8,
    upsideMax: 27,
    thesis: "Equipment supplier to TSMC, beneficiary of chip capex cycle",
    pe: 35.95,
    growth: "+5%"
  },
  {
    ticker: "UNH",
    name: "UnitedHealth",
    sector: "Healthcare",
    price: 220,
    target: "280-350",
    upside: "27-59%",
    upsideMin: 27,
    upsideMax: 59,
    thesis: "Margin recovery, 35% decline priced in negatives, sector rotation",
    pe: 18,
    growth: "+15%"
  },
  {
    ticker: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    price: 1071,
    target: "1150-1350",
    upside: "7-26%",
    upsideMin: 7,
    upsideMax: 26,
    thesis: "GLP-1 growth, aging population, dividend aristocrat",
    pe: 19.8,
    growth: "+18%"
  },
  {
    ticker: "ISRG",
    name: "Intuitive Surgical",
    sector: "Healthcare",
    price: 577,
    target: "600-700",
    upside: "4-21%",
    upsideMin: 4,
    upsideMax: 21,
    thesis: "Robotic surgery leader, secular growth, AI integration",
    pe: 73.9,
    growth: "+25%"
  },
  {
    ticker: "JPM",
    name: "JPMorgan",
    sector: "Financials",
    price: 317,
    target: "340-380",
    upside: "7-20%",
    upsideMin: 7,
    upsideMax: 20,
    thesis: "IB recovery, capital markets strength, pristine credit",
    pe: 12,
    growth: "+6%"
  },
  {
    ticker: "BAC",
    name: "Bank of America",
    sector: "Financials",
    price: 55,
    target: "58-68",
    upside: "5-24%",
    upsideMin: 5,
    upsideMax: 24,
    thesis: "Trading revenue growth, IB recovery, resilient consumer",
    pe: 10.5,
    growth: "+5%"
  }
];

export default function StockComparison() {
  const [selectedSectors, setSelectedSectors] = useState<string[]>([
    "Semiconductors",
    "Healthcare",
    "Financials"
  ]);
  const [peRange, setPeRange] = useState<number[]>([10, 75]);
  const [upsideRange, setUpsideRange] = useState<number[]>([0, 65]);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"upside" | "pe" | "price">("upside");

  // Filter stocks based on criteria
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const sectorMatch = selectedSectors.includes(stock.sector);
      const peMatch = stock.pe >= (peRange[0] || 0) && stock.pe <= (peRange[1] || 100);
      const upsideMatch =
        stock.upsideMin >= (upsideRange[0] || 0) && stock.upsideMax <= (upsideRange[1] || 65);

      return sectorMatch && peMatch && upsideMatch;
    });
  }, [selectedSectors, peRange, upsideRange]);

  // Sort filtered stocks
  const sortedStocks = useMemo(() => {
    const sorted = [...filteredStocks];
    if (sortBy === "upside") {
      sorted.sort((a, b) => b.upsideMax - a.upsideMax);
    } else if (sortBy === "pe") {
      sorted.sort((a, b) => a.pe - b.pe);
    } else if (sortBy === "price") {
      sorted.sort((a, b) => a.price - b.price);
    }
    return sorted;
  }, [filteredStocks, sortBy]);

  // Get selected stock details for comparison
  const comparisonStocks = sortedStocks.filter((s) =>
    selectedStocks.includes(s.ticker)
  );

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const toggleStockSelection = (ticker: string) => {
    setSelectedStocks((prev) =>
      prev.includes(ticker)
        ? prev.filter((t) => t !== ticker)
        : [...prev, ticker]
    );
  };

  const clearFilters = () => {
    setSelectedSectors(["Semiconductors", "Healthcare", "Financials"]);
    setPeRange([10, 75] as [number, number]);
    setUpsideRange([0, 65] as [number, number]);
    setSelectedStocks([]);
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "Semiconductors":
        return "from-blue-500 to-cyan-500";
      case "Healthcare":
        return "from-emerald-500 to-teal-500";
      case "Financials":
        return "from-amber-500 to-orange-500";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  return (
    <div className="space-y-8">
      {/* Filter Panel */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-6">Filter & Compare</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Sector Filter */}
          <div>
            <Label className="text-white font-semibold mb-4 block">
              Sectors
            </Label>
            <div className="space-y-3">
              {["Semiconductors", "Healthcare", "Financials"].map((sector) => (
                <div key={sector} className="flex items-center space-x-3">
                  <Checkbox
                    id={sector}
                    checked={selectedSectors.includes(sector)}
                    onCheckedChange={() => toggleSector(sector)}
                    className="border-slate-600"
                  />
                  <label
                    htmlFor={sector}
                    className="text-slate-300 cursor-pointer text-sm"
                  >
                    {sector}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sort Option */}
          <div>
            <Label className="text-white font-semibold mb-4 block">
              Sort By
            </Label>
            <div className="space-y-3">
              {[
                { value: "upside", label: "Upside Potential (High to Low)" },
                { value: "pe", label: "P/E Ratio (Low to High)" },
                { value: "price", label: "Price (Low to High)" }
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={value}
                    name="sort"
                    value={value}
                    checked={sortBy === value}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600"
                  />
                  <label
                    htmlFor={value}
                    className="text-slate-300 cursor-pointer text-sm"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* P/E Ratio Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white font-semibold">
              P/E Ratio Range
            </Label>
            <span className="text-sm text-slate-400">
              {peRange[0].toFixed(1)} - {peRange[1].toFixed(1)}x
            </span>
          </div>
          <Slider
            value={peRange}
            onValueChange={setPeRange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Upside Potential Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white font-semibold">
              Upside Potential Range
            </Label>
            <span className="text-sm text-slate-400">
              {upsideRange[0]}% - {upsideRange[1]}%
            </span>
          </div>
          <Slider
            value={upsideRange}
            onValueChange={setUpsideRange}
            min={0}
            max={65}
            step={1}
            className="w-full"
          />
        </div>

        {/* Clear Filters Button */}
        <Button
          onClick={clearFilters}
          variant="outline"
          className="w-full bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
        >
          Clear All Filters
        </Button>
      </Card>

      {/* Watchlist Manager */}
      {selectedStocks.length > 0 && (
        <WatchlistManager
          selectedStocks={selectedStocks}
          onLoadWatchlist={(stocks) => {
            setSelectedStocks(stocks);
          }}
        />
      )}

      {/* Results Count & Export Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-slate-300">
          Showing <span className="font-bold text-emerald-400">{sortedStocks.length}</span> of{" "}
          <span className="font-bold text-emerald-400">{stocks.length}</span> stocks
          {selectedStocks.length > 0 && (
            <span className="ml-4">
              • <span className="font-bold text-blue-400">{selectedStocks.length}</span> selected for comparison
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => exportFilteredStocksAsCSV(sortedStocks)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            size="sm"
          >
            <Download size={16} />
            Export Filtered List
          </Button>
          {selectedStocks.length > 0 && (
            <Button
              onClick={() => exportComparisonAsCSV(comparisonStocks)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              size="sm"
            >
              <Download size={16} />
              Export Comparison
            </Button>
          )}
        </div>
      </div>

      {/* Stock List with Selection */}
      <div className="grid grid-cols-1 gap-4">
        {sortedStocks.length > 0 ? (
          sortedStocks.map((stock) => (
            <Card
              key={stock.ticker}
              className={`bg-slate-800 border-slate-700 hover:border-slate-600 transition-all cursor-pointer ${
                selectedStocks.includes(stock.ticker)
                  ? "ring-2 ring-emerald-500 border-emerald-500"
                  : ""
              }`}
              onClick={() => toggleStockSelection(stock.ticker)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedStocks.includes(stock.ticker)}
                      onChange={() => toggleStockSelection(stock.ticker)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-emerald-600 bg-slate-700 border-slate-600 rounded cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {stock.ticker}
                        </h3>
                        <span
                          className={`px-3 py-1 bg-gradient-to-r ${getSectorColor(
                            stock.sector
                          )} text-white text-xs font-semibold rounded-full`}
                        >
                          {stock.sector}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      ${stock.price}
                    </div>
                    <div className="text-xs text-slate-400">Current Price</div>
                  </div>
                </div>

                <p className="text-slate-300 text-sm mb-4">{stock.thesis}</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-slate-700/50 p-3 rounded">
                    <div className="text-xs text-slate-400 mb-1">Target</div>
                    <div className="text-sm font-semibold text-white">
                      ${stock.target}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded">
                    <div className="text-xs text-slate-400 mb-1">Upside</div>
                    <div className="text-sm font-semibold text-emerald-400">
                      {stock.upside}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded">
                    <div className="text-xs text-slate-400 mb-1">P/E</div>
                    <div className="text-sm font-semibold text-white">
                      {stock.pe}x
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded">
                    <div className="text-xs text-slate-400 mb-1">Growth</div>
                    <div className="text-sm font-semibold text-blue-400">
                      {stock.growth}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded">
                    <div className="text-xs text-slate-400 mb-1">Min Upside</div>
                    <div className="text-sm font-semibold text-cyan-400">
                      {stock.upsideMin}%
                    </div>
                  </div>
                </div>

                {/* Price Alert Manager */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <PriceAlertManager ticker={stock.ticker} currentPrice={stock.price} />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <p className="text-slate-400 mb-4">
              No stocks match your filter criteria.
            </p>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
            >
              Reset Filters
            </Button>
          </Card>
        )}
      </div>

      {/* Comparison Table */}
      {selectedStocks.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">
              Comparison: {selectedStocks.length} Stock{selectedStocks.length !== 1 ? "s" : ""}
            </h3>
            <Button
              onClick={() => setSelectedStocks([])}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              Clear Selection
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                    Ticker
                  </th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                    Sector
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    Price
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    P/E Ratio
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    Upside
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    Growth
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonStocks.map((stock) => (
                  <tr
                    key={stock.ticker}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-white">
                      {stock.ticker}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 bg-gradient-to-r ${getSectorColor(
                          stock.sector
                        )} text-white text-xs font-semibold rounded`}
                      >
                        {stock.sector}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-white font-semibold">
                      ${stock.price}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-300">
                      {stock.pe}x
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-emerald-400">
                      {stock.upside}
                    </td>
                    <td className="py-4 px-4 text-right text-blue-400">
                      {stock.growth}
                    </td>
                    <td className="py-4 px-4 text-right text-white font-semibold">
                      ${stock.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Watchlist Manager for Comparison */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <WatchlistManager
              selectedStocks={comparisonStocks.map((s) => s.ticker)}
              onLoadWatchlist={(stocks) => {
                setSelectedStocks(stocks);
              }}
            />
          </div>

          {/* Export & Comparison Insights */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Quick Insights</h4>
              <Button
                onClick={() => exportDetailedReport(sortedStocks, comparisonStocks)}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                size="sm"
              >
                <Download size={16} />
                Export Full Report
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 p-4 rounded">
                <p className="text-slate-400 text-xs mb-2">Avg P/E Ratio</p>
                <p className="text-white text-lg font-bold">
                  {(
                    comparisonStocks.reduce((sum, s) => sum + s.pe, 0) /
                    comparisonStocks.length
                  ).toFixed(1)}
                  x
                </p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded">
                <p className="text-slate-400 text-xs mb-2">Avg Upside</p>
                <p className="text-emerald-400 text-lg font-bold">
                  {(
                    comparisonStocks.reduce((sum, s) => sum + s.upsideMax, 0) /
                    comparisonStocks.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded">
                <p className="text-slate-400 text-xs mb-2">Avg Price</p>
                <p className="text-white text-lg font-bold">
                  $
                  {(
                    comparisonStocks.reduce((sum, s) => sum + s.price, 0) /
                    comparisonStocks.length
                  ).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
