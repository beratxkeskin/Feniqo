import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Recurring from './pages/Recurring';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import Debts from './pages/Debts';
import Subscriptions from './pages/Subscriptions';



const NavigationRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/dashboard');

  // Handle routing based on URL Hash (SaaS-friendly Vercel navigation)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Theme application logic on startup and profile settings change
  useEffect(() => {
    if (user) {
      const theme = user.theme;
      const appliedTheme = localStorage.getItem('moneymate_applied_theme');
      
      if (
        appliedTheme === 'dark' || 
        theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default applied theme for login screen
      const appliedTheme = localStorage.getItem('moneymate_applied_theme');
      if (appliedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [user]);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  if (loading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Not authenticated? Render the login / signup flow
  if (!user) {
    return <Login />;
  }

  // Render correct page view inside the main layout sarmal
  const renderPage = () => {
    switch (currentHash) {
      case '#/dashboard':
        return <Dashboard />;
      case '#/transactions':
        return <Transactions />;
      case '#/budgets':
        return <Budgets />;
      case '#/categories':
        return <Categories />;
      case '#/recurring':
        return <Recurring />;
      case '#/subscriptions':
        return <Subscriptions />;
      case '#/goals':
        return <Goals />;
      case '#/debts':
        return <Debts />;
      case '#/reports':
        return <Reports />;
      case '#/settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DataProvider>
      <Layout currentHash={currentHash} onNavigate={navigateTo}>
        {renderPage()}
      </Layout>
    </DataProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationRouter />
    </AuthProvider>
  );
}
