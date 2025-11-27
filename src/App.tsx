import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Media from "./pages/Media";
import Playlists from "./pages/Playlists";
import Screens from "./pages/Screens";
import Preview from "./pages/Preview";
import Player from "./pages/Player";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Logs from "./pages/Logs";
// Feature flag para Billing
const BILLING_ENABLED = import.meta.env.VITE_ENABLE_BILLING === "true";
let BillingLazy: React.ComponentType | null = null;
if (BILLING_ENABLED) {
  BillingLazy = lazy(() => import("./pages/Billing"));
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/media" element={<Media />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/screens" element={<Screens />} />
          <Route path="/preview/:id" element={<Preview />} />
          <Route path="/player/:playerKey" element={<Player />} />
          <Route path="/p/:playerKey" element={<Player />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/logs" element={<Logs />} />
          {BILLING_ENABLED && BillingLazy && (
            <Route
              path="/billing"
              element={
                <Suspense fallback={<div />}> 
                  <BillingLazy />
                </Suspense>
              }
            />
          )}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
