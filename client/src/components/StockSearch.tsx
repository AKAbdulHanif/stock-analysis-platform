import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { QuickAddToWatchlist } from './QuickAddToWatchlist';
import { AdvancedSearchFilters, SearchFilters } from './AdvancedSearchFilters';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';

interface Security {
  ticker: string;
  name: string;
  sector: string;
}

export function StockSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Security[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<SearchFilters>({ marketCap: 'all', sectors: [] });
  
  // Subscribe to real-time prices for search results
  const resultTickers = results.map(r => r.ticker);
  const { prices, isConnected } = useRealtimePrices(resultTickers, { enabled: isOpen && results.length > 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchStocks = async () => {
      if (query.length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      try {
        // Build query params with filters
        const params = new URLSearchParams({ q: query, limit: '8' });
        if (filters.marketCap && filters.marketCap !== 'all') {
          params.append('marketCap', filters.marketCap);
        }
        if (filters.peRatioMin !== undefined) {
          params.append('peMin', filters.peRatioMin.toString());
        }
        if (filters.peRatioMax !== undefined) {
          params.append('peMax', filters.peRatioMax.toString());
        }
        if (filters.dividendYieldMin !== undefined && filters.dividendYieldMin > 0) {
          params.append('divYield', filters.dividendYieldMin.toString());
        }
        if (filters.sectors && filters.sectors.length > 0) {
          params.append('sectors', filters.sectors.join(','));
        }

        const response = await fetch(`/api/stock-search?${params}`);
        const data = await response.json();
        setResults(data);
        setIsOpen(data.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
    };

    const debounce = setTimeout(searchStocks, 200);
    return () => clearTimeout(debounce);
  }, [query, filters]);

  const handleSelect = (ticker: string) => {
    setLocation(`/stock/${ticker}`);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(results[selectedIndex].ticker);
        } else if (results.length > 0) {
          handleSelect(results[0].ticker);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="stock-search-input" className="sr-only">
            Search stocks and ETFs
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="stock-search-input"
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="stock-search-results"
            aria-activedescendant={selectedIndex >= 0 ? `stock-result-${selectedIndex}` : undefined}
            aria-autocomplete="list"
            placeholder="Search stocks & ETFs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && results.length > 0 && setIsOpen(true)}
            className="pl-9 bg-background/50 backdrop-blur-sm border-border/50"
          />
        </div>
        <AdvancedSearchFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {isOpen && results.length > 0 && (
        <div 
          id="stock-search-results"
          role="listbox"
          aria-label="Stock search results"
          className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
        >
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((security, index) => (
              <div
                key={security.ticker}
                id={`stock-result-${index}`}
                role="option"
                aria-selected={selectedIndex === index}
                className={cn(
                  "w-full px-4 py-3 flex items-start gap-3 hover:bg-accent/50 transition-colors",
                  selectedIndex === index && "bg-accent/50"
                )}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <button
                  onClick={() => handleSelect(security.ticker)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{security.ticker}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {security.sector.startsWith('ETF') ? 'ETF' : 'Stock'}
                    </span>
                    {isConnected && prices.get(security.ticker) && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{security.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground/70">{security.sector}</p>
                    {prices.get(security.ticker) && (
                      <>
                        <span className="text-xs font-semibold text-foreground">
                          ${prices.get(security.ticker)!.price.toFixed(2)}
                        </span>
                        <span className={cn(
                          "text-xs font-medium",
                          prices.get(security.ticker)!.changePercent >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {prices.get(security.ticker)!.changePercent >= 0 ? '+' : ''}
                          {prices.get(security.ticker)!.changePercent.toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                </button>
                <QuickAddToWatchlist ticker={security.ticker} name={security.name} variant="icon" size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
