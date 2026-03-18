import { lazy, Suspense, Component } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { MetaPixelProvider } from "@/components/MetaPixelProvider";
import { BrandProvider } from "@/contexts/BrandContext";

// Auto-reload on chunk load failure (stale cache after deploy)
function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() =>
    factory().catch((error) => {
      const key = "chunk_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        // Force hard reload by adding cache-busting param
        const url = new URL(window.location.href);
        url.searchParams.set("_r", Date.now().toString());
        window.location.href = url.toString();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(key);
      throw error;
    })
  );
}

// Fallback UI when any error occurs during rendering
class ChunkErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || "Unknown error";
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
          <p className="text-lg font-medium">Terjadi kesalahan saat memuat halaman.</p>
          <p className="max-w-md text-sm text-gray-500 break-all">{msg}</p>
          <button
            onClick={() => {
              sessionStorage.removeItem("chunk_reload");
              // Hard reload bypassing cache
              const url = new URL(window.location.href);
              url.searchParams.delete("_r");
              window.location.href = url.toString();
            }}
            className="rounded-lg bg-orange-500 px-6 py-2 text-white hover:bg-orange-600"
          >
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load all pages
const Login = lazyWithRetry(() => import("./pages/Login"));
const AdminSetup = lazyWithRetry(() => import("./pages/AdminSetup"));
const ParentDashboard = lazyWithRetry(() => import("./pages/ParentDashboard"));
const ParentChildren = lazyWithRetry(() => import("./pages/ParentChildren"));
const ParentInput = lazyWithRetry(() => import("./pages/ParentInput"));
const BabysitterToday = lazyWithRetry(() => import("./pages/BabysitterToday"));
const BabysitterDashboard = lazyWithRetry(() => import("./pages/BabysitterDashboard"));
const BabysitterHistory = lazyWithRetry(() => import("./pages/BabysitterHistory"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const AdminUsers = lazyWithRetry(() => import("./pages/AdminUsers"));
const AdminChildren = lazyWithRetry(() => import("./pages/AdminChildren"));
const AdminChildDetail = lazyWithRetry(() => import("./pages/AdminChildDetail"));
const AdminLogs = lazyWithRetry(() => import("./pages/AdminLogs"));
const AdminSettings = lazyWithRetry(() => import("./pages/AdminSettings"));
const SelectRole = lazyWithRetry(() => import("./pages/SelectRole"));
const CompleteProfile = lazyWithRetry(() => import("./pages/CompleteProfile"));
const ChooseRole = lazyWithRetry(() => import("./pages/ChooseRole"));
const Chat = lazyWithRetry(() => import("./pages/Chat"));
const Insights = lazyWithRetry(() => import("./pages/Insights"));
const LocationPage = lazyWithRetry(() => import("./pages/LocationPage"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const OnboardingChildren = lazyWithRetry(() => import("./pages/OnboardingChildren"));
const OnboardingInvite = lazyWithRetry(() => import("./pages/OnboardingInvite"));
const ProfilePage = lazyWithRetry(() => import("./pages/ProfilePage"));
const SubscriptionStatus = lazyWithRetry(() => import("./pages/SubscriptionStatus"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const CompletePhone = lazyWithRetry(() => import("./pages/CompletePhone"));
const InventoryPage = lazyWithRetry(() => import("./pages/InventoryPage"));
const NotificationsPage = lazyWithRetry(() => import("./pages/NotificationsPage"));
const ViewerDashboard = lazyWithRetry(() => import("./pages/ViewerDashboard"));
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30s before refetch
      gcTime: 5 * 60_000,      // 5 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <MetaPixelProvider>
          <BrandProvider>
          <BrowserRouter>
          <ChunkErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<RootRedirect />} />
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
              <Route path="/babysitter/dashboard" element={<ProtectedRoute allowedRole="babysitter"><SubscriptionGuard><BabysitterDashboard /></SubscriptionGuard></ProtectedRoute>} />
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
          </ChunkErrorBoundary>
          </BrowserRouter>
          </BrandProvider>
          </MetaPixelProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
