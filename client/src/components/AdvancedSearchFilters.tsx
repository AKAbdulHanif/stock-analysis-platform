import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { SECTORS } from '../../../shared/stockUniverse';

export interface SearchFilters {
  marketCap?: 'small' | 'mid' | 'large' | 'all';
  peRatioMin?: number;
  peRatioMax?: number;
  dividendYieldMin?: number;
  sectors?: string[];
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export function AdvancedSearchFilters({ filters, onFiltersChange }: AdvancedSearchFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const clearedFilters: SearchFilters = {
      marketCap: 'all',
      peRatioMin: undefined,
      peRatioMax: undefined,
      dividendYieldMin: undefined,
      sectors: [],
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toggleSector = (sector: string) => {
    const currentSectors = localFilters.sectors || [];
    const newSectors = currentSectors.includes(sector)
      ? currentSectors.filter(s => s !== sector)
      : [...currentSectors, sector];
    setLocalFilters({ ...localFilters, sectors: newSectors });
  };

  const activeFilterCount = [
    filters.marketCap && filters.marketCap !== 'all',
    filters.peRatioMin !== undefined || filters.peRatioMax !== undefined,
    filters.dividendYieldMin !== undefined,
    filters.sectors && filters.sectors.length > 0,
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-blue-600 text-white px-2 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="bg-slate-900 border-slate-700 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white">Advanced Filters</SheetTitle>
          <SheetDescription className="text-slate-400">
            Refine your stock search with custom criteria
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Market Cap */}
          <div>
            <Label className="text-white mb-3 block">Market Capitalization</Label>
            <Select
              value={localFilters.marketCap || 'all'}
              onValueChange={(value) => setLocalFilters({ ...localFilters, marketCap: value as any })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="large">Large Cap (&gt;$10B)</SelectItem>
                <SelectItem value="mid">Mid Cap ($2B-$10B)</SelectItem>
                <SelectItem value="small">Small Cap (&lt;$2B)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* P/E Ratio */}
          <div>
            <Label className="text-white mb-3 block">P/E Ratio Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Min</Label>
                <input
                  type="number"
                  value={localFilters.peRatioMin || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, peRatioMin: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs mb-1 block">Max</Label>
                <input
                  type="number"
                  value={localFilters.peRatioMax || ''}
                  onChange={(e) => setLocalFilters({ ...localFilters, peRatioMax: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="100"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                />
              </div>
            </div>
          </div>

          {/* Dividend Yield */}
          <div>
            <Label className="text-white mb-3 block">
              Minimum Dividend Yield: {localFilters.dividendYieldMin || 0}%
            </Label>
            <Slider
              value={[localFilters.dividendYieldMin || 0]}
              onValueChange={([value]) => setLocalFilters({ ...localFilters, dividendYieldMin: value })}
              max={10}
              step={0.5}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Sectors */}
          <div>
            <Label className="text-white mb-3 block">Sectors</Label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((sector) => {
                const isSelected = (localFilters.sectors || []).includes(sector);
                return (
                  <Badge
                    key={sector}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                    }`}
                    onClick={() => toggleSector(sector)}
                  >
                    {sector}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="text-sm font-semibold text-white mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {filters.marketCap && filters.marketCap !== 'all' && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                  {filters.marketCap} cap
                </Badge>
              )}
              {(filters.peRatioMin !== undefined || filters.peRatioMax !== undefined) && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                  P/E: {filters.peRatioMin || 0}-{filters.peRatioMax || '∞'}
                </Badge>
              )}
              {filters.dividendYieldMin !== undefined && filters.dividendYieldMin > 0 && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                  Div Yield &gt; {filters.dividendYieldMin}%
                </Badge>
              )}
              {filters.sectors && filters.sectors.length > 0 && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                  {filters.sectors.length} sector{filters.sectors.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
