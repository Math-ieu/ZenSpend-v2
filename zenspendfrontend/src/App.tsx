
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layouts
import AppLayout from './components/layout/AppLayout';
import PrivateRoute from './components/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import SSOCallback from './pages/auth/SSOCallback';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import TermsPage from './pages/legal/TermsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import CookiesPage from './pages/legal/CookiesPage';
import NotFound from './pages/NotFound';

// Protected Pages 
import Dashboard from './pages/Dashboard';
import SegmentDashboardRedirect from './pages/dashboard/SegmentDashboardRedirect';
import TransactionsPage from './pages/transactions/TransactionsPage';
import NewTransactionPage from './pages/transactions/NewTransactionPage';
import ImportPage from './pages/transactions/ImportPage';
import BudgetsPage from './pages/budgets/BudgetsPage';
import NewBudgetPage from './pages/budgets/NewBudgetPage';
import AccountsPage from './pages/accounts/AccountsPage';
import NewAccountPage from './pages/accounts/NewAccountPage';
import GoalsPage from './pages/goals/GoalsPage';
import NewGoalPage from './pages/goals/NewGoalPage';
import ProfilePage from './pages/profile/ProfilePage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import DebtPage from './pages/debts/DebtPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ThemeProvider } from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login/:segmentSlug" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signup/:segmentSlug" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forgot-password/:segmentSlug" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/reset-password/:segmentSlug" element={<ResetPassword />} />
                <Route path="/auth/sso/callback" element={<SSOCallback />} />
                <Route path="/legal/conditions" element={<TermsPage />} />
                <Route path="/legal/confidentialite" element={<PrivacyPage />} />
                <Route path="/legal/cookies" element={<CookiesPage />} />
              </Route>

              {/* Protected Routes */}
              <Route element={
                <PrivateRoute>
                  <AppLayout requireAuth />
                </PrivateRoute>
              }>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/dashboard" element={<SegmentDashboardRedirect />} />
                <Route path="/dashboard/:segmentSlug" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/transactions/new" element={<NewTransactionPage />} />
                <Route path="/transactions/import" element={<ImportPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/budgets/new" element={<NewBudgetPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/accounts/new" element={<NewAccountPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/goals/new" element={<NewGoalPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/dettes" element={<DebtPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Not Found Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </SubscriptionProvider>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;