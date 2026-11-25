import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Download,
  Home,
  Lock,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AFOMI_LOGO_URL } from '../data/seedData';
import { AppRoute, EscrowStatus } from '../types/afomi';
import { AdminPinModal } from './AdminPinModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { isInstallable: Boolean(deferredPrompt), isInstalled, install };
}

export const AfomiLogo: React.FC<{
  onTap?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}> = ({ onTap, size = 'sm', showWordmark = true }) => {
  const { adminSettings } = useAfomi();
  const imgClass =
    size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-10 h-10' : 'w-9 h-9';

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="AFOMI Logo"
      className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#6A1B9A] rounded-xl"
    >
      <img
        src={adminSettings.logoUrl || AFOMI_LOGO_URL}
        alt="AFOMI Logo"
        className={`${imgClass} rounded-xl object-contain bg-white`}
      />
      {showWordmark && (
        <span className="text-xl font-extrabold tracking-tight text-[#6A1B9A]">
          {adminSettings.appName || 'AFOMI'}
        </span>
      )}
    </button>
  );
};

export const AfomiImage: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}> = ({ src, alt, className = 'w-full h-full object-cover', fallbackLabel }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3EBF9] via-[#FAF8FC] to-[#FFF8E1] text-[#6A1B9A] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <ShoppingBag className="w-8 h-8 mb-1.5 opacity-80" />
        <span className="text-xs font-medium text-center text-[#4A148C] line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const EscrowStatusBadge: React.FC<{ status: EscrowStatus | string }> = ({ status }) => {
  const normalized = status.toUpperCase();
  if (
    normalized === 'RELEASED' ||
    normalized === 'APPROVED' ||
    normalized === 'COMPLETED' ||
    normalized === 'DELIVERED_RELEASED'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{status}</span>
      </span>
    );
  }
  if (
    normalized === 'REFUNDED' ||
    normalized === 'REJECTED' ||
    normalized === 'FAILED' ||
    normalized === 'DISPUTED' ||
    normalized === 'CANCELLED'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>{status}</span>
      </span>
    );
  }
  if (normalized === 'PENDING REVIEW' || normalized === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
        <Lock className="w-3.5 h-3.5" />
        <span>{status}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6A1B9A] bg-[#F5EEFA] border border-[#6A1B9A]/20 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
      <Lock className="w-3.5 h-3.5" />
      <span>{status}</span>
    </span>
  );
};

export const FundsLockedTag: React.FC<{ label?: string }> = ({ label = 'Funds Locked' }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6A1B9A] bg-[#F5EEFA] border border-[#6A1B9A]/20 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
    <Lock className="w-3 h-3" />
    <span>{label}</span>
  </span>
);

export const PiValue: React.FC<{
  amount: number;
  showNaira?: boolean;
  className?: string;
}> = ({ amount, showNaira = false, className = '' }) => {
  const { nairaRate } = useAfomi();
  return (
    <span className={`tabular-nums ${className}`}>
      {amount.toFixed(2)} Pi
      {showNaira && (
        <span className="text-xs font-normal text-[#645E72] ml-1.5">
          (₦{Math.round(amount * nairaRate).toLocaleString()})
        </span>
      )}
    </span>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode; onOpenCart?: () => void }> = ({
  children,
  onOpenCart,
}) => {
  const {
    route,
    navigate,
    user,
    isCeo,
    isAdminUnlocked,
    adminSettings,
    cart,
    notifications,
    markAllNotificationsRead,
    toast,
  } = useAfomi();
  const [notifOpen, setNotifOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Hidden 7-tap detector on AFOMI Header Logo (within 4 seconds)
  const tapTimestampsRef = useRef<number[]>([]);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHeaderLogoTap = () => {
    const now = Date.now();
    const recent = tapTimestampsRef.current.filter((t) => now - t <= 4000);
    recent.push(now);
    tapTimestampsRef.current = recent;

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      tapTimestampsRef.current = [];
    }, 4000);

    if (recent.length >= 7) {
      tapTimestampsRef.current = [];
      if (isAdminUnlocked) {
        navigate('admin-dashboard');
      } else {
        setPinModalOpen(true);
      }
      return;
    }

    if (user) navigate('home');
    else navigate('splash');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const navItems: { id: AppRoute; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: Briefcase },
    { id: 'market', label: 'Market', icon: ShoppingBag },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isAuthFlow = route === 'splash' || route === 'auth' || route === 'kyc';

  if (isAuthFlow) {
    return (
      <div className="min-h-screen bg-white text-[#1A1625]">
        {toast && (
          <div className="fixed top-4 right-4 z-50 max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-sm font-medium flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                toast.tone === 'error'
                  ? 'bg-rose-600'
                  : toast.tone === 'info'
                  ? 'bg-[#FFC107]'
                  : 'bg-emerald-600'
              }`}
            />
            <span>{toast.text}</span>
          </div>
        )}
        <AdminPinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)} />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FC] text-[#1A1625] pb-20 md:pb-10 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed top-16 md:top-20 right-4 z-50 max-w-sm rounded-xl border border-[#E7E3EE] bg-white px-4 py-3 shadow-lg text-sm font-medium flex items-center gap-2.5"
        >
          <ShieldCheck
            className={`w-4 h-4 shrink-0 ${
              toast.tone === 'error'
                ? 'text-rose-600'
                : toast.tone === 'info'
                ? 'text-[#6A1B9A]'
                : 'text-emerald-600'
            }`}
          />
          <span className="text-[#1A1625]">{toast.text}</span>
        </div>
      )}

      <AdminPinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)} />

      {/* Top Navigation Bar — Clean 3-Zone Contract with Clickable Logo */}
      <header className="sticky top-0 z-40 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-[#E7E3EE]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Clickable AFOMI Logo (with silent 7-tap Admin trigger) */}
          <AfomiLogo onTap={handleHeaderLogoTap} />

          {/* Zone 2: Desktop Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#645E72]">
            {navItems.map((item) => {
              const active =
                route === item.id ||
                (item.id === 'wallet' && route === 'escrow') ||
                (item.id === 'tasks' && route === 'post-task');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'text-[#6A1B9A] border-[#6A1B9A] font-semibold'
                      : 'border-transparent hover:text-[#1A1625]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {(isCeo || isAdminUnlocked) && (
              <button
                type="button"
                onClick={() => navigate(isAdminUnlocked ? 'admin-dashboard' : 'ceo')}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
                  route === 'ceo' || route === 'admin-dashboard'
                    ? 'text-[#6A1B9A] border-[#FFC107] font-semibold'
                    : 'text-[#6A1B9A] border-transparent hover:border-[#FFC107]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FFC107]" />
                <span>{isAdminUnlocked ? 'Admin' : 'CEO AI'}</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Right Utility Icons + Single Primary Action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onOpenCart) onOpenCart();
                else navigate('market');
              }}
              aria-label="Open shopping cart"
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#1A1625] hover:bg-[#FAF8FC] transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#6A1B9A] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  if (!notifOpen && unreadCount > 0) markAllNotificationsRead();
                }}
                aria-label="Notifications"
                className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#1A1625] hover:bg-[#FAF8FC] transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC107] text-[#2B1F00] text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E7E3EE] shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E3EE]">
                    <span className="text-sm font-bold text-[#1A1625]">Notifications</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg hover:bg-[#FAF8FC] text-[#645E72] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#F1EEF6]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#645E72]">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-[#FAF8FC] transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#1A1625]">{n.title}</span>
                            <span className="text-[11px] text-[#645E72] whitespace-nowrap">{n.time}</span>
                          </div>
                          <p className="text-xs text-[#645E72] mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(isCeo ? 'ceo' : 'post-task')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 min-h-[40px] rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {isCeo ? 'Open CEO AI' : 'Post a Task'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 md:pt-8 flex-1">
        {adminSettings.maintenanceMode && !isAdminUnlocked ? (
          <div className="max-w-lg mx-auto my-12 rounded-3xl bg-white border border-[#E7E3EE] p-8 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-[#6A1B9A] mx-auto" />
            <h1 className="text-2xl font-extrabold text-[#1A1625]">AFOMI Scheduled Maintenance</h1>
            <p className="text-sm text-[#645E72]">
              We are upgrading AFOMI Escrow services on Pi Testnet. Locked funds remain 100% safe and we will be right
              back online shortly.
            </p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* App Footer with Logo, Legal Links, Help & PWA Install */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 mt-12 pt-6 pb-4 border-t border-[#E7E3EE] text-xs text-[#645E72] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AfomiLogo onTap={() => navigate('home')} size="sm" />
          <span>· Pi Testnet Mode · support@afomi.app</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('help')}
            className="hover:text-[#6A1B9A] font-medium cursor-pointer"
          >
            Help &amp; FAQ
          </button>
          <button
            type="button"
            onClick={() => navigate('privacy')}
            className="hover:text-[#6A1B9A] font-medium cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => navigate('terms')}
            className="hover:text-[#6A1B9A] font-medium cursor-pointer"
          >
            Terms of Service
          </button>
          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6A1B9A] text-white font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation — 6 Destinations */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E3EE] pb-safe"
      >
        <div className="grid grid-cols-6 items-center h-[60px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              route === item.id ||
              (item.id === 'wallet' && route === 'escrow') ||
              (item.id === 'tasks' && route === 'post-task');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors cursor-pointer ${
                  active ? 'text-[#6A1B9A]' : 'text-[#645E72]'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span
                  className={`text-[10px] mt-0.5 tracking-tight whitespace-nowrap ${
                    active ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label === 'Subscriptions' ? 'Subs' : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
