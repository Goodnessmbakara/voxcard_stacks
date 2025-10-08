import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
// import Dashboard from "./pages/Dashboard";
// import Plans from "./pages/Plans";
// import PlanDetail from "./pages/PlanDetail";
// import CreatePlan from "./pages/CreatePlan";
// import NotFound from "./pages/NotFound";
// import About from './pages/About';
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";


const App = () => {
  return (
      <TooltipProvider>
        <Toaster />
        {/* <Sonner /> */}
        <BrowserRouter>
			<div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
				<Header />
				<main className="container mx-auto px-4 py-8 flex-1 w-full">
						{/* <AnimatePresence mode="wait"> */}
						<Routes>
							<Route path="/" element={<Home />} />
							{/* <Route path="/dashboard" element={<Dashboard />} />
							<Route path="/create-group" element={<CreatePlan />} />
							<Route path="/about" element={<About />} />
							<Route path="*" element={<NotFound />} />
							<Route path="/groups" element={<Plans />} />
							<Route path="/groups/:planId" element={<PlanDetail />} /> */}
						</Routes>
						{/* </AnimatePresence> */}
				</main>
				<Footer />
			</div>
        </BrowserRouter>
      </TooltipProvider>
  );
};

export default App;
