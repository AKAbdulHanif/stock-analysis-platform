import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

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
        const response = await fetch(`/api/stock-search?q=${encodeURIComponent(query)}&limit=8`);
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
  }, [query]);

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
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search stocks & ETFs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
          className="pl-9 bg-background/50 backdrop-blur-sm border-border/50"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((security, index) => (
              <button
                key={security.ticker}
                onClick={() => handleSelect(security.ticker)}
                className={cn(
                  "w-full px-4 py-3 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left",
                  selectedIndex === index && "bg-accent/50"
                )}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{security.ticker}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {security.sector.startsWith('ETF') ? 'ETF' : 'Stock'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{security.name}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{security.sector}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
