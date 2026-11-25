import React, { useEffect, useState } from 'react';
import { AfomiProvider, useAfomi } from './context/AfomiContext';
import { AppShell } from './components/AfomiUI';
import { AuthScreen, KycScreen, SplashScreen } from './screens/OnboardingAuthScreens';
import { HomeScreen } from './screens/HomeScreen';
import { PostTaskPage, TasksPage } from './screens/TasksScreens';
import { MarketplaceScreen } from './screens/MarketplaceScreen';
import { LearnPage, SellerShopPage, SubscriptionsPage } from './screens/SubscriptionsShopLearnScreens';
import { AdminPanelPage, EscrowWalletPage, ProfilePage, WalletPage } from './screens/WalletProfileAdminScreens';
import { CeoDashboardScreen } from './screens/CeoDashboardScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { HelpSupportPage, PrivacyPolicyPage, TermsPage } from './screens/LegalSupportScreens';

const AfomiRouter: React.FC = () => {
  const { route, navigate } = useAfomi();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    if (route !== 'tasks' && selectedTaskId) setSelectedTaskId(null);
    if (route !== 'market' && selectedProductId) setSelectedProductId(null);
  }, [route, selectedTaskId, selectedProductId]);

  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname.toLowerCase();
      if (p === '/privacy') navigate('privacy');
      else if (p === '/terms') navigate('terms');
      else if (p === '/help') navigate('help');
      else navigate('home');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigate]);

  const handleOpenCart = () => {
    navigate('market');
    setCartDrawerOpen(true);
  };

  const renderScreen = () => {
    switch (route) {
      case 'splash':
        return <SplashScreen />;
      case 'auth':
        return <AuthScreen />;
      case 'kyc':
        return <KycScreen />;
      case 'home':
        return (
          <HomeScreen
            onSelectTask={(taskId) => {
              setSelectedTaskId(taskId);
              navigate('tasks');
            }}
            onSelectProduct={(productId) => {
              setSelectedProductId(productId);
              navigate('market');
            }}
          />
        );
      case 'tasks':
        return <TasksPage initialTaskId={selectedTaskId} />;
      case 'post-task':
        return <PostTaskPage />;
      case 'market':
        return (
          <MarketplaceScreen
            initialProductId={selectedProductId}
            cartDrawerOpen={cartDrawerOpen}
            onCloseCartDrawer={() => setCartDrawerOpen(false)}
          />
        );
      case 'subscriptions':
        return <SubscriptionsPage />;
      case 'shop':
        return <SellerShopPage />;
      case 'escrow':
        return <EscrowWalletPage />;
      case 'learn':
        return <LearnPage />;
      case 'wallet':
        return <WalletPage />;
      case 'profile':
        return <ProfilePage />;
      case 'ceo':
        return <CeoDashboardScreen />;
      case 'admin':
        return <AdminPanelPage />;
      case 'admin-dashboard':
        return <AdminDashboardScreen />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsPage />;
      case 'help':
        return <HelpSupportPage />;
      default:
        return <HomeScreen />;
    }
  };

  return <AppShell onOpenCart={handleOpenCart}>{renderScreen()}</AppShell>;
};

export default function App() {
  return (
    <AfomiProvider>
      <AfomiRouter />
    </AfomiProvider>
  );
}
