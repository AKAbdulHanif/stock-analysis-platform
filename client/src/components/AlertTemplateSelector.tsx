import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, ChevronRight, CheckCircle } from "lucide-react";
import {
  ALERT_TEMPLATES,
  getTemplatesByCategory,
  getCategories,
  formatTemplatePreview,
  applyTemplateToStock,
  getRecommendedTemplates,
  type AlertTemplate
} from "@/lib/alertTemplates";

interface AlertTemplateSelectorProps {
  ticker: string;
  currentPrice: number;
  pe?: number;
  upside?: number;
  sector?: string;
  onTemplateApplied?: (templateId: string, alertCount: number) => void;
}

export default function AlertTemplateSelector({
  ticker,
  currentPrice,
  pe = 20,
  upside = 30,
  sector = "Technology",
  onTemplateApplied
}: AlertTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [appliedTemplates, setAppliedTemplates] = useState<Set<string>>(new Set());
  const categories = getCategories();
  const recommended = getRecommendedTemplates(pe, upside, sector);

  const handleApplyTemplate = (templateId: string) => {
    const alerts = applyTemplateToStock(ticker, currentPrice, templateId);
    setAppliedTemplates((prev) => new Set(Array.from(prev).concat(templateId)));
    onTemplateApplied?.(templateId, alerts.length);
  };

  const getDisplayTemplates = () => {
    if (selectedCategory) {
      return getTemplatesByCategory(selectedCategory as any);
    }
    return ALERT_TEMPLATES;
  };

  const displayTemplates = getDisplayTemplates();
  const isRecommended = (templateId: string) => recommended.some((t) => t.id === templateId);
  const isApplied = (templateId: string) => Array.from(appliedTemplates).includes(templateId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2">
          <Zap size={18} />
          Quick Apply Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Alert Templates for {ticker}</DialogTitle>
          <p className="text-slate-400 text-sm mt-2">
            Current Price: <span className="font-bold text-white">${currentPrice.toFixed(2)}</span>
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recommended Templates Section */}
          {recommended.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                Recommended for This Stock
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommended.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-4 transition-colors ${
                      isApplied(template.id)
                        ? "bg-emerald-600/10 border-emerald-600/30"
                        : "bg-gradient-to-br from-amber-600/20 to-amber-600/10 border-amber-600/30 hover:border-amber-500/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-semibold">{template.name}</h4>
                        <p className="text-slate-400 text-sm">{template.description}</p>
                      </div>
                      {isApplied(template.id) && <CheckCircle size={20} className="text-emerald-400" />}
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded mb-3 text-slate-300 text-xs whitespace-pre-wrap">
                      {formatTemplatePreview(template, currentPrice)}
                    </div>
                    <Button
                      onClick={() => handleApplyTemplate(template.id)}
                      disabled={isApplied(template.id)}
                      className={`w-full text-sm ${
                        isApplied(template.id)
                          ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                      }`}
                      size="sm"
                    >
                      {isApplied(template.id) ? "Applied" : "Apply Template"}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div>
            <h3 className="text-white font-semibold mb-3">Browse by Category</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                onClick={() => setSelectedCategory(null)}
                className={`text-sm ${
                  selectedCategory === null
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                size="sm"
              >
                All Templates
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-sm ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                  size="sm"
                >
                  {category
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Template Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayTemplates.map((template) => (
              <Card
                key={template.id}
                className={`border transition-all ${
                  isRecommended(template.id)
                    ? "bg-slate-700/50 border-amber-600/30"
                    : "bg-slate-700 border-slate-600"
                } p-4 hover:border-slate-500`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">{template.name}</h4>
                      {isRecommended(template.id) && (
                        <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{template.description}</p>
                  </div>
                  {isApplied(template.id) && <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />}
                </div>

                <div className="bg-slate-600/50 p-3 rounded mb-3 text-slate-300 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {formatTemplatePreview(template, currentPrice)}
                </div>

                <Button
                  onClick={() => handleApplyTemplate(template.id)}
                  disabled={isApplied(template.id)}
                  className={`w-full text-sm flex items-center justify-center gap-2 ${
                    isApplied(template.id)
                      ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  size="sm"
                >
                  {isApplied(template.id) ? (
                    <>
                      <CheckCircle size={16} />
                      Applied
                    </>
                  ) : (
                    <>
                      <ChevronRight size={16} />
                      Apply
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <Card className="bg-blue-600/10 border-blue-600/30 p-4">
            <p className="text-blue-300 text-sm">
              <span className="font-semibold">💡 Tip:</span> Templates create multiple alerts at strategic price
              levels. You can customize individual alerts after applying a template. Applied templates are saved to
              your stock automatically.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
