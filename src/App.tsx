import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

// Lazy load all pages
const Login = lazy(() => import("./pages/Login"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const ParentChildren = lazy(() => import("./pages/ParentChildren"));
const ParentInput = lazy(() => import("./pages/ParentInput"));
const BabysitterToday = lazy(() => import("./pages/BabysitterToday"));
const BabysitterHistory = lazy(() => import("./pages/BabysitterHistory"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminChildren = lazy(() => import("./pages/AdminChildren"));
const AdminChildDetail = lazy(() => import("./pages/AdminChildDetail"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const SelectRole = lazy(() => import("./pages/SelectRole"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const ChooseRole = lazy(() => import("./pages/ChooseRole"));
const Chat = lazy(() => import("./pages/Chat"));
const Insights = lazy(() => import("./pages/Insights"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const OnboardingChildren = lazy(() => import("./pages/OnboardingChildren"));
const OnboardingInvite = lazy(() => import("./pages/OnboardingInvite"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SubscriptionStatus = lazy(() => import("./pages/SubscriptionStatus"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CompletePhone = lazy(() => import("./pages/CompletePhone"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ViewerDashboard = lazy(() => import("./pages/ViewerDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Memuat...</div>
  </div>
);

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'parent' | 'babysitter' | 'admin' | 'viewer' }) {
  const { user, loading, activeRole } = useAuth();
  if (loading) return <PageLoader />;
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

  const redirectMap: Record<string, string> = { parent: '/parent/dashboard', babysitter: '/babysitter/today', admin: '/admin/dashboard', viewer: '/viewer/dashboard' };
  return <Navigate to={redirectMap[effectiveRole || user.role!]} replace />;
}

function RootRedirect() {
  const { user, loading, activeRole } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.phoneComplete) return <Navigate to="/complete-phone" replace />;
  if (!user.role) return <Navigate to="/select-role" replace />;
  
  const roles = user.roles || [];
  if (roles.length > 1 && !activeRole) return <Navigate to="/choose-role" replace />;
  
  const effectiveRole = roles.length > 1 ? activeRole : user.role;
  const redirectMap: Record<string, string> = { parent: '/parent/dashboard', babysitter: '/babysitter/today', admin: '/admin/dashboard', viewer: '/viewer/dashboard' };
  return <Navigate to={redirectMap[effectiveRole || user.role!]} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              <Route path="/chat" element={<Chat />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/location" element={<LocationPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/viewer/dashboard" element={<ProtectedRoute allowedRole="viewer"><ViewerDashboard /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/children" element={<ProtectedRoute allowedRole="admin"><AdminChildren /></ProtectedRoute>} />
              <Route path="/admin/children/:childId" element={<ProtectedRoute allowedRole="admin"><AdminChildDetail /></ProtectedRoute>} />
              <Route path="/admin/logs" element={<ProtectedRoute allowedRole="admin"><AdminLogs /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
