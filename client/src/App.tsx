import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PriceProvider } from "./contexts/PriceContext";
import Home from "./pages/Home";
import Watchlists from "./pages/Watchlists";
import Alerts from "./pages/Alerts";
import Performance from "./pages/Performance";
import StockDetail from "./pages/StockDetail";
import StockComparison from "./pages/StockComparison";
import Backtesting from "./pages/Backtesting";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/watchlists"} component={Watchlists} />
      <Route path={"/alerts"} component={Alerts} />
      <Route path={"/performance"} component={Performance} />
      <Route path={"/stock/:ticker"} component={StockDetail} />
       <Route path="/compare" component={StockComparison} />
      <Route path="/backtest" component={Backtesting} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <PriceProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </PriceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
