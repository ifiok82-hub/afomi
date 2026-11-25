import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, EscrowStatusBadge, PiValue } from '../components/AfomiUI';
import { EscrowStatus, EscrowTransaction } from '../types/afomi';

export const EscrowWalletPage: React.FC = () => {
  const {
    availableBalance,
    lockedEscrowBalance,
    totalEarned,
    escrowTransactions,
    adminSettings,
    navigate,
  } = useAfomi();

  const [tab, setTab] = useState<'ALL' | EscrowStatus>('ALL');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<EscrowTransaction | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return escrowTransactions.filter((tx) => {
      const statusOk = tab === 'ALL' || tx.status === tab;
      const qOk =
        !q ||
        tx.title.toLowerCase().includes(q) ||
        tx.counterparty.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q);
      return statusOk && qOk;
    });
  }, [escrowTransactions, tab, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">AFOMI Escrow Safe Box</h1>
          <p className="text-sm text-[#645E72] mt-1">
            Workers and sellers are never paid directly. Every Pi passes through AFOMI Escrow protection.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('wallet')}
          className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] bg-white text-xs font-bold text-[#1A1625] cursor-pointer self-start"
        >
          Go to Main Wallet
        </button>
      </div>

      {/* 3 Core Balances */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
          <div className="text-xs text-[#645E72] font-medium">Available Balance</div>
          <div className="text-2xl font-extrabold text-[#1A1625] tabular-nums mt-1">
            {availableBalance.toFixed(2)} Pi
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">Ready to spend or withdraw</p>
        </div>
        <div className="rounded-2xl bg-[#6A1B9A] text-white p-5">
          <div className="text-xs text-purple-100 font-medium flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#FFC107]" />
            <span>Locked in Escrow</span>
          </div>
          <div className="text-2xl font-extrabold tabular-nums mt-1">{lockedEscrowBalance.toFixed(2)} Pi</div>
          <p className="text-[11px] text-purple-100 mt-1">Held safely until approval or delivery</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
          <div className="text-xs text-[#645E72] font-medium">Total Earned</div>
          <div className="text-2xl font-extrabold text-[#6A1B9A] tabular-nums mt-1">
            {totalEarned.toFixed(2)} Pi
          </div>
          <p className="text-[11px] text-[#645E72] mt-1">
            Lifetime {100 - adminSettings.afomiFeePercent}% net worker &amp; seller payouts
          </p>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#645E72] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search escrow records by task, product, or counterparty..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['ALL', 'LOCKED', 'RELEASED', 'REFUNDED', 'PENDING REVIEW'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setTab(status)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                tab === status
                  ? 'bg-[#6A1B9A] text-white'
                  : 'bg-white border border-[#E7E3EE] text-[#645E72]'
              }`}
            >
              {status === 'ALL' ? 'All Transactions' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Escrow Transaction History */}
      <div className="rounded-2xl bg-white border border-[#E7E3EE] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#645E72]">
            No escrow transactions yet.
          </div>
        ) : (
          <div className="divide-y divide-[#F1EEF6]">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8FC] transition-colors"
              >
                <div>
                  <div className="text-xs text-[#645E72] tabular-nums">
                    {tx.date} · {tx.type} · {tx.counterparty}
                  </div>
                  <div className="text-sm font-bold text-[#1A1625] mt-0.5">{tx.title}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right tabular-nums">
                    <div className="text-sm font-extrabold text-[#1A1625]">{tx.grossAmountPi.toFixed(2)} Pi</div>
                    <div className="text-[11px] text-[#645E72]">Net: {tx.netAmountPi.toFixed(2)} Pi</div>
                  </div>
                  <EscrowStatusBadge status={tx.status} />
                  <button
                    type="button"
                    onClick={() => setSelectedTx(tx)}
                    className="min-h-[36px] px-3 rounded-lg border border-[#E7E3EE] text-xs font-semibold text-[#6A1B9A] hover:bg-[#F5EEFA] cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <EscrowStatusBadge status={selectedTx.status} />
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg hover:bg-[#FAF8FC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="text-xs text-[#645E72]">{selectedTx.type} · {selectedTx.date}</div>
              <h3 className="text-lg font-extrabold text-[#1A1625] mt-0.5">{selectedTx.title}</h3>
            </div>
            <div className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#645E72]">Gross Amount</span>
                <span className="font-bold tabular-nums">{selectedTx.grossAmountPi.toFixed(2)} Pi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#645E72]">AFOMI Fee (8%)</span>
                <span className="font-bold tabular-nums">{selectedTx.afomiFeePi.toFixed(2)} Pi</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E7E3EE]">
                <span className="font-bold text-[#1A1625]">Net Payout (92%)</span>
                <span className="font-extrabold text-[#6A1B9A] tabular-nums">{selectedTx.netAmountPi.toFixed(2)} Pi</span>
              </div>
            </div>
            <p className="text-xs text-[#645E72] leading-relaxed">{selectedTx.notes}</p>
            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full min-h-[44px] rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const WalletPage: React.FC = () => {
  const {
    user,
    availableBalance,
    lockedEscrowBalance,
    totalEarned,
    walletTransactions,
    withdrawPi,
    topUpDemoPi,
    navigate,
  } = useAfomi();

  const [filter, setFilter] = useState<'All' | 'Completed' | 'Pending' | 'Failed' | 'Locked in Escrow'>('All');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amt, setAmt] = useState(15);
  const [addr, setAddr] = useState(user?.piWalletAddress || user?.piUsername || '@afomi_testnet');
  const [err, setErr] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'All') return walletTransactions;
    return walletTransactions.filter((w) => w.status === filter);
  }, [walletTransactions, filter]);

  const totalSpent = useMemo(
    () =>
      walletTransactions
        .filter((w) => w.direction === 'debit' && w.status !== 'Failed')
        .reduce((s, w) => s + w.amountPi, 0),
    [walletTransactions]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">Pi Testnet Wallet</h1>
          <p className="text-sm text-[#645E72] mt-1">Manage your Testnet Pi, withdrawals, and Escrow ledger.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => topUpDemoPi(50)}
            className="min-h-[42px] px-4 rounded-xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+50 Testnet Pi</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('escrow')}
            className="min-h-[42px] px-4 rounded-xl border border-[#6A1B9A] text-[#6A1B9A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Escrow Wallet</span>
          </button>
        </div>
      </div>

      {/* Balance & History Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#6A1B9A] text-white p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-purple-100">Available Pi Balance</div>
            <PiValue amount={availableBalance} showNaira className="text-3xl font-extrabold text-white mt-1 block" />
          </div>
          <button
            type="button"
            onClick={() => {
              setErr('');
              setWithdrawOpen(true);
            }}
            className="mt-4 w-full min-h-[44px] rounded-xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] text-xs font-bold cursor-pointer"
          >
            Withdraw Pi
          </button>
        </div>
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-6">
          <div className="text-xs text-[#645E72]">Total Earnings History</div>
          <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">+{totalEarned.toFixed(2)} Pi</div>
          <p className="text-xs text-[#645E72] mt-2">Includes approved micro-tasks &amp; shop deliveries</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-6">
          <div className="text-xs text-[#645E72]">Spending &amp; Locked Escrow</div>
          <div className="text-2xl font-extrabold text-[#1A1625] tabular-nums mt-1">{totalSpent.toFixed(2)} Pi</div>
          <p className="text-xs text-[#6A1B9A] font-semibold mt-2 tabular-nums">
            Currently Locked in Escrow: {lockedEscrowBalance.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['All', 'Completed', 'Pending', 'Failed', 'Locked in Escrow'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              filter === status
                ? 'bg-[#6A1B9A] text-white'
                : 'bg-white border border-[#E7E3EE] text-[#645E72]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Wallet Transactions */}
      <div className="rounded-2xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#645E72]">
            No wallet transactions yet.
          </div>
        ) : (
          filtered.map((w) => (
            <div key={w.id} className="p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    w.direction === 'credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F5EEFA] text-[#6A1B9A]'
                  }`}
                >
                  {w.direction === 'credit' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <div className="text-sm font-bold text-[#1A1625]">{w.label}</div>
                  <div className="text-xs text-[#645E72] tabular-nums">{w.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-extrabold tabular-nums ${
                    w.direction === 'credit' ? 'text-emerald-700' : 'text-[#1A1625]'
                  }`}
                >
                  {w.direction === 'credit' ? '+' : '-'}
                  {w.amountPi.toFixed(2)} Pi
                </span>
                <EscrowStatusBadge status={w.status} />
              </div>
            </div>
          ))
        )}
      </div>

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-[#1A1625]">Withdraw Testnet Pi</h3>
            <p className="text-xs text-[#645E72] tabular-nums">
              Available: {availableBalance.toFixed(2)} Pi (Escrow funds stay protected until completion)
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">Pi Testnet Address / Username</label>
              <input
                type="text"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Amount (0.1–1000 Pi)</label>
              <input
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                value={amt}
                onChange={(e) => setAmt(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm tabular-nums"
              />
            </div>
            {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const res = withdrawPi(amt, addr);
                  if (res.ok) setWithdrawOpen(false);
                  else setErr(res.message);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
              >
                Send Pi
              </button>
              <button
                type="button"
                onClick={() => setWithdrawOpen(false)}
                className="min-h-[44px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const {
    user,
    isCeo,
    isAdminUnlocked,
    piAuthLoading,
    loginWithPi,
    navigate,
    logout,
    deleteMyAccount,
    resetDemoData,
  } = useAfomi();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const links = [
    { label: 'My Tasks', sub: 'Browse tasks & track submitted work', icon: CheckCircle2, route: 'tasks' as const },
    { label: 'My Orders', sub: 'Confirm delivery & Escrow protection', icon: ShoppingBag, route: 'market' as const },
    { label: 'My Subscriptions', sub: 'Active monthly & weekly plans', icon: CreditCard, route: 'subscriptions' as const },
    { label: 'Escrow Wallet', sub: 'Audit Locked, Released & Refunded Pi', icon: Lock, route: 'escrow' as const },
    { label: 'My Shop / Seller Hub', sub: 'Manage products & seller payouts', icon: Store, route: 'shop' as const },
    { label: 'AFOMI Learn', sub: 'Courses & verified certificates', icon: Award, route: 'learn' as const },
    { label: 'Admin / Reviewer Panel', sub: 'Approve tasks & resolve disputes', icon: ShieldCheck, route: 'admin' as const },
  ];

  const supportLinks = [
    { label: 'Help & FAQ', sub: 'Escrow rules, appeals & support@afomi.app', icon: HelpCircle, route: 'help' as const },
    { label: 'Privacy Policy', sub: 'How we protect & never sell your data', icon: Shield, route: 'privacy' as const },
    { label: 'Terms of Service', sub: 'Escrow, refunds, disputes & Testnet rules', icon: FileText, route: 'terms' as const },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#E7E3EE] shrink-0">
            <AfomiImage src={user?.avatar} alt={user?.name || 'User'} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#1A1625]">{user?.name || 'Amara Nwosu'}</h1>
              {user?.kycVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>KYC Verified</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('kyc')}
                  className="text-xs font-bold text-[#2B1F00] bg-[#FFC107] px-2.5 py-0.5 rounded-lg cursor-pointer"
                >
                  Complete KYC
                </button>
              )}
            </div>
            <p className="text-xs text-[#645E72] mt-1">
              {user?.email || 'amara@afomi.app'} · {user?.city}, {user?.country}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#645E72]">
              <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {(user?.rating || 4.9).toFixed(1)} Rating
              </span>
              <span>·</span>
              <span>{(user?.skills || []).join(' · ')}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('kyc')}
          className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold text-[#1A1625] inline-flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Edit KYC</span>
        </button>
      </div>

      {/* Pi Testnet Authentication Status */}
      <div className="rounded-3xl bg-white border border-[#E7E3EE] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-[#1A1625]">Pi Network Account (TESTNET)</span>
            {user?.piAuthenticated ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Not Connected
              </span>
            )}
          </div>
          {user?.piAuthenticated ? (
            <p className="text-xs text-[#645E72] tabular-nums">
              Username: <strong className="text-[#1A1625]">{user.piUsername}</strong> · UID: {user.piUid} · Wallet:{' '}
              {user.piWalletAddress ? `${user.piWalletAddress.slice(0, 10)}...` : 'Testnet'}
            </p>
          ) : (
            <p className="text-xs text-[#645E72]">
              Authenticate with Pi Testnet (username, payments, wallet_address) to unlock Escrow payments.
            </p>
          )}
        </div>
        {!user?.piAuthenticated && (
          <button
            type="button"
            disabled={piAuthLoading}
            onClick={() => loginWithPi()}
            className="min-h-[42px] px-4 rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            {piAuthLoading ? 'Authenticating...' : 'Login with Pi'}
          </button>
        )}
      </div>

      {/* CEO / ADMIN MANAGEMENT DASHBOARD ACCESS */}
      {(isCeo || isAdminUnlocked) && (
        <div className="rounded-3xl bg-[#6A1B9A] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#FFC107]">
              <Sparkles className="w-4 h-4" />
              <span>Executive &amp; Admin Access ({user?.email || 'Admin PIN'})</span>
            </div>
            <h2 className="text-xl font-extrabold mt-1">AFOMI Executive &amp; Admin Suite</h2>
            <p className="text-xs text-purple-100 mt-0.5">
              Full Admin Management Dashboard, Escrow controls, CEO AI assistant, and Audit Log.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('admin-dashboard')}
              className="min-h-[46px] px-5 rounded-2xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] font-bold text-sm whitespace-nowrap cursor-pointer"
            >
              Admin Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('ceo')}
              className="min-h-[46px] px-5 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-sm whitespace-nowrap cursor-pointer"
            >
              CEO AI
            </button>
          </div>
        </div>
      )}

      {/* Profile Links */}
      <div className="rounded-3xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6] overflow-hidden">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.route)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-[#FAF8FC] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-[#F5EEFA] text-[#6A1B9A] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-sm font-bold text-[#1A1625]">{item.label}</div>
                  <div className="text-xs text-[#645E72]">{item.sub}</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6A1B9A]">Open →</span>
            </button>
          );
        })}
      </div>

      {/* Help & Legal Links */}
      <div className="rounded-3xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6] overflow-hidden">
        {supportLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.route)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-[#FAF8FC] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-10 h-10 rounded-xl bg-[#FAF8FC] text-[#1A1625] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-sm font-bold text-[#1A1625]">{item.label}</div>
                  <div className="text-xs text-[#645E72]">{item.sub}</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#6A1B9A]">View →</span>
            </button>
          );
        })}
      </div>

      {/* Account Settings Actions */}
      <div className="rounded-3xl bg-white border border-[#E7E3EE] p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[#1A1625]">Account Settings</h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={resetDemoData}
              className="min-h-[44px] px-4 rounded-xl border border-[#E7E3EE] bg-white text-xs font-semibold text-[#645E72] inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Data</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="min-h-[44px] px-4 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-rose-700 inline-flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Account</span>
            </button>
          </div>
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] px-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Delete My Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-extrabold">Delete My Account</h3>
            </div>
            <p className="text-xs text-[#645E72] leading-relaxed">
              This permanently removes your AFOMI profile, KYC information, Pi Testnet session link, and local workspace data. This action cannot be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  await deleteMyAccount();
                  setDeleting(false);
                  setDeleteModalOpen(false);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {deleting ? 'Deleting Account...' : 'Confirm Permanent Deletion'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOpen(false)}
                className="min-h-[44px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminPanelPage: React.FC = () => {
  const {
    submissions,
    orders,
    lockedEscrowBalance,
    afomiCommissionEarned,
    reviewTaskSubmission,
    autoApproveSubmission48h,
    resolveOrderDispute,
  } = useAfomi();

  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const pendingSubs = submissions.filter((s) => s.status === 'PENDING REVIEW');
  const disputedOrders = orders.filter((o) => o.status === 'DISPUTED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">Admin &amp; Escrow Reviewer Panel</h1>
        <p className="text-sm text-[#645E72] mt-1">
          Approve or reject task submissions, trigger 48h auto-approvals, and resolve marketplace disputes.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
          <div className="text-xs text-[#645E72]">Pending Task Reviews</div>
          <div className="text-2xl font-extrabold text-[#6A1B9A] tabular-nums mt-1">{pendingSubs.length}</div>
        </div>
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
          <div className="text-xs text-[#645E72]">Escrow Locked Funds</div>
          <div className="text-2xl font-extrabold text-[#1A1625] tabular-nums mt-1">
            {lockedEscrowBalance.toFixed(2)} Pi
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
          <div className="text-xs text-[#645E72]">Commission Earned (8%)</div>
          <div className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
            {afomiCommissionEarned.toFixed(2)} Pi
          </div>
        </div>
      </div>

      {/* Pending Submissions */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1625]">Pending Task Submissions ({pendingSubs.length})</h2>
        {pendingSubs.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-6 text-sm text-[#645E72]">
            All submitted tasks have been reviewed!
          </div>
        ) : (
          pendingSubs.map((sub) => (
            <div key={sub.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-[#645E72]">
                    {sub.workerName} · {sub.submittedAt} ·{' '}
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                      <Clock className="w-3 h-3" /> {sub.hoursRemaining48h}h left
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1A1625]">{sub.taskTitle}</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F5EEFA] text-[#6A1B9A] tabular-nums">
                  AI Score: {sub.aiScore}% {sub.aiVerdict} ({sub.aiSuggestion})
                </span>
              </div>

              <p className="text-xs text-[#1A1625] bg-[#FAF8FC] p-3 rounded-xl border border-[#F1EEF6]">
                {sub.submissionText}
              </p>
              <p className="text-xs text-[#645E72]">AI Note: {sub.aiReason}</p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => reviewTaskSubmission(sub.id, 'APPROVE')}
                  className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  APPROVE (Release +{sub.workerNetPay.toFixed(2)} Pi)
                </button>
                <button
                  type="button"
                  onClick={() => autoApproveSubmission48h(sub.id)}
                  className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold text-[#1A1625] cursor-pointer"
                >
                  Simulate 48h Auto-Approve
                </button>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={rejectReasons[sub.id] || ''}
                    onChange={(e) => setRejectReasons((r) => ({ ...r, [sub.id]: e.target.value }))}
                    placeholder="Reason for rejection..."
                    className="flex-1 min-h-[42px] px-3 rounded-xl border border-[#E7E3EE] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => reviewTaskSubmission(sub.id, 'REJECT', rejectReasons[sub.id])}
                    className="min-h-[42px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    REJECT
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Active Disputes */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#1A1625]">Marketplace Disputes ({disputedOrders.length})</h2>
        {disputedOrders.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-6 text-sm text-[#645E72]">
            No active marketplace disputes.
          </div>
        ) : (
          disputedOrders.map((ord) => (
            <div key={ord.id} className="rounded-2xl bg-white border border-rose-200 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-[#645E72]">
                    Order #{ord.id} · Buyer: {ord.buyerName} · Seller: {ord.sellerName}
                  </div>
                  <h3 className="text-base font-bold text-[#1A1625]">{ord.productName}</h3>
                </div>
                <span className="text-sm font-extrabold text-[#6A1B9A] tabular-nums">
                  {ord.totalPi.toFixed(2)} Pi Locked
                </span>
              </div>
              <p className="text-xs text-rose-800 bg-rose-50 p-3 rounded-xl">{ord.disputeReason}</p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => resolveOrderDispute(ord.id, 'REFUND_BUYER')}
                  className="min-h-[42px] px-4 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                >
                  Refund Buyer ({ord.totalPi.toFixed(2)} Pi)
                </button>
                <button
                  type="button"
                  onClick={() => resolveOrderDispute(ord.id, 'RELEASE_SELLER')}
                  className="min-h-[42px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  Release to Seller ({ord.sellerNetPi.toFixed(2)} Pi)
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};
