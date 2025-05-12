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
            <Route path="/transactions" element={<div>Transactions Page</div>} />
            <Route path="/budgets" element={<div>Budgets Page</div>} />
            <Route path="/accounts" element={<div>Accounts Page</div>} />
            <Route path="/goals" element={<div>Savings Goals Page</div>} />
            <Route path="/profile" element={<div>Profile Page</div>} />
          </Route>
          
          {/* Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;