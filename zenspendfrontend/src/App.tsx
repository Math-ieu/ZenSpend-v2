
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layouts
import AppLayout from './components/layout/AppLayout';
import PrivateRoute from './components/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import NotFound from './pages/NotFound';

// Protected Pages
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/transactions/TransactionsPage';
import NewTransactionPage from './pages/transactions/NewTransactionPage';
import BudgetsPage from './pages/budgets/BudgetsPage';
import NewBudgetPage from './pages/budgets/NewBudgetPage';
import AccountsPage from './pages/accounts/AccountsPage';
import NewAccountPage from './pages/accounts/NewAccountPage';
import GoalsPage from './pages/goals/GoalsPage';
import NewGoalPage from './pages/goals/NewGoalPage';
import ProfilePage from './pages/profile/ProfilePage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ThemeProvider } from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>
              
              {/* Protected Routes */}
              <Route element={
                <PrivateRoute>
                  <AppLayout requireAuth hideFooter />
                </PrivateRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/transactions/new" element={<NewTransactionPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/budgets/new" element={<NewBudgetPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/accounts/new" element={<NewAccountPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/goals/new" element={<NewGoalPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
              </Route>
              
              {/* Not Found Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </SubscriptionProvider>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;