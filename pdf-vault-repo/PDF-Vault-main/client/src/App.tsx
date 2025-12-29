import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { WalletDebug } from "@/components/WalletDebug";
import Home from "@/pages/Home";
import RegisterCV from "@/pages/RegisterCV";
import Success from "@/pages/Success";
import Verify from "@/pages/Verify";
import ProofView from "@/pages/ProofView";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

const suiQueryClient = new QueryClient();

const networks = {
  devnet: { url: getFullnodeUrl("devnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={RegisterCV} />
      <Route path="/success/:proofCode" component={Success} />
      <Route path="/verify" component={Verify} />
      <Route path="/profile" component={Profile} />
      <Route path="/p/:proofCode" component={ProofView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <TooltipProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <Router />
              </main>
            </div>
            <WalletDebug />
            <Toaster />
          </TooltipProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
