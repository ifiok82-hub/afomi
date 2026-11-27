import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AFOMI_LOGO_URL,
  GENERATED_IMAGES,
  INITIAL_ACTIVE_SUBSCRIPTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COURSES,
  INITIAL_ESCROW_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_PENDING_SUBMISSIONS,
  INITIAL_PRODUCTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_TASKS,
  INITIAL_USERS,
  INITIAL_WALLET_TRANSACTIONS,
  PI_TO_NAIRA_RATE,
} from '../data/seedData';
import {
  authenticateWithPiTestnet,
  checkServerIncompletePayments,
  executePiPayment,
  initPiTestnetSdk,
} from '../lib/piSdk';
import { sanitizeText, validatePiAmount, validateRequired, validateWorkersCount } from '../lib/validation';
import {
  ActiveSubscription,
  AdminSettings,
  AppRoute,
  AuditLogEntry,
  CartItem,
  CeoChatMessage,
  Course,
  EscrowTransaction,
  ListingReport,
  MarketOrder,
  NotificationItem,
  Product,
  ShopProfile,
  SubscriptionPlan,
  SupportTicket,
  Task,
  TaskSubmission,
  UserProfile,
  WalletTransaction,
} from '../types/afomi';

interface AfomiState {
  hasSeenSplash: boolean;
  user: UserProfile | null;
  route: AppRoute;
  availableBalance: number;
  lockedEscrowBalance: number;
  totalEarned: number;
  weeklyEarnings: number;
  afomiCommissionEarned: number;
  tasks: Task[];
  submissions: TaskSubmission[];
  products: Product[];
  cart: CartItem[];
  orders: MarketOrder[];
  subscriptionPlans: SubscriptionPlan[];
  activeSubscriptions: ActiveSubscription[];
  courses: Course[];
  completedCourseIds: string[];
  escrowTransactions: EscrowTransaction[];
  walletTransactions: WalletTransaction[];
  notifications: NotificationItem[];
  shop: ShopProfile;
  supportTickets: SupportTicket[];
  ceoChat: CeoChatMessage[];
  ceoBriefingVersion: number;
  adminUsers: UserProfile[];
  adminSettings: AdminSettings;
  auditLogs: AuditLogEntry[];
  reports: ListingReport[];
  adminPinUnlocked: boolean;
  piAuthLoading: boolean;
  paymentPhase: string | null;
  toast: { id: string; text: string; tone: 'success' | 'info' | 'error' } | null;
}

const STORAGE_KEY = 'afomi_marketplace_state_v2';

const safeMetaEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)
    : {};
const ENV_DEMO_MODE = safeMetaEnv.VITE_DEMO_MODE !== 'false';

const DEFAULT_USER: UserProfile = {
  id: 'usr-1',
  name: 'Amara Nwosu',
  email: 'amara@afomi.app',
  role: 'user',
  avatar: GENERATED_IMAGES.ceoAvatar,
  country: 'Nigeria',
  city: 'Lagos',
  phone: '+234 803 555 0192',
  skills: ['Yoruba Translation', 'Data Labeling', 'Mobile QA Testing'],
  kycVerified: true,
  rating: 4.9,
  joinedDate: '2026-09-12',
  piAuthenticated: false,
  piUsername: undefined,
  piUid: undefined,
  piWalletAddress: undefined,
};

const CEO_USER: UserProfile = {
  id: 'usr-ceo',
  name: 'Emeka Obi (CEO)',
  email: 'ceo@afomi.app',
  role: 'ceo',
  avatar: GENERATED_IMAGES.ceoAvatar,
  country: 'Nigeria',
  city: 'Lagos',
  phone: '+234 800 AFOMI 01',
  skills: ['Executive Strategy', 'Pi Escrow Economics', 'Pan-African Growth'],
  kycVerified: true,
  rating: 5.0,
  joinedDate: '2026-01-01',
  piAuthenticated: true,
  piUid: 'pi_tn_ceo_01',
  piUsername: '@afomi_ceo',
  piWalletAddress: 'GTESTCEOAFOMI001TESTNETWALLET',
};

const INITIAL_CEO_CHAT: CeoChatMessage[] = [
  {
    id: 'chat-1',
    sender: 'ai',
    text: 'Good morning, CEO. I am AFOMI CEO AI — your live executive analyst, accountant, and growth advisor. Tap any strategy prompt below or ask me anything about Escrow volume, commission margins, disputes, or user growth.',
    timestamp: '08:00',
  },
];

function getInitialRouteFromUrl(): AppRoute | null {
  if (typeof window === 'undefined') return null;
  const p = window.location.pathname.toLowerCase();
  if (p === '/privacy') return 'privacy';
  if (p === '/terms') return 'terms';
  if (p === '/help') return 'help';
  return null;
}

function createDefaultState(demoEnabled = ENV_DEMO_MODE): AfomiState {
  const urlRoute = getInitialRouteFromUrl();
  return {
    hasSeenSplash: Boolean(urlRoute),
    user: null,
    route: urlRoute || 'splash',
    availableBalance: demoEnabled ? 125.5 : 0,
    lockedEscrowBalance: demoEnabled ? 8.5 : 0,
    totalEarned: demoEnabled ? 184.2 : 0,
    weeklyEarnings: demoEnabled ? 12.5 : 0,
    afomiCommissionEarned: demoEnabled ? 450.4 : 0,
    tasks: demoEnabled ? INITIAL_TASKS : [],
    submissions: demoEnabled ? INITIAL_PENDING_SUBMISSIONS : [],
    products: demoEnabled ? INITIAL_PRODUCTS : [],
    cart: [],
    orders: demoEnabled ? INITIAL_ORDERS : [],
    subscriptionPlans: demoEnabled ? INITIAL_SUBSCRIPTIONS : [],
    activeSubscriptions: demoEnabled ? INITIAL_ACTIVE_SUBSCRIPTIONS : [],
    courses: INITIAL_COURSES,
    completedCourseIds: demoEnabled ? ['course-1'] : [],
    escrowTransactions: demoEnabled ? INITIAL_ESCROW_TRANSACTIONS : [],
    walletTransactions: demoEnabled ? INITIAL_WALLET_TRANSACTIONS : [],
    notifications: demoEnabled ? INITIAL_NOTIFICATIONS : [],
    shop: {
      name: demoEnabled ? 'Amara Craft & Digital Hub' : 'My AFOMI Shop',
      description: demoEnabled
        ? 'Verified Lagos merchant offering digital design packs and authentic Nigerian pantry staples.'
        : 'African merchant storefront protected by AFOMI Escrow.',
      location: 'Lagos, Nigeria',
      logo: AFOMI_LOGO_URL,
      created: demoEnabled,
    },
    supportTickets: demoEnabled ? INITIAL_SUPPORT_TICKETS : [],
    ceoChat: INITIAL_CEO_CHAT,
    ceoBriefingVersion: 1,
    adminUsers: INITIAL_USERS,
    adminSettings: {
      afomiFeePercent: 8,
      autoApproveHours: 48,
      appName: 'AFOMI',
      logoUrl: AFOMI_LOGO_URL,
      maintenanceMode: false,
      demoMode: demoEnabled,
    },
    auditLogs: INITIAL_AUDIT_LOGS,
    reports: [],
    adminPinUnlocked: false,
    piAuthLoading: false,
    paymentPhase: null,
    toast: null,
  };
}

interface PostTaskPayload {
  title: string;
  category: Task['category'];
  payPerWorker: number;
  totalWorkers: number;
  instructions: string[];
  exampleOutput: string;
  deadline: string;
  difficulty: Task['difficulty'];
  estimatedTime: string;
  simulateFailure?: boolean;
}

interface NewProductPayload {
  name: string;
  pricePi: number;
  category: Product['category'];
  image: string;
  stock: number;
  description: string;
}

interface AfomiContextValue extends AfomiState {
  isCeo: boolean;
  isAdminUnlocked: boolean;
  feeRate: number;
  nairaRate: number;
  navigate: (route: AppRoute) => void;
  dismissSplash: () => void;
  loginWithPi: () => Promise<{ ok: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => { ok: boolean; error?: string };
  loginAsCeo: () => void;
  completeKyc: (data: {
    name: string;
    country: string;
    city: string;
    phone: string;
    skills: string[];
  }) => void;
  logout: () => void;
  deleteMyAccount: () => Promise<void>;
  showToast: (text: string, tone?: 'success' | 'info' | 'error') => void;
  markAllNotificationsRead: () => void;
  // Task Escrow
  postTaskWithEscrow: (payload: PostTaskPayload) => Promise<{ ok: boolean; message: string; taskId?: string }>;
  submitTaskWork: (taskId: string, submissionText: string, submissionImage?: string) => { ok: boolean; message: string };
  reviewTaskSubmission: (
    submissionId: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string
  ) => void;
  autoApproveSubmission48h: (submissionId: string) => void;
  appealSubmission: (submissionId: string, appealNote: string) => void;
  // Marketplace Escrow
  addToCart: (product: Product, qty?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  checkoutCartWithEscrow: (simulateFailure?: boolean) => Promise<{ ok: boolean; message: string }>;
  buyNowWithEscrow: (product: Product, simulateFailure?: boolean) => Promise<{ ok: boolean; message: string }>;
  markOrderShipped: (orderId: string) => void;
  confirmOrderDelivery: (orderId: string) => void;
  autoReleaseOrder3Days: (orderId: string) => void;
  disputeOrder: (orderId: string, reason: string) => void;
  resolveOrderDispute: (orderId: string, resolution: 'REFUND_BUYER' | 'RELEASE_SELLER') => void;
  // Subscriptions
  subscribeWithEscrow: (planId: string) => Promise<{ ok: boolean; message: string }>;
  confirmSubscriptionDelivery: (activeSubId: string) => void;
  cancelSubscription: (activeSubId: string) => void;
  // Shop & Wallet
  saveShop: (shop: Omit<ShopProfile, 'created'>) => void;
  addSellerProduct: (payload: NewProductPayload) => void;
  withdrawPi: (amount: number, piAddress: string) => { ok: boolean; message: string };
  topUpDemoPi: (amount: number) => void;
  // Learn
  completeCourse: (courseId: string) => void;
  // Reports
  reportListing: (targetType: 'task' | 'product', targetId: string, targetTitle: string, reason: string) => void;
  // CEO AI
  refreshCeoBriefing: () => void;
  sendCeoChat: (question: string) => void;
  sendSupportReply: (ticketId: string, replyText: string) => void;
  // Admin Management Dashboard Controls
  unlockAdminWithPin: () => void;
  lockAdminSession: () => void;
  toggleUserKyc: (userId: string) => void;
  toggleUserSuspend: (userId: string) => void;
  deleteAdminUser: (userId: string) => void;
  deleteTaskByAdmin: (taskId: string) => void;
  toggleProductVisibility: (productId: string) => void;
  releaseEscrowByAdmin: (escrowId: string) => void;
  refundEscrowByAdmin: (escrowId: string) => void;
  refundSubscriptionByAdmin: (subId: string) => void;
  updateAdminSettings: (patch: Partial<AdminSettings>) => void;
  toggleDemoMode: (enabled: boolean) => void;
  addAuditLog: (action: string) => void;
  resetDemoData: () => void;
}

const AfomiContext = createContext<AfomiContextValue | null>(null);

export const AfomiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AfomiState>(() => {
    const urlRoute = getInitialRouteFromUrl();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AfomiState;
        const base = createDefaultState(parsed.adminSettings?.demoMode ?? ENV_DEMO_MODE);
        return {
          ...base,
          ...parsed,
          route: urlRoute || parsed.route || 'splash',
          piAuthLoading: false,
          paymentPhase: null,
          toast: null,
        };
      }
    } catch {
      // ignore storage errors
    }
    return createDefaultState(ENV_DEMO_MODE);
  });

  // Initialize Pi SDK v2.0 & check incomplete payments on app load
  useEffect(() => {
    void initPiTestnetSdk();
    void checkServerIncompletePayments().then((count) => {
      if (count > 0) {
        setState((prev) => ({
          ...prev,
          notifications: [
            {
              id: `notif-inc-${Date.now()}`,
              title: 'Incomplete Payment Check Completed',
              message: `Checked ${count} pending Testnet payment record(s) with server.`,
              time: 'Just now',
              read: false,
              type: 'lock',
            },
            ...prev.notifications,
          ],
        }));
      }
    });
  }, []);

  useEffect(() => {
    try {
      const { toast: _t, piAuthLoading: _l, paymentPhase: _p, ...persistable } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  const isCeo = useMemo(() => {
    if (!state.user) return false;
    const email = state.user.email.toLowerCase();
    return state.user.role === 'ceo' || email === 'ceo@afomi.app' || email === 'admin@afomi.app';
  }, [state.user]);

  const isAdminUnlocked = isCeo || state.adminPinUnlocked;
  const feeRate = useMemo(() => (state.adminSettings.afomiFeePercent || 8) / 100, [state.adminSettings.afomiFeePercent]);

  const showToast = (text: string, tone: 'success' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setState((prev) => ({ ...prev, toast: { id, text, tone } }));
    setTimeout(() => {
      setState((prev) => (prev.toast?.id === id ? { ...prev, toast: null } : prev));
    }, 3800);
  };

  const addAuditLog = (action: string) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      adminName: state.user?.name || 'AFOMI Admin',
      action: sanitizeText(action, 200),
    };
    setState((prev) => ({ ...prev, auditLogs: [entry, ...prev.auditLogs] }));
  };

  const navigate = (route: AppRoute) => {
    if (route === 'ceo' && !isAdminUnlocked) {
      showToast('CEO Dashboard is restricted to CEO / Admin access.', 'error');
      return;
    }
    if (route === 'admin-dashboard' && !isAdminUnlocked) {
      showToast('Enter Admin PIN first.', 'error');
      return;
    }
    if (typeof window !== 'undefined') {
      const targetPath =
        route === 'privacy' ? '/privacy' : route === 'terms' ? '/terms' : route === 'help' ? '/help' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
    setState((prev) => ({ ...prev, route }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dismissSplash = () => {
    setState((prev) => ({ ...prev, hasSeenSplash: true, route: prev.user ? 'home' : 'auth' }));
  };

  const loginWithPi = async (): Promise<{ ok: boolean; error?: string }> => {
    setState((prev) => ({ ...prev, piAuthLoading: true }));
    try {
      const piAuth = await authenticateWithPiTestnet();
      setState((prev) => {
        const nextUser: UserProfile = {
          ...(prev.user || DEFAULT_USER),
          name: prev.user?.name || 'Amara Nwosu',
          piAuthenticated: true,
          piUid: piAuth.uid,
          piUsername: piAuth.username,
          piWalletAddress: piAuth.walletAddress,
          kycVerified: prev.user?.kycVerified ?? false,
        };
        const exists = prev.adminUsers.some((u) => u.email === nextUser.email);
        return {
          ...prev,
          hasSeenSplash: true,
          piAuthLoading: false,
          user: nextUser,
          adminUsers: exists
            ? prev.adminUsers.map((u) => (u.email === nextUser.email ? { ...u, ...nextUser } : u))
            : [nextUser, ...prev.adminUsers],
          route: nextUser.kycVerified ? 'home' : 'kyc',
        };
      });
      showToast(`Pi Testnet authenticated as ${piAuth.username}.`, 'success');
      return { ok: true };
    } catch {
      setState((prev) => ({ ...prev, piAuthLoading: false }));
      showToast('Pi authentication failed or cancelled.', 'error');
      return { ok: false, error: 'Pi authentication cancelled.' };
    }
  };

  const loginWithEmail = (email: string, password: string): { ok: boolean; error?: string } => {
    const cleanEmail = sanitizeText(email, 120).toLowerCase();
    if (!cleanEmail || !password.trim()) {
      return { ok: false, error: 'Please enter both email and password.' };
    }
    if (cleanEmail === 'ceo@afomi.app' || cleanEmail === 'admin@afomi.app') {
      if (password !== 'afomi123' && password.length < 4) {
        return { ok: false, error: 'Invalid CEO password. Use afomi123 for demo.' };
      }
      setState((prev) => ({
        ...prev,
        hasSeenSplash: true,
        user: { ...CEO_USER, email: cleanEmail },
        route: 'ceo',
      }));
      showToast('Welcome back, CEO. Executive AI Briefing is ready.', 'success');
      return { ok: true };
    }
    const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    setState((prev) => ({
      ...prev,
      hasSeenSplash: true,
      user: {
        ...DEFAULT_USER,
        name: formattedName || 'Afomi Member',
        email: cleanEmail,
        kycVerified: false,
        piAuthenticated: false,
      },
      route: 'kyc',
    }));
    showToast('Signed in. Connect Pi Network before making Escrow payments.', 'info');
    return { ok: true };
  };

  const loginAsCeo = () => {
    setState((prev) => ({
      ...prev,
      hasSeenSplash: true,
      user: CEO_USER,
      route: 'ceo',
    }));
    showToast('Logged in as AFOMI CEO (ceo@afomi.app)', 'success');
  };

  const completeKyc = (data: {
    name: string;
    country: string;
    city: string;
    phone: string;
    skills: string[];
  }) => {
    const cleanName = sanitizeText(data.name, 80);
    const cleanCity = sanitizeText(data.city, 60);
    const cleanPhone = sanitizeText(data.phone, 30);
    setState((prev) => {
      const updatedUser = prev.user
        ? {
            ...prev.user,
            name: cleanName || prev.user.name,
            country: sanitizeText(data.country, 60) || prev.user.country,
            city: cleanCity || prev.user.city,
            phone: cleanPhone || prev.user.phone,
            skills: data.skills.length > 0 ? data.skills.map((s) => sanitizeText(s, 40)) : prev.user.skills,
            kycVerified: true,
          }
        : DEFAULT_USER;
      return {
        ...prev,
        user: updatedUser,
        adminUsers: prev.adminUsers.map((u) => (u.email === updatedUser.email ? updatedUser : u)),
        route: 'home',
      };
    });
    showToast('KYC Verified badge unlocked! Welcome to AFOMI.', 'success');
  };

  const logout = () => {
    void fetch('/api/pi/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    setState((prev) => ({ ...prev, user: null, adminPinUnlocked: false, route: 'auth' }));
    showToast('Signed out of AFOMI.', 'info');
  };

  const deleteMyAccount = async () => {
    const email = state.user?.email;
    try {
      await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      });
    } catch {
      // proceed with client wipe cleanly
    }
    localStorage.removeItem(STORAGE_KEY);
    setState((prev) => ({
      ...createDefaultState(prev.adminSettings.demoMode),
      hasSeenSplash: true,
      user: null,
      route: 'auth',
      adminUsers: prev.adminUsers.filter((u) => u.email !== email),
    }));
    showToast('Your account and personal data have been permanently deleted.', 'info');
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  // === CORE TASK ESCROW (WITH BACKEND-VERIFIED PI TESTNET FLOW) ===
  const postTaskWithEscrow = async (payload: PostTaskPayload) => {
    if (!state.user?.piAuthenticated) {
      showToast('Please Login with Pi first before paying.', 'error');
      return { ok: false, message: 'Please Login with Pi first.' };
    }

    const titleErr = validateRequired(payload.title, 'Task title');
    if (titleErr) return { ok: false, message: titleErr };
    const payErr = validatePiAmount(payload.payPerWorker, 'Pay per worker');
    if (payErr) return { ok: false, message: payErr };
    const workersErr = validateWorkersCount(payload.totalWorkers);
    if (workersErr) return { ok: false, message: workersErr };

    const cleanTitle = sanitizeText(payload.title, 120);
    const workersBudget = Number((payload.payPerWorker * payload.totalWorkers).toFixed(2));
    const afomiFee = Number((workersBudget * feeRate).toFixed(2));
    const totalToLock = Number((workersBudget + afomiFee).toFixed(2));

    const totalErr = validatePiAmount(totalToLock, 'Total Escrow Deposit');
    if (totalErr) return { ok: false, message: totalErr };

    const newTaskId = `task-${Date.now()}`;
    const paymentOutcome = await executePiPayment({
      amount: totalToLock,
      memo: `AFOMI Task Escrow: ${cleanTitle}`,
      metadata: { type: 'task', id: newTaskId, workers: payload.totalWorkers },
      userUid: state.user.piUid,
      piUsername: state.user.piUsername,
      simulateFailure: payload.simulateFailure,
      onPhase: (phase) => setState((prev) => ({ ...prev, paymentPhase: phase })),
    });
    setState((prev) => ({ ...prev, paymentPhase: null }));

    if (!paymentOutcome.ok) {
      setState((prev) => ({
        ...prev,
        walletTransactions: [
          {
            id: `wal-${Date.now()}`,
            date: '2026-11-25',
            label: `Failed/Cancelled Escrow Deposit: ${cleanTitle}`,
            amountPi: totalToLock,
            direction: 'debit',
            status: 'Failed',
          },
          ...prev.walletTransactions,
        ],
      }));
      showToast(paymentOutcome.error || 'Pi payment failed. Task was NOT posted.', 'error');
      return { ok: false, message: paymentOutcome.error || 'Pi payment failed. Task was NOT posted.' };
    }

    const newTask: Task = {
      id: newTaskId,
      title: cleanTitle,
      category: payload.category,
      payPerWorker: payload.payPerWorker,
      totalWorkers: payload.totalWorkers,
      spotsLeft: payload.totalWorkers,
      totalBudgetLocked: workersBudget,
      afomiFeeLocked: afomiFee,
      estimatedTime: sanitizeText(payload.estimatedTime, 40) || '15 mins',
      difficulty: payload.difficulty,
      postedBy: state.user?.name || 'Verified Poster',
      posterEmail: state.user?.email || 'poster@afomi.app',
      deadline: payload.deadline,
      description: payload.instructions.map((i) => sanitizeText(i, 240)).join(' '),
      instructions: payload.instructions.map((i) => sanitizeText(i, 240)),
      exampleOutput: sanitizeText(payload.exampleOutput, 240) || 'Clear proof matching all instructions.',
      status: 'OPEN',
      createdAt: '2026-11-25',
      piPaymentId: paymentOutcome.paymentId,
      piTxId: paymentOutcome.txid,
    };

    setState((prev) => ({
      ...prev,
      availableBalance: Math.max(0, Number((prev.availableBalance - totalToLock).toFixed(2))),
      lockedEscrowBalance: Number((prev.lockedEscrowBalance + totalToLock).toFixed(2)),
      tasks: [newTask, ...prev.tasks],
      escrowTransactions: [
        {
          id: `esc-${Date.now()}`,
          date: '2026-11-25',
          title: cleanTitle,
          type: 'Task Escrow',
          grossAmountPi: totalToLock,
          afomiFeePi: afomiFee,
          netAmountPi: workersBudget,
          status: 'LOCKED',
          counterparty: `${payload.totalWorkers} Worker Spots`,
          notes: `Verified Pi Testnet Payment (${paymentOutcome.paymentId}). Locked ${workersBudget.toFixed(2)} Pi + ${afomiFee.toFixed(2)} Pi fee.`,
          piPaymentId: paymentOutcome.paymentId,
        },
        ...prev.escrowTransactions,
      ],
      walletTransactions: [
        {
          id: `wal-${Date.now()}`,
          date: '2026-11-25',
          label: `Escrow Lock (Task Posted): ${cleanTitle}`,
          amountPi: totalToLock,
          direction: 'debit',
          status: 'Locked in Escrow',
        },
        ...prev.walletTransactions,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Funds Locked in Escrow',
          message: `${totalToLock.toFixed(2)} Pi verified on Pi Testnet & locked for "${cleanTitle}".`,
          time: 'Just now',
          read: false,
          type: 'lock',
        },
        ...prev.notifications,
      ],
    }));

    showToast('Task Posted. Pi Testnet payment verified & locked in Escrow.', 'success');
    return { ok: true, message: 'Task Posted. Funds Locked in Escrow.', taskId: newTaskId };
  };

  const submitTaskWork = (taskId: string, submissionText: string, submissionImage?: string) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return { ok: false, message: 'Task not found.' };
    if (task.spotsLeft <= 0) return { ok: false, message: 'No worker spots remaining.' };
    const cleanWork = sanitizeText(submissionText, 1200);
    if (!cleanWork) return { ok: false, message: 'Please describe or paste your completed work.' };

    const workerNet = Number((task.payPerWorker * (1 - feeRate)).toFixed(2));
    const afomiFee = Number((task.payPerWorker * feeRate).toFixed(2));
    const hasImage = Boolean(submissionImage);
    const qualityScore = cleanWork.length > 25 && hasImage ? 94 : cleanWork.length > 20 ? 86 : 62;

    const newSub: TaskSubmission = {
      id: `subm-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      category: task.category,
      workerName: state.user?.name || 'Amara Nwosu',
      workerEmail: state.user?.email || 'amara@afomi.app',
      payPerWorker: task.payPerWorker,
      workerNetPay: workerNet,
      afomiFee,
      submissionText: cleanWork,
      submissionImage,
      submittedAt: '2026-11-25 Just now',
      hoursRemaining48h: state.adminSettings.autoApproveHours || 48,
      status: 'PENDING REVIEW',
      aiScore: qualityScore,
      aiVerdict: qualityScore >= 75 ? 'Good' : 'Flagged',
      aiSuggestion: qualityScore >= 75 ? 'APPROVE' : 'REJECT',
      aiReason:
        qualityScore >= 75
          ? 'Detailed submission text with clear adherence to task requirements.'
          : 'Brief response; reviewer should verify completeness before release.',
    };

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              spotsLeft: Math.max(0, t.spotsLeft - 1),
              status: t.spotsLeft - 1 <= 0 ? 'COMPLETED' : 'OPEN',
            }
          : t
      ),
      submissions: [newSub, ...prev.submissions],
      escrowTransactions: [
        {
          id: `esc-${Date.now()}`,
          date: '2026-11-25',
          title: task.title,
          type: 'Task Payout',
          grossAmountPi: task.payPerWorker,
          afomiFeePi: afomiFee,
          netAmountPi: workerNet,
          status: 'PENDING REVIEW',
          counterparty: task.postedBy,
          notes: `Submitted work. ${workerNet.toFixed(2)} Pi locked in Escrow pending review.`,
        },
        ...prev.escrowTransactions,
      ],
      walletTransactions: [
        {
          id: `wal-${Date.now()}`,
          date: '2026-11-25',
          label: `Pending Escrow Payout: ${task.title}`,
          amountPi: workerNet,
          direction: 'credit',
          status: 'Pending',
        },
        ...prev.walletTransactions,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Funds Locked in Escrow',
          message: `Work submitted for "${task.title}". +${workerNet.toFixed(2)} Pi held until approved.`,
          time: 'Just now',
          read: false,
          type: 'lock',
        },
        ...prev.notifications,
      ],
    }));

    showToast(`Submitted! +${workerNet.toFixed(2)} Pi locked in Escrow (Pending Review).`, 'success');
    return { ok: true, message: 'Work submitted! Status is now PENDING REVIEW.' };
  };

  const reviewTaskSubmission = (
    submissionId: string,
    decision: 'APPROVE' | 'REJECT',
    reason = ''
  ) => {
    const sub = state.submissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== 'PENDING REVIEW') return;

    if (decision === 'APPROVE') {
      setState((prev) => ({
        ...prev,
        availableBalance: Number((prev.availableBalance + sub.workerNetPay).toFixed(2)),
        lockedEscrowBalance: Math.max(0, Number((prev.lockedEscrowBalance - sub.payPerWorker).toFixed(2))),
        totalEarned: Number((prev.totalEarned + sub.workerNetPay).toFixed(2)),
        weeklyEarnings: Number((prev.weeklyEarnings + sub.workerNetPay).toFixed(2)),
        afomiCommissionEarned: Number((prev.afomiCommissionEarned + sub.afomiFee).toFixed(2)),
        submissions: prev.submissions.map((s) =>
          s.id === submissionId ? { ...s, status: 'APPROVED', hoursRemaining48h: 0 } : s
        ),
        escrowTransactions: [
          {
            id: `esc-${Date.now()}`,
            date: '2026-11-25',
            title: sub.taskTitle,
            type: 'Task Payout',
            grossAmountPi: sub.payPerWorker,
            afomiFeePi: sub.afomiFee,
            netAmountPi: sub.workerNetPay,
            status: 'RELEASED',
            counterparty: sub.workerName,
            notes: `Approved! Worker paid ${sub.workerNetPay.toFixed(2)} Pi. AFOMI fee: ${sub.afomiFee.toFixed(2)} Pi.`,
          },
          ...prev.escrowTransactions,
        ],
        walletTransactions: [
          {
            id: `wal-${Date.now()}`,
            date: '2026-11-25',
            label: `Payment Released: ${sub.taskTitle}`,
            amountPi: sub.workerNetPay,
            direction: 'credit',
            status: 'Completed',
          },
          ...prev.walletTransactions,
        ],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            title: `Payment Released: +${sub.workerNetPay.toFixed(2)} Pi`,
            message: `"${sub.taskTitle}" approved. AFOMI kept ${sub.afomiFee.toFixed(2)} Pi.`,
            time: 'Just now',
            read: false,
            type: 'release',
          },
          ...prev.notifications,
        ],
      }));
      addAuditLog(`Approved task submission "${sub.taskTitle}" (+${sub.workerNetPay.toFixed(2)} Pi to ${sub.workerName})`);
      showToast(`Payment Released: +${sub.workerNetPay.toFixed(2)} Pi`, 'success');
    } else {
      const rejectNote = sanitizeText(reason, 200) || 'Did not meet required instructions or proof standards.';
      setState((prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.id === submissionId
            ? { ...s, status: 'REJECTED', rejectionReason: rejectNote, hoursRemaining48h: 0 }
            : s
        ),
        tasks: prev.tasks.map((t) =>
          t.id === sub.taskId
            ? { ...t, spotsLeft: Math.min(t.totalWorkers, t.spotsLeft + 1), status: 'OPEN' }
            : t
        ),
        escrowTransactions: [
          {
            id: `esc-${Date.now()}`,
            date: '2026-11-25',
            title: sub.taskTitle,
            type: 'Task Escrow',
            grossAmountPi: sub.payPerWorker,
            afomiFeePi: 0,
            netAmountPi: sub.payPerWorker,
            status: 'REFUNDED',
            counterparty: sub.workerName,
            notes: `Rejected (${rejectNote}). Funds returned to Payer Escrow & spot reopened.`,
          },
          ...prev.escrowTransactions,
        ],
        notifications: [
          {
            id: `notif-${Date.now()}`,
            title: 'Submission Rejected — Spot Reopened',
            message: `0 Pi released. Funds returned to Payer Escrow for "${sub.taskTitle}".`,
            time: 'Just now',
            read: false,
            type: 'approval',
          },
          ...prev.notifications,
        ],
      }));
      addAuditLog(`Rejected submission "${sub.taskTitle}" by ${sub.workerName}: ${rejectNote}`);
      showToast('Submission rejected. Funds returned to Payer Escrow & spot reopened.', 'info');
    }
  };

  const autoApproveSubmission48h = (submissionId: string) => {
    reviewTaskSubmission(submissionId, 'APPROVE', `Auto-approved after ${state.adminSettings.autoApproveHours}h window.`);
  };

  const appealSubmission = (submissionId: string, appealNote: string) => {
    const cleanNote = sanitizeText(appealNote, 300) || 'Worker requested manual Admin re-evaluation.';
    setState((prev) => ({
      ...prev,
      submissions: prev.submissions.map((s) =>
        s.id === submissionId && !s.appealed
          ? {
              ...s,
              appealed: true,
              appealNote: cleanNote,
              status: 'PENDING REVIEW',
              hoursRemaining48h: 24,
            }
          : s
      ),
    }));
    showToast('Appeal submitted once for Admin/CEO review.', 'info');
  };

  // === MARKETPLACE ESCROW (WITH BACKEND-VERIFIED PI TESTNET FLOW) ===
  const addToCart = (product: Product, qty = 1) => {
    setState((prev) => {
      const existing = prev.cart.find((c) => c.product.id === product.id);
      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map((c) =>
            c.product.id === product.id ? { ...c, quantity: c.quantity + qty } : c
          ),
        };
      }
      return { ...prev, cart: [...prev.cart, { product, quantity: qty }] };
    });
    showToast(`Added "${product.name}" to cart`, 'success');
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((c) => (c.product.id === productId ? { ...c, quantity: qty } : c)),
    }));
  };

  const removeFromCart = (productId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((c) => c.product.id !== productId),
    }));
  };

  const placeOrdersIntoEscrow = async (
    items: CartItem[],
    clearCartAfter: boolean,
    simulateFailure = false
  ) => {
    if (!state.user?.piAuthenticated) {
      showToast('Please Login with Pi first before checking out.', 'error');
      return { ok: false, message: 'Please Login with Pi first.' };
    }
    const total = Number(
      items.reduce((sum, item) => sum + item.product.pricePi * item.quantity, 0).toFixed(2)
    );
    if (total <= 0) return { ok: false, message: 'Cart is empty.' };
    const amtErr = validatePiAmount(total, 'Order total');
    if (amtErr) {
      showToast(amtErr, 'error');
      return { ok: false, message: amtErr };
    }

    const orderBatchId = `ord-${Date.now()}`;
    const paymentOutcome = await executePiPayment({
      amount: total,
      memo: `AFOMI Marketplace Escrow (${items.length} item${items.length > 1 ? 's' : ''})`,
      metadata: { type: 'market', id: orderBatchId, itemCount: items.length },
      userUid: state.user.piUid,
      piUsername: state.user.piUsername,
      simulateFailure,
      onPhase: (phase) => setState((prev) => ({ ...prev, paymentPhase: phase })),
    });
    setState((prev) => ({ ...prev, paymentPhase: null }));

    if (!paymentOutcome.ok) {
      showToast(paymentOutcome.error || 'Payment failed or cancelled. Order NOT placed.', 'error');
      return { ok: false, message: paymentOutcome.error || 'Payment failed.' };
    }

    const newOrders: MarketOrder[] = items.map((item, idx) => {
      const gross = Number((item.product.pricePi * item.quantity).toFixed(2));
      const fee = Number((gross * feeRate).toFixed(2));
      const net = Number((gross - fee).toFixed(2));
      return {
        id: `${orderBatchId}-${idx}`,
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.image,
        quantity: item.quantity,
        totalPi: gross,
        sellerNetPi: net,
        afomiFeePi: fee,
        buyerName: state.user?.name || 'Amara Nwosu',
        buyerEmail: state.user?.email || 'amara@afomi.app',
        sellerName: item.product.sellerName,
        status: 'ESCROW_LOCKED',
        createdAt: '2026-11-25',
        autoReleaseDaysLeft: 3,
        piPaymentId: paymentOutcome.paymentId,
        piTxId: paymentOutcome.txid,
      };
    });

    const newEscrowEntries: EscrowTransaction[] = newOrders.map((o) => ({
      id: `esc-${o.id}`,
      date: '2026-11-25',
      title: `${o.productName} (x${o.quantity})`,
      type: 'Marketplace Order',
      grossAmountPi: o.totalPi,
      afomiFeePi: o.afomiFeePi,
      netAmountPi: o.sellerNetPi,
      status: 'LOCKED',
      counterparty: o.sellerName,
      notes: `Verified Pi Testnet payment (${paymentOutcome.paymentId}). Locked in Escrow until delivery confirmation.`,
      piPaymentId: paymentOutcome.paymentId,
    }));

    setState((prev) => ({
      ...prev,
      availableBalance: Math.max(0, Number((prev.availableBalance - total).toFixed(2))),
      lockedEscrowBalance: Number((prev.lockedEscrowBalance + total).toFixed(2)),
      orders: [...newOrders, ...prev.orders],
      cart: clearCartAfter ? [] : prev.cart,
      escrowTransactions: [...newEscrowEntries, ...prev.escrowTransactions],
      walletTransactions: [
        {
          id: `wal-${Date.now()}`,
          date: '2026-11-25',
          label: `Marketplace Escrow Lock (${items.length} item${items.length > 1 ? 's' : ''})`,
          amountPi: total,
          direction: 'debit',
          status: 'Locked in Escrow',
        },
        ...prev.walletTransactions,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Payment Locked in Escrow',
          message: `Verified ${total.toFixed(2)} Pi on Testnet — Seller will now prepare your order.`,
          time: 'Just now',
          read: false,
          type: 'lock',
        },
        ...prev.notifications,
      ],
    }));

    showToast('Payment Verified & Locked in Escrow — Seller will now prepare your order.', 'success');
    return { ok: true, message: 'Payment Locked in Escrow.' };
  };

  const checkoutCartWithEscrow = (simulateFailure = false) =>
    placeOrdersIntoEscrow(state.cart, true, simulateFailure);

  const buyNowWithEscrow = (product: Product, simulateFailure = false) =>
    placeOrdersIntoEscrow([{ product, quantity: 1 }], false, simulateFailure);

  const markOrderShipped = (orderId: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: 'SHIPPED' } : o)),
    }));
    showToast('Order marked as Shipped / Prepared. Awaiting buyer confirmation.', 'info');
  };

  const confirmOrderDelivery = (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order || order.status === 'DELIVERED_RELEASED' || order.status === 'REFUNDED') return;

    setState((prev) => ({
      ...prev,
      lockedEscrowBalance: Math.max(0, Number((prev.lockedEscrowBalance - order.totalPi).toFixed(2))),
      afomiCommissionEarned: Number((prev.afomiCommissionEarned + order.afomiFeePi).toFixed(2)),
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'DELIVERED_RELEASED', autoReleaseDaysLeft: 0 } : o
      ),
      escrowTransactions: [
        {
          id: `esc-${Date.now()}`,
          date: '2026-11-25',
          title: order.productName,
          type: 'Marketplace Order',
          grossAmountPi: order.totalPi,
          afomiFeePi: order.afomiFeePi,
          netAmountPi: order.sellerNetPi,
          status: 'RELEASED',
          counterparty: order.sellerName,
          notes: `Delivery confirmed. Released ${order.sellerNetPi.toFixed(2)} Pi to seller (AFOMI fee: ${order.afomiFeePi.toFixed(2)} Pi).`,
        },
        ...prev.escrowTransactions,
      ],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: `Order Released: ${order.sellerNetPi.toFixed(2)} Pi`,
          message: `Delivery confirmed for "${order.productName}". Seller paid minus AFOMI fee.`,
          time: 'Just now',
          read: false,
          type: 'release',
        },
        ...prev.notifications,
      ],
    }));
    showToast(`Delivery confirmed! ${order.sellerNetPi.toFixed(2)} Pi released to seller.`, 'success');
  };

  const autoReleaseOrder3Days = (orderId: string) => {
    confirmOrderDelivery(orderId);
  };

  const disputeOrder = (orderId: string, reason: string) => {
    const cleanReason = sanitizeText(reason, 300) || 'Item arrived damaged or did not match listing.';
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'DISPUTED', disputeReason: cleanReason } : o
      ),
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Dispute Opened — Funds Frozen Safely',
          message: `Order #${orderId} funds remain locked in Escrow until Admin resolves.`,
          time: 'Just now',
          read: false,
          type: 'lock',
        },
        ...prev.notifications,
      ],
    }));
    showToast('Dispute filed. Money stays locked in Escrow until Admin resolves.', 'info');
  };

  const resolveOrderDispute = (orderId: string, resolution: 'REFUND_BUYER' | 'RELEASE_SELLER') => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    if (resolution === 'REFUND_BUYER') {
      setState((prev) => ({
        ...prev,
        availableBalance: Number((prev.availableBalance + order.totalPi).toFixed(2)),
        lockedEscrowBalance: Math.max(0, Number((prev.lockedEscrowBalance - order.totalPi).toFixed(2))),
        orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: 'REFUNDED' } : o)),
        escrowTransactions: [
          {
            id: `esc-${Date.now()}`,
            date: '2026-11-25',
            title: order.productName,
            type: 'Marketplace Order',
            grossAmountPi: order.totalPi,
            afomiFeePi: 0,
            netAmountPi: order.totalPi,
            status: 'REFUNDED',
            counterparty: order.buyerName,
            notes: 'Admin resolved dispute in buyer favor. 100% refunded from Escrow.',
          },
          ...prev.escrowTransactions,
        ],
      }));
      addAuditLog(`Resolved dispute on order #${orderId}: Refunded ${order.totalPi.toFixed(2)} Pi to buyer`);
      showToast(`Dispute resolved: ${order.totalPi.toFixed(2)} Pi refunded to buyer.`, 'success');
    } else {
      addAuditLog(`Resolved dispute on order #${orderId}: Released ${order.sellerNetPi.toFixed(2)} Pi to seller`);
      confirmOrderDelivery(orderId);
    }
  };

  // === SUBSCRIPTION ESCROW ===
  const subscribeWithEscrow = async (planId: string) => {
    if (!state.user?.piAuthenticated) {
      showToast('Please Login with Pi first before subscribing.', 'error');
      return { ok: false, message: 'Please Login with Pi first.' };
    }
    const plan = state.subscriptionPlans.find((p) => p.id === planId);
    if (!plan) return { ok: false, message: 'Subscription plan not found.' };

    const amtErr = validatePiAmount(plan.pricePi, 'Subscription budget');
    if (amtErr) return { ok: false, message: amtErr };

    const subId = `act-sub-${Date.now()}`;
    const paymentOutcome = await executePiPayment({
      amount: plan.pricePi,
      memo: `AFOMI Subscription Escrow: ${plan.title}`,
      metadata: { type: 'subscription', id: subId, planId: plan.id },
      userUid: state.user.piUid,
      piUsername: state.user.piUsername,
      onPhase: (phase) => setState((prev) => ({ ...prev, paymentPhase: phase })),
    });
    setState((prev) => ({ ...prev, paymentPhase: null }));

    if (!paymentOutcome.ok) {
      showToast(paymentOutcome.error || 'Pi payment cancelled. Subscription not activated.', 'error');
      return { ok: false, message: paymentOutcome.error || 'Payment failed.' };
    }

    const fee = Number((plan.pricePi * feeRate).toFixed(2));
    const net = Number((plan.pricePi - fee).toFixed(2));
    const newSub: ActiveSubscription = {
      id: subId,
      planId: plan.id,
      title: plan.title,
      pricePi: plan.pricePi,
      periodLabel: plan.periodLabel,
      providerName: plan.providerName,
      nextPaymentDate:
        plan.period === 'week' ? '2026-12-02' : plan.period === 'biweekly' ? '2026-12-09' : '2026-12-25',
      escrowStatus: 'LOCKED',
      status: 'ACTIVE',
      approvedAt: '2026-11-25',
      piPaymentId: paymentOutcome.paymentId,
    };

    setState((prev) => ({
      ...prev,
      availableBalance: Math.max(0, Number((prev.availableBalance - plan.pricePi).toFixed(2))),
      lockedEscrowBalance: Number((prev.lockedEscrowBalance + plan.pricePi).toFixed(2)),
      activeSubscriptions: [newSub, ...prev.activeSubscriptions],
      escrowTransactions: [
        {
          id: `esc-${Date.now()}`,
          date: '2026-11-25',
          title: `${plan.title} (Cycle #1)`,
          type: 'Subscription',
          grossAmountPi: plan.pricePi,
          afomiFeePi: fee,
          netAmountPi: net,
          status: 'LOCKED',
          counterparty: plan.providerName,
          notes: `Verified Pi Testnet (${paymentOutcome.paymentId}). Subscription cycle locked in Escrow.`,
          piPaymentId: paymentOutcome.paymentId,
        },
        ...prev.escrowTransactions,
      ],
      walletTransactions: [
        {
          id: `wal-${Date.now()}`,
          date: '2026-11-25',
          label: `Subscription Escrow Lock: ${plan.title}`,
          amountPi: plan.pricePi,
          direction: 'debit',
          status: 'Locked in Escrow',
        },
        ...prev.walletTransactions,
      ],
    }));

    showToast(`Subscribed to ${plan.title}! ${plan.pricePi.toFixed(2)} Pi verified & locked in Escrow.`, 'success');
    return { ok: true, message: 'Subscription active with Escrow protection.' };
  };

  const confirmSubscriptionDelivery = (activeSubId: string) => {
    const sub = state.activeSubscriptions.find((s) => s.id === activeSubId);
    if (!sub || sub.escrowStatus === 'RELEASED') return;
    const fee = Number((sub.pricePi * feeRate).toFixed(2));
    const net = Number((sub.pricePi - fee).toFixed(2));

    setState((prev) => ({
      ...prev,
      lockedEscrowBalance: Math.max(0, Number((prev.lockedEscrowBalance - sub.pricePi).toFixed(2))),
      afomiCommissionEarned: Number((prev.afomiCommissionEarned + fee).toFixed(2)),
      activeSubscriptions: prev.activeSubscriptions.map((s) =>
        s.id === activeSubId ? { ...s, escrowStatus: 'RELEASED' } : s
      ),
      escrowTransactions: [
        {
          id: `esc-${Date.now()}`,
          date: '2026-11-25',
          title: `${sub.title} (Service Confirmed)`,
          type: 'Subscription',
          grossAmountPi: sub.pricePi,
          afomiFeePi: fee,
          netAmountPi: net,
          status: 'RELEASED',
          counterparty: sub.providerName,
          notes: `Service confirmed. Released ${net.toFixed(2)} Pi to provider minus fee.`,
        },
        ...prev.escrowTransactions,
      ],
    }));
    showToast(`Service confirmed! ${net.toFixed(2)} Pi released from Escrow.`, 'success');
  };

  const cancelSubscription = (activeSubId: string) => {
    setState((prev) => ({
      ...prev,
      activeSubscriptions: prev.activeSubscriptions.map((s) =>
        s.id === activeSubId ? { ...s, status: 'CANCELLED' } : s
      ),
    }));
    addAuditLog(`Cancelled subscription #${activeSubId}`);
    showToast('Subscription cancelled. No future cycles will be locked.', 'info');
  };

  // === SHOP & WALLET ===
  const saveShop = (shop: Omit<ShopProfile, 'created'>) => {
    setState((prev) => ({
      ...prev,
      shop: {
        name: sanitizeText(shop.name, 80),
        description: sanitizeText(shop.description, 300),
        location: sanitizeText(shop.location, 80),
        logo: shop.logo,
        created: true,
      },
    }));
    showToast('Shop profile saved!', 'success');
  };

  const addSellerProduct = (payload: NewProductPayload) => {
    const cleanName = sanitizeText(payload.name, 100);
    const amtErr = validatePiAmount(payload.pricePi, 'Product price');
    if (!cleanName || amtErr) {
      showToast(amtErr || 'Product name is required.', 'error');
      return;
    }
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: cleanName,
      category: payload.category,
      pricePi: payload.pricePi,
      sellerName: state.shop.name || state.user?.name || 'My AFOMI Shop',
      sellerEmail: state.user?.email || 'seller@afomi.app',
      sellerRating: 5.0,
      location: `${state.user?.city || 'Lagos'}, ${state.user?.country || 'Nigeria'}`,
      stock: Math.max(1, Math.floor(payload.stock)),
      image: payload.image || GENERATED_IMAGES.design,
      description: sanitizeText(payload.description, 300),
      deliveryEstimate: '1–3 business days',
      salesCount: 0,
    };
    setState((prev) => ({ ...prev, products: [newProd, ...prev.products] }));
    showToast(`Product "${cleanName}" listed in Marketplace!`, 'success');
  };

  const withdrawPi = (amount: number, piAddress: string) => {
    const amtErr = validatePiAmount(amount, 'Withdrawal amount');
    if (amtErr) return { ok: false, message: amtErr };
    const cleanAddr = sanitizeText(piAddress, 80);
    if (!cleanAddr || cleanAddr.length < 6) {
      return { ok: false, message: 'Enter a valid Pi wallet address or username.' };
    }
    if (amount > state.availableBalance) {
      return { ok: false, message: 'Amount exceeds Available Balance (Escrow funds cannot be withdrawn early).' };
    }
    setState((prev) => ({
      ...prev,
      availableBalance: Number((prev.availableBalance - amount).toFixed(2)),
      walletTransactions: [
        {
          id: `wal-${Date.now()}`,
          date: '2026-11-25',
          label: `Pi Testnet Withdrawal to ${cleanAddr}`,
          amountPi: amount,
          direction: 'debit',
          status: 'Completed',
        },
        ...prev.walletTransactions,
      ],
    }));
    showToast(`Withdrew ${amount.toFixed(2)} Pi to ${cleanAddr}`, 'success');
    return { ok: true, message: 'Withdrawal completed.' };
  };

  const topUpDemoPi = (amount: number) => {
    setState((prev) => ({
      ...prev,
      availableBalance: Number((prev.availableBalance + amount).toFixed(2)),
      walletTransactions: [
        {
          id: `wal-${Date.now()}`,
          date: '2026-11-25',
          label: 'Pi Testnet Faucet Top-Up',
          amountPi: amount,
          direction: 'credit',
          status: 'Completed',
        },
        ...prev.walletTransactions,
      ],
    }));
    showToast(`+${amount.toFixed(2)} Testnet Pi added to Available Balance.`, 'success');
  };

  const completeCourse = (courseId: string) => {
    setState((prev) => ({
      ...prev,
      completedCourseIds: prev.completedCourseIds.includes(courseId)
        ? prev.completedCourseIds
        : [...prev.completedCourseIds, courseId],
    }));
    showToast('Quiz passed! AFOMI Verified Certificate issued.', 'success');
  };

  const reportListing = (
    targetType: 'task' | 'product',
    targetId: string,
    targetTitle: string,
    reason: string
  ) => {
    const cleanReason = sanitizeText(reason, 250) || 'Suspicious or policy-violating listing.';
    const rep: ListingReport = {
      id: `rep-${Date.now()}`,
      targetType,
      targetId,
      targetTitle,
      reason: cleanReason,
      reportedBy: state.user?.piUsername || state.user?.email || 'Member',
      createdAt: '2026-11-25',
    };
    setState((prev) => ({
      ...prev,
      reports: [rep, ...prev.reports],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Listing Reported to Trust & Safety',
          message: `Reported ${targetType} "${targetTitle}" for Admin review.`,
          time: 'Just now',
          read: false,
          type: 'approval',
        },
        ...prev.notifications,
      ],
    }));
    showToast('Report submitted. Our Trust & Safety team will review it.', 'info');
  };

  // === CEO AI ===
  const refreshCeoBriefing = () => {
    setState((prev) => ({ ...prev, ceoBriefingVersion: prev.ceoBriefingVersion + 1 }));
    showToast('CEO Daily Briefing refreshed with live Escrow metrics.', 'info');
  };

  const sendCeoChat = (question: string) => {
    const cleanQ = sanitizeText(question, 300);
    if (!cleanQ) return;
    const q = cleanQ.toLowerCase();

    const pendingCount = state.submissions.filter((s) => s.status === 'PENDING REVIEW').length;
    const disputeCount = state.orders.filter((o) => o.status === 'DISPUTED').length;
    const totalEscrow = (state.lockedEscrowBalance + 1482.5).toFixed(2);
    const totalCommission = state.afomiCommissionEarned.toFixed(2);

    let answer = '';
    if (q.includes('1,000') || q.includes('1000') || q.includes('users') || q.includes('growth')) {
      answer = `Growth Plan to Hit +1,000 Users This Week:
• Activate Campus Ambassadors in Lagos, Nairobi & Accra offering 1.5 Pi KYC-verified welcome tasks.
• Require Pi referral loops: workers earn 0.25 Pi bonus from AFOMI marketing budget when a referred friend completes 2 approved tasks.
• Spotlight top-converting categories: Translation (${state.tasks.filter((t) => t.category === 'Translation').length} active tasks) and Airtime/Data bundles.`;
    } else if (q.includes('pro shop') || q.includes('price') || q.includes('pricing')) {
      answer = `Pro Shop Pricing Recommendation:
• Recommended Tier: 12 Pi / month (~₦${(12 * PI_TO_NAIRA_RATE).toLocaleString()}) or 6% reduced Escrow fee (down from ${state.adminSettings.afomiFeePercent}% standard).
• Include 3 perks: Priority Marketplace placement, CSV ledger exports, and Verified Merchant badge.`;
    } else if (q.includes('pi app directory') || q.includes('directory') || q.includes('post')) {
      answer = `Draft Post for Pi App Directory:
"Meet AFOMI — Africa's Escrow-First Marketplace for Micro-Tasks, Local Commerce & Subscriptions (Testnet Ready).
Earn Pi with your own hand: translate African languages, verify retail prices, sell artisanal goods, and subscribe to weekly food packs—with 100% of funds held safely in AFOMI Escrow until approved."`;
    } else if (q.includes('losing money') || q.includes('low') || q.includes('margin')) {
      answer = `Low-Performing & Margin Audit:
• Micro-surveys under 1.0 Pi yield lower commission per completion while generating higher support volume.
• Action Step: Keep minimum task pay floor at 1.50 Pi and require AFOMI Learn quality certification.`;
    } else if (q.includes('summarize') || q.includes('today') || q.includes('business')) {
      answer = `Today's Executive Business Summary:
• Commission Earned: ${totalCommission} Pi cumulative (${state.adminSettings.afomiFeePercent}% Escrow take-rate).
• Total Pi Locked in Escrow: ${totalEscrow} Pi protected across active tasks, shipped orders, and subscriptions.
• Operations Queue: ${pendingCount} task submissions pending review and ${disputeCount} marketplace dispute(s).`;
    } else {
      answer = `Executive Insight for "${cleanQ}":
• Live Snapshot: ${state.tasks.length} tasks, ${state.products.length} marketplace listings, ${pendingCount} pending reviews, and ${totalCommission} Pi earned in commissions.
• Escrow Health: ${totalEscrow} Pi locked on Testnet with server-verified approvals.`;
    }

    const nowTime = new Date().toTimeString().slice(0, 5);
    setState((prev) => ({
      ...prev,
      ceoChat: [
        ...prev.ceoChat,
        { id: `c-ceo-${Date.now()}`, sender: 'ceo', text: cleanQ, timestamp: nowTime },
        { id: `c-ai-${Date.now() + 1}`, sender: 'ai', text: answer, timestamp: nowTime },
      ],
    }));
  };

  const sendSupportReply = (ticketId: string, replyText: string) => {
    const cleanReply = sanitizeText(replyText, 800);
    setState((prev) => ({
      ...prev,
      supportTickets: prev.supportTickets.map((t) =>
        t.id === ticketId ? { ...t, status: 'REPLIED', sentReply: cleanReply } : t
      ),
    }));
    addAuditLog(`Sent CEO AI support reply to ticket #${ticketId}`);
    showToast('Support reply approved and sent to user.', 'success');
  };

  // === ADMIN MANAGEMENT DASHBOARD CONTROLS ===
  const unlockAdminWithPin = () => {
    setState((prev) => ({ ...prev, adminPinUnlocked: true, route: 'admin-dashboard' }));
    addAuditLog('Unlocked Admin Management Dashboard via 4-digit PIN');
  };

  const lockAdminSession = () => {
    setState((prev) => ({ ...prev, adminPinUnlocked: false, route: 'home' }));
  };

  const toggleUserKyc = (userId: string) => {
    const target = state.adminUsers.find((u) => u.id === userId);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      adminUsers: prev.adminUsers.map((u) =>
        u.id === userId ? { ...u, kycVerified: !u.kycVerified } : u
      ),
    }));
    addAuditLog(`${target.kycVerified ? 'Unverified' : 'Verified'} KYC for ${target.name} (${target.email})`);
    showToast(`Updated KYC status for ${target.name}.`, 'info');
  };

  const toggleUserSuspend = (userId: string) => {
    const target = state.adminUsers.find((u) => u.id === userId);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      adminUsers: prev.adminUsers.map((u) =>
        u.id === userId ? { ...u, suspended: !u.suspended } : u
      ),
    }));
    addAuditLog(`${target.suspended ? 'Activated' : 'Suspended'} account ${target.name} (${target.email})`);
    showToast(`${target.name} ${target.suspended ? 'activated' : 'suspended'}.`, 'info');
  };

  const deleteAdminUser = (userId: string) => {
    const target = state.adminUsers.find((u) => u.id === userId);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      adminUsers: prev.adminUsers.filter((u) => u.id !== userId),
    }));
    addAuditLog(`Deleted fake/flagged user account ${target.name} (${target.email})`);
    showToast(`Deleted user ${target.name}.`, 'info');
  };

  const deleteTaskByAdmin = (taskId: string) => {
    const t = state.tasks.find((item) => item.id === taskId);
    if (!t) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((item) => item.id !== taskId),
    }));
    addAuditLog(`Deleted scam/flagged task "${t.title}"`);
    showToast(`Removed task "${t.title}".`, 'info');
  };

  const toggleProductVisibility = (productId: string) => {
    const p = state.products.find((item) => item.id === productId);
    if (!p) return;
    setState((prev) => ({
      ...prev,
      products: prev.products.map((item) =>
        item.id === productId ? { ...item, hidden: !item.hidden } : item
      ),
    }));
    addAuditLog(`${p.hidden ? 'Approved & unhid' : 'Hid'} product "${p.name}"`);
    showToast(`Product "${p.name}" ${p.hidden ? 'approved & visible' : 'hidden'}.`, 'info');
  };

  const releaseEscrowByAdmin = (escrowId: string) => {
    const tx = state.escrowTransactions.find((e) => e.id === escrowId);
    if (!tx || tx.status === 'RELEASED') return;
    setState((prev) => ({
      ...prev,
      lockedEscrowBalance: Math.max(0, Number((prev.lockedEscrowBalance - tx.grossAmountPi).toFixed(2))),
      afomiCommissionEarned: Number((prev.afomiCommissionEarned + tx.afomiFeePi).toFixed(2)),
      escrowTransactions: prev.escrowTransactions.map((e) =>
        e.id === escrowId ? { ...e, status: 'RELEASED', notes: `${e.notes} [Admin Released]` } : e
      ),
    }));
    addAuditLog(`Released Escrow #${escrowId} (${tx.netAmountPi.toFixed(2)} Pi to ${tx.counterparty})`);
    showToast(`Released ${tx.netAmountPi.toFixed(2)} Pi from Escrow.`, 'success');
  };

  const refundEscrowByAdmin = (escrowId: string) => {
    const tx = state.escrowTransactions.find((e) => e.id === escrowId);
    if (!tx || tx.status === 'REFUNDED') return;
    setState((prev) => ({
      ...prev,
      availableBalance: Number((prev.availableBalance + tx.grossAmountPi).toFixed(2)),
      lockedEscrowBalance: Math.max(0, Number((prev.lockedEscrowBalance - tx.grossAmountPi).toFixed(2))),
      escrowTransactions: prev.escrowTransactions.map((e) =>
        e.id === escrowId ? { ...e, status: 'REFUNDED', notes: `${e.notes} [Admin Refunded]` } : e
      ),
    }));
    addAuditLog(`Refunded Escrow #${escrowId} (${tx.grossAmountPi.toFixed(2)} Pi)`);
    showToast(`Refunded ${tx.grossAmountPi.toFixed(2)} Pi from Escrow.`, 'info');
  };

  const refundSubscriptionByAdmin = (subId: string) => {
    const sub = state.activeSubscriptions.find((s) => s.id === subId);
    if (!sub) return;
    setState((prev) => ({
      ...prev,
      availableBalance: Number((prev.availableBalance + sub.pricePi).toFixed(2)),
      lockedEscrowBalance: Math.max(0, Number((prev.lockedEscrowBalance - sub.pricePi).toFixed(2))),
      activeSubscriptions: prev.activeSubscriptions.map((s) =>
        s.id === subId ? { ...s, status: 'CANCELLED', escrowStatus: 'REFUNDED' } : s
      ),
    }));
    addAuditLog(`Cancelled & refunded subscription "${sub.title}" (${sub.pricePi.toFixed(2)} Pi)`);
    showToast(`Subscription "${sub.title}" refunded.`, 'info');
  };

  const updateAdminSettings = (patch: Partial<AdminSettings>) => {
    setState((prev) => ({
      ...prev,
      adminSettings: {
        ...prev.adminSettings,
        ...patch,
        appName: patch.appName !== undefined ? sanitizeText(patch.appName, 40) || 'AFOMI' : prev.adminSettings.appName,
      },
    }));
    addAuditLog(`Updated Admin Settings (${Object.keys(patch).join(', ')})`);
    showToast('Admin settings saved.', 'success');
  };

  const toggleDemoMode = (enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      tasks: enabled ? INITIAL_TASKS : [],
      products: enabled ? INITIAL_PRODUCTS : [],
      subscriptionPlans: enabled ? INITIAL_SUBSCRIPTIONS : [],
      activeSubscriptions: enabled ? INITIAL_ACTIVE_SUBSCRIPTIONS : [],
      escrowTransactions: enabled ? INITIAL_ESCROW_TRANSACTIONS : [],
      walletTransactions: enabled ? INITIAL_WALLET_TRANSACTIONS : [],
      submissions: enabled ? INITIAL_PENDING_SUBMISSIONS : [],
      orders: enabled ? INITIAL_ORDERS : [],
      supportTickets: enabled ? INITIAL_SUPPORT_TICKETS : [],
      notifications: enabled ? INITIAL_NOTIFICATIONS : [],
      availableBalance: enabled ? 125.5 : 0,
      lockedEscrowBalance: enabled ? 8.5 : 0,
      totalEarned: enabled ? 184.2 : 0,
      weeklyEarnings: enabled ? 12.5 : 0,
      adminSettings: { ...prev.adminSettings, demoMode: enabled },
    }));
    addAuditLog(`Switched Demo Data Mode ${enabled ? 'ON' : 'OFF'}`);
    showToast(`Demo Mode ${enabled ? 'enabled' : 'disabled (production empty states active)'}.`, 'info');
  };

  const resetDemoData = () => {
    const fresh = createDefaultState(true);
    setState({
      ...fresh,
      hasSeenSplash: true,
      user: state.user,
      route: state.route,
      adminPinUnlocked: state.adminPinUnlocked,
    });
    showToast('Demo data reset to clean baseline.', 'info');
  };

  const value: AfomiContextValue = {
    ...state,
    isCeo,
    isAdminUnlocked,
    feeRate,
    nairaRate: PI_TO_NAIRA_RATE,
    navigate,
    dismissSplash,
    loginWithPi,
    loginWithEmail,
    loginAsCeo,
    completeKyc,
    logout,
    deleteMyAccount,
    showToast,
    markAllNotificationsRead,
    postTaskWithEscrow,
    submitTaskWork,
    reviewTaskSubmission,
    autoApproveSubmission48h,
    appealSubmission,
    addToCart,
    updateCartQty,
    removeFromCart,
    checkoutCartWithEscrow,
    buyNowWithEscrow,
    markOrderShipped,
    confirmOrderDelivery,
    autoReleaseOrder3Days,
    disputeOrder,
    resolveOrderDispute,
    subscribeWithEscrow,
    confirmSubscriptionDelivery,
    cancelSubscription,
    saveShop,
    addSellerProduct,
    withdrawPi,
    topUpDemoPi,
    completeCourse,
    reportListing,
    refreshCeoBriefing,
    sendCeoChat,
    sendSupportReply,
    unlockAdminWithPin,
    lockAdminSession,
    toggleUserKyc,
    toggleUserSuspend,
    deleteAdminUser,
    deleteTaskByAdmin,
    toggleProductVisibility,
    releaseEscrowByAdmin,
    refundEscrowByAdmin,
    refundSubscriptionByAdmin,
    updateAdminSettings,
    toggleDemoMode,
    addAuditLog,
    resetDemoData,
  };

  return <AfomiContext.Provider value={value}>{children}</AfomiContext.Provider>;
};

export function useAfomi() {
  const ctx = useContext(AfomiContext);
  if (!ctx) throw new Error('useAfomi must be used within AfomiProvider');
  return ctx;
}
