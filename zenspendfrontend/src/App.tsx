import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layouts
import AppLayout from './components/layout/AppLayout';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import NotFound from './pages/NotFound';

// Protected Pages
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/transactions/TransactionsPage';
import BudgetsPage from './pages/budgets/BudgetsPage';
import AccountsPage from './pages/accounts/AccountsPage';
import GoalsPage from './pages/goals/GoalsPage';
import ProfilePage from './pages/profile/ProfilePage';

// Theme Provider
import { ThemeProvider } from './hooks/useTheme';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
          
          <Route element={<AppLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
          
          {/* Protected Routes */}
          <Route element={<AppLayout requireAuth hideFooter />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          {/* Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;