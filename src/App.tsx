import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import Login from "./pages/Login";
import AdminSetup from "./pages/AdminSetup";
import ParentDashboard from "./pages/ParentDashboard";
import ParentChildren from "./pages/ParentChildren";
import ParentInput from "./pages/ParentInput";
import BabysitterToday from "./pages/BabysitterToday";
import BabysitterHistory from "./pages/BabysitterHistory";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminChildren from "./pages/AdminChildren";
import AdminChildDetail from "./pages/AdminChildDetail";
import AdminLogs from "./pages/AdminLogs";
import AdminSettings from "./pages/AdminSettings";
import SelectRole from "./pages/SelectRole";
import CompleteProfile from "./pages/CompleteProfile";
import ChooseRole from "./pages/ChooseRole";
import Chat from "./pages/Chat";
import Insights from "./pages/Insights";
import LocationPage from "./pages/LocationPage";
import Pricing from "./pages/Pricing";
import OnboardingChildren from "./pages/OnboardingChildren";
import OnboardingInvite from "./pages/OnboardingInvite";
import ProfilePage from "./pages/ProfilePage";
import SubscriptionStatus from "./pages/SubscriptionStatus";
import ResetPassword from "./pages/ResetPassword";
import CompletePhone from "./pages/CompletePhone";
import InventoryPage from "./pages/InventoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'parent' | 'babysitter' | 'admin' }) {
  const { user, loading, activeRole } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Memuat...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.phoneComplete) return <Navigate to="/complete-phone" replace />;
  if (!user.role) return <Navigate to="/select-role" replace />;

  const roles = user.roles || [];
  const hasMultipleRoles = roles.length > 1;

  if (hasMultipleRoles && !activeRole) return <Navigate to="/choose-role" replace />;

  const effectiveRole = hasMultipleRoles ? activeRole : user.role;

  if (effectiveRole === allowedRole) return <>{children}</>;

  if (effectiveRole === 'babysitter' && !user.profileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  const redirectMap = { parent: '/parent/dashboard', babysitter: '/babysitter/today', admin: '/admin/dashboard' };
  return <Navigate to={redirectMap[effectiveRole || user.role!]} replace />;
}

function RootRedirect() {
  const { user, loading, activeRole } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Memuat...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.phoneComplete) return <Navigate to="/complete-phone" replace />;
  if (!user.role) return <Navigate to="/select-role" replace />;
  
  const roles = user.roles || [];
  if (roles.length > 1 && !activeRole) return <Navigate to="/choose-role" replace />;
  
  const effectiveRole = roles.length > 1 ? activeRole : user.role;
  const redirectMap = { parent: '/parent/dashboard', babysitter: '/babysitter/today', admin: '/admin/dashboard' };
  return <Navigate to={redirectMap[effectiveRole || user.role!]} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/complete-phone" element={<CompletePhone />} />
            <Route path="/choose-role" element={<ChooseRole />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/onboarding/children" element={<OnboardingChildren />} />
            <Route path="/onboarding/invite" element={<OnboardingInvite />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/subscription-status" element={<SubscriptionStatus />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/parent/dashboard" element={<ProtectedRoute allowedRole="parent"><SubscriptionGuard><ParentDashboard /></SubscriptionGuard></ProtectedRoute>} />
            <Route path="/parent/children" element={<ProtectedRoute allowedRole="parent"><SubscriptionGuard><ParentChildren /></SubscriptionGuard></ProtectedRoute>} />
            <Route path="/parent/input" element={<ProtectedRoute allowedRole="parent"><SubscriptionGuard><ParentInput /></SubscriptionGuard></ProtectedRoute>} />
            <Route path="/babysitter/today" element={<ProtectedRoute allowedRole="babysitter"><SubscriptionGuard><BabysitterToday /></SubscriptionGuard></ProtectedRoute>} />
            <Route path="/babysitter/history" element={<ProtectedRoute allowedRole="babysitter"><SubscriptionGuard><BabysitterHistory /></SubscriptionGuard></ProtectedRoute>} />
            <Route path="/chat" element={<>{}<Chat /></>} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/children" element={<ProtectedRoute allowedRole="admin"><AdminChildren /></ProtectedRoute>} />
            <Route path="/admin/children/:childId" element={<ProtectedRoute allowedRole="admin"><AdminChildDetail /></ProtectedRoute>} />
            <Route path="/admin/logs" element={<ProtectedRoute allowedRole="admin"><AdminLogs /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
