import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TripPlanProvider } from "@/contexts/TripPlanContext";
import Auth from "./pages/Auth";
import HomePage from "./pages/HomePage";
import SearchResults from "./pages/SearchResults";
import ParkDetails from "./pages/ParkDetails";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();


const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? element : <Navigate to="/auth" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
    <Route path="/search" element={<ProtectedRoute element={<SearchResults />} />} />
    <Route path="/park/:id" element={<ProtectedRoute element={<ParkDetails />} />} />
    <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
    {}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TripPlanProvider>
            <AppRoutes />
          </TripPlanProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
