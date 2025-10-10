import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import CreatePlan from "./pages/CreatePlan";
import NotFound from "./pages/NotFound";
import About from './pages/About';
import { StacksWalletProvider } from "./context/StacksWalletProvider";
import { StacksContractProvider } from "./context/StacksContractProvider";
import {Header} from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import {
	TurnkeyProvider,
	TurnkeyProviderConfig,
  } from "@turnkey/react-wallet-kit";

  const turnkeyConfig: TurnkeyProviderConfig = {
	organizationId: import.meta.env.VITE_ORGANIZATION_ID!,
	authProxyConfigId: import.meta.env.VITE_AUTH_PROXY_CONFIG_ID!,
  };



const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {/* <StacksWalletProvider> */}
		  <TurnkeyProvider 
		  	config={turnkeyConfig}
			  callbacks={{
				onError: (error) => console.error("Turnkey error:", error),
			  }}
			>
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
              <Header />

              <main className="container mx-auto px-4 py-8 flex-1 w-full">
                {/* <StacksContractProvider> */}
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/groups/create" element={<CreatePlan />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/groups" element={<Plans />} />
                      <Route path="/groups/:planId" element={<PlanDetail />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AnimatePresence>
                {/* </StacksContractProvider> */}
              </main>

              <Footer />
            </div>
          {/* </StacksWalletProvider> */}
		</TurnkeyProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
