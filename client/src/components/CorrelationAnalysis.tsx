import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Network, TrendingUp, AlertCircle } from "lucide-react";
import {
  generateCorrelationMatrix,
  calculateTemplateCorrelations,
  getPortfolioRecommendations,
  getCorrelationInterpretation,
  type TemplateCorrelation,
  type PortfolioRecommendation
} from "@/lib/correlationAnalysis";

export default function CorrelationAnalysis() {
  const [correlationMatrix, setCorrelationMatrix] = useState(generateCorrelationMatrix());
  const [templateCorrelations, setTemplateCorrelations] = useState<TemplateCorrelation[]>([]);
  const [portfolioRecommendations, setPortfolioRecommendations] = useState<PortfolioRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<"heatmap" | "pairs" | "portfolio">("heatmap");

  const handleAnalyze = () => {
    setCorrelationMatrix(generateCorrelationMatrix());
    setTemplateCorrelations(calculateTemplateCorrelations());
    setPortfolioRecommendations(getPortfolioRecommendations(3));
  };

  const getHeatmapColor = (correlation: number): string => {
    if (correlation < -0.5) return "bg-blue-900"; // Strong negative
    if (correlation < -0.2) return "bg-blue-700";
    if (correlation < 0.2) return "bg-slate-600";
    if (correlation < 0.5) return "bg-orange-700";
    if (correlation < 0.8) return "bg-red-700";
    return "bg-red-900"; // Strong positive
  };

  const getRecommendationColor = (recommendation: string): string => {
    switch (recommendation) {
      case "excellent":
        return "bg-emerald-600/20 border-emerald-600/50 text-emerald-400";
      case "good":
        return "bg-blue-600/20 border-blue-600/50 text-blue-400";
      case "neutral":
        return "bg-slate-600/20 border-slate-600/50 text-slate-400";
      case "avoid":
        return "bg-red-600/20 border-red-600/50 text-red-400";
      default:
        return "bg-slate-600/20 border-slate-600/50 text-slate-400";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2">
          <Network size={18} />
          Correlation Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Strategy Correlation Analysis</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button
            onClick={handleAnalyze}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Analyze Correlations
          </Button>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-700">
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === "heatmap"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Correlation Heatmap
            </button>
            <button
              onClick={() => setActiveTab("pairs")}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === "pairs"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Pairwise Analysis
            </button>
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === "portfolio"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Portfolio Recommendations
            </button>
          </div>

          {/* Heatmap Tab */}
          {activeTab === "heatmap" && (
            <div className="space-y-4">
              <Card className="bg-slate-700 border-slate-600 p-4">
                <h4 className="text-white font-semibold mb-4">Correlation Matrix</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Shows how returns move together. Negative = opposite directions (good diversification), Positive = similar directions (redundant).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-slate-400 py-2 px-2 bg-slate-600">Template</th>
                        {correlationMatrix.templates.map((template) => (
                          <th
                            key={template}
                            className="text-center text-slate-400 py-2 px-1 bg-slate-600"
                            title={template}
                          >
                            {template.substring(0, 8)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationMatrix.templates.map((template1, i) => (
                        <tr key={template1}>
                          <td className="text-left text-slate-300 py-2 px-2 font-semibold bg-slate-700 sticky left-0 z-10 max-w-xs truncate" title={template1}>
                            {template1.substring(0, 12)}
                          </td>
                          {correlationMatrix.correlations[i].map((correlation, j) => (
                            <td
                              key={`${i}-${j}`}
                              className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapColor(correlation)}`}
                              title={`${template1} vs ${correlationMatrix.templates[j]}: ${correlation.toFixed(2)}`}
                            >
                              {correlation.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-900"></div>
                    <span className="text-slate-400">Strong Negative (-1 to -0.5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-600"></div>
                    <span className="text-slate-400">Independent (-0.2 to 0.2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-900"></div>
                    <span className="text-slate-400">Strong Positive (0.5 to 1)</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Pairwise Analysis Tab */}
          {activeTab === "pairs" && (
            <div className="space-y-3">
              {templateCorrelations.length === 0 ? (
                <Card className="bg-blue-600/10 border-blue-600/30 p-4">
                  <p className="text-blue-300 text-sm">
                    Click "Analyze Correlations" to see pairwise template relationships.
                  </p>
                </Card>
              ) : (
                templateCorrelations.map((pair, idx) => (
                  <Card
                    key={idx}
                    className={`border p-3 ${getRecommendationColor(pair.recommendation)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {pair.template1} ↔ {pair.template2}
                        </p>
                        <p className="text-xs opacity-75 mt-1">
                          {getCorrelationInterpretation(pair.correlation)}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          pair.recommendation === "excellent"
                            ? "bg-emerald-600 text-white"
                            : pair.recommendation === "good"
                              ? "bg-blue-600 text-white"
                              : pair.recommendation === "avoid"
                                ? "bg-red-600 text-white"
                                : "bg-slate-600 text-white"
                        }`}
                      >
                        {pair.recommendation.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>
                        <p className="opacity-75">Correlation</p>
                        <p className="font-semibold">{pair.correlation.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="opacity-75">Diversification Benefit</p>
                        <p className="font-semibold">{pair.diversificationBenefit.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="opacity-75">Combined Win Rate</p>
                        <p className="font-semibold">{pair.combinedWinRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="opacity-75">Combined Avg Return</p>
                        <p className={`font-semibold ${pair.combinedAvgReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {pair.combinedAvgReturn.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Portfolio Recommendations Tab */}
          {activeTab === "portfolio" && (
            <div className="space-y-3">
              {portfolioRecommendations.length === 0 ? (
                <Card className="bg-blue-600/10 border-blue-600/30 p-4">
                  <p className="text-blue-300 text-sm">
                    Click "Analyze Correlations" to see optimal portfolio combinations.
                  </p>
                </Card>
              ) : (
                portfolioRecommendations.map((portfolio, idx) => (
                  <Card key={idx} className="bg-slate-700 border-slate-600 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="text-emerald-400" size={18} />
                          <h4 className="text-white font-semibold">Portfolio {idx + 1}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {portfolio.templates.map((template) => (
                            <Badge key={template} className="bg-indigo-600 text-white text-xs">
                              {template}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-3 italic">{portfolio.rationale}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-600/50 p-2 rounded">
                        <p className="text-slate-400">Expected Win Rate</p>
                        <p className="text-emerald-400 font-semibold">{portfolio.expectedWinRate.toFixed(1)}%</p>
                      </div>
                      <div className="bg-slate-600/50 p-2 rounded">
                        <p className="text-slate-400">Avg Return</p>
                        <p
                          className={`font-semibold ${
                            portfolio.expectedAvgReturn >= 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {portfolio.expectedAvgReturn.toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-slate-600/50 p-2 rounded">
                        <p className="text-slate-400">Diversification</p>
                        <p className="text-blue-400 font-semibold">{portfolio.diversificationScore.toFixed(0)}/100</p>
                      </div>
                      <div className="bg-slate-600/50 p-2 rounded">
                        <p className="text-slate-400">Risk Reduction</p>
                        <p className="text-purple-400 font-semibold">{portfolio.riskReduction.toFixed(1)}%</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Legend and Info */}
          <Card className="bg-slate-700 border-slate-600 p-3">
            <div className="flex gap-2 text-xs text-slate-300">
              <AlertCircle size={16} className="flex-shrink-0 text-blue-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Understanding Correlation Analysis:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Negative correlation:</strong> Strategies move opposite - excellent for diversification</li>
                  <li><strong>Low correlation:</strong> Strategies are independent - good diversification</li>
                  <li><strong>High correlation:</strong> Strategies move together - redundant, avoid combining</li>
                  <li><strong>Diversification benefit:</strong> Volatility reduction from combining strategies</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
