import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, EscrowStatusBadge } from '../components/AfomiUI';
import { CeoDashboardScreen } from './CeoDashboardScreen';
import { UserProfile } from '../types/afomi';

type AdminTab =
  | 'overview'
  | 'users'
  | 'tasks'
  | 'marketplace'
  | 'escrow'
  | 'subscriptions'
  | 'ceo'
  | 'settings'
  | 'audit';

export const AdminDashboardScreen: React.FC = () => {
  const {
    isAdminUnlocked,
    adminUsers,
    tasks,
    submissions,
    products,
    orders,
    escrowTransactions,
    activeSubscriptions,
    lockedEscrowBalance,
    afomiCommissionEarned,
    adminSettings,
    auditLogs,
    reports,
    navigate,
    lockAdminSession,
    toggleUserKyc,
    toggleUserSuspend,
    deleteAdminUser,
    reviewTaskSubmission,
    deleteTaskByAdmin,
    toggleProductVisibility,
    resolveOrderDispute,
    releaseEscrowByAdmin,
    refundEscrowByAdmin,
    cancelSubscription,
    refundSubscriptionByAdmin,
    updateAdminSettings,
    toggleDemoMode,
    addAuditLog,
    showToast,
  } = useAfomi();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [taskRejectReason, setTaskRejectReason] = useState<Record<string, string>>({});

  // Settings form state
  const [newPin, setNewPin] = useState('');
  const [feePercent, setFeePercent] = useState(adminSettings.afomiFeePercent);
  const [autoHours, setAutoHours] = useState(adminSettings.autoApproveHours);
  const [appNameInput, setAppNameInput] = useState(adminSettings.appName);
  const [logoInput, setLogoInput] = useState(adminSettings.logoUrl);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return adminUsers;
    return adminUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.piUsername || '').toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q)
    );
  }, [adminUsers, userSearch]);

  if (!isAdminUnlocked) {
    return (
      <div className="max-w-lg mx-auto rounded-3xl bg-white border border-[#E7E3EE] p-8 text-center space-y-4">
        <Lock className="w-10 h-10 text-[#6A1B9A] mx-auto" />
        <h1 className="text-xl font-extrabold text-[#1A1625]">Admin Access Required</h1>
        <p className="text-sm text-[#645E72]">
          Please authenticate via Admin PIN or CEO credentials to view the Admin Management Dashboard.
        </p>
        <button
          type="button"
          onClick={() => navigate('home')}
          className="min-h-[44px] px-6 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  const pendingDisputes = orders.filter((o) => o.status === 'DISPUTED');
  const activeSubsCount = activeSubscriptions.filter((s) => s.status === 'ACTIVE').length;
  const totalEscrowDisplay = Number((lockedEscrowBalance + (adminSettings.demoMode ? 1482.5 : 0)).toFixed(2));

  const exportEscrowCsv = () => {
    const header = ['ID', 'Date', 'Title', 'Type', 'Gross Pi', 'AFOMI Fee Pi', 'Net Pi', 'Status', 'Counterparty'];
    const rows = escrowTransactions.map((tx) => [
      tx.id,
      tx.date,
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.type,
      tx.grossAmountPi.toFixed(2),
      tx.afomiFeePi.toFixed(2),
      tx.netAmountPi.toFixed(2),
      tx.status,
      `"${tx.counterparty.replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'afomi-escrow-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
    addAuditLog('Exported Escrow Control transactions to CSV');
    showToast('Escrow ledger exported to CSV.', 'success');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim()) {
      try {
        const res = await fetch('/api/admin/change-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPin: newPin.trim() }),
        });
        const data = (await res.json()) as { ok?: boolean; message?: string };
        if (!res.ok || !data.ok) {
          showToast(data.message || 'PIN must be 4 digits.', 'error');
          return;
        }
        addAuditLog('Changed Admin Access 4-digit PIN');
        setNewPin('');
      } catch {
        showToast('Failed to update PIN on server.', 'error');
        return;
      }
    }
    updateAdminSettings({
      afomiFeePercent: Math.min(30, Math.max(1, Number(feePercent) || 8)),
      autoApproveHours: Math.min(168, Math.max(1, Number(autoHours) || 48)),
      appName: appNameInput.trim() || 'AFOMI',
      logoUrl: logoInput.trim() || adminSettings.logoUrl,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setLogoInput(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'overview', label: 'A) Overview' },
    { id: 'users', label: `B) Users (${adminUsers.length})` },
    { id: 'tasks', label: `C) Tasks (${tasks.length})` },
    { id: 'marketplace', label: `D) Marketplace (${products.length})` },
    { id: 'escrow', label: `E) Escrow Control (${escrowTransactions.length})` },
    { id: 'subscriptions', label: `F) Subscriptions (${activeSubscriptions.length})` },
    { id: 'ceo', label: 'G) CEO AI' },
    { id: 'settings', label: 'H) Settings' },
    { id: 'audit', label: `I) Audit Log (${auditLogs.length})` },
  ];

  const chartData = [
    { label: 'Tasks', val: tasks.length * 14 || 12 },
    { label: 'Orders', val: orders.length * 25 || 15 },
    { label: 'Subs', val: activeSubsCount * 30 || 10 },
    { label: 'Escrow', val: Math.min(100, Math.round(lockedEscrowBalance + 25)) },
  ];

  return (
    <div className="space-y-6">
      {/* TESTNET MODE BANNER */}
      <div className="rounded-2xl bg-[#FFF8E1] border border-[#FFC107] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#2B1F00]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>TESTNET MODE - No real Pi is moved</span>
        </div>
        <div className="flex items-center gap-2">
          {adminSettings.maintenanceMode && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold">
              MAINTENANCE ON
            </span>
          )}
          <button
            type="button"
            onClick={lockAdminSession}
            className="min-h-[34px] px-3 rounded-lg bg-[#1A1625] text-white text-xs font-semibold cursor-pointer"
          >
            Exit Admin View
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">
            Admin Management Dashboard
          </h1>
          <p className="text-xs text-[#645E72] mt-1">
            Full platform control across Users, Tasks, Marketplace, Escrow, Subscriptions, CEO AI, Settings &amp; Audit Logs.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              tab === t.id
                ? 'bg-[#6A1B9A] text-white'
                : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* A) OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total Users', value: adminUsers.length },
              { label: 'Total Tasks', value: tasks.length },
              { label: 'Total Orders', value: orders.length },
              { label: 'Locked Escrow', value: `${totalEscrowDisplay.toFixed(1)} Pi` },
              { label: 'Commission', value: `${afomiCommissionEarned.toFixed(1)} Pi` },
              { label: 'Disputes', value: pendingDisputes.length },
              { label: 'Active Subs', value: activeSubsCount },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white border border-[#E7E3EE] p-4">
                <div className="text-[11px] text-[#645E72]">{stat.label}</div>
                <div className="text-xl font-extrabold text-[#1A1625] tabular-nums mt-1">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
              <h2 className="text-base font-bold text-[#1A1625]">Platform Volume Breakdown</h2>
              <p className="text-xs text-[#645E72]">Live activity index across core modules</p>
              <div className="h-44 flex items-end justify-between gap-4 pt-6">
                {chartData.map((d) => (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-[#6A1B9A] tabular-nums">{d.val}</span>
                    <div className="w-full max-w-[54px] bg-[#F3EBF9] rounded-t-xl h-28 flex items-end">
                      <div
                        style={{ height: `${Math.min(100, Math.max(12, d.val))}%` }}
                        className="w-full bg-[#6A1B9A] rounded-t-xl"
                      />
                    </div>
                    <span className="text-xs text-[#645E72]">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-3">
              <h2 className="text-base font-bold text-[#1A1625]">Flagged User Reports ({reports.length})</h2>
              {reports.length === 0 ? (
                <p className="text-xs text-[#645E72] py-8 text-center">
                  No flagged tasks or products reported yet.
                </p>
              ) : (
                <div className="divide-y divide-[#F1EEF6] text-xs">
                  {reports.map((r) => (
                    <div key={r.id} className="py-2.5">
                      <div className="font-bold text-[#1A1625]">
                        [{r.targetType.toUpperCase()}] {r.targetTitle}
                      </div>
                      <div className="text-[#645E72] mt-0.5">
                        Reason: {r.reason} · By {r.reportedBy}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* B) USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#645E72] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search users by name, email, Pi username, or country..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white border border-[#E7E3EE] text-sm"
            />
          </div>

          <div className="rounded-2xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6]">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#E7E3EE] shrink-0">
                    <AfomiImage src={u.avatar} alt={u.name} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#1A1625]">{u.name}</span>
                      {u.kycVerified && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          KYC Verified
                        </span>
                      )}
                      {u.suspended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Suspended
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#645E72] tabular-nums">
                      {u.email} · {u.piUsername || 'No Pi Linked'} · {u.city}, {u.country} · Balance:{' '}
                      <span className="font-bold text-[#6A1B9A]">{(u.balancePi ?? 0).toFixed(2)} Pi</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingUser(u)}
                    className="min-h-[36px] px-3 rounded-lg border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleUserKyc(u.id)}
                    className="min-h-[36px] px-3 rounded-lg bg-[#F5EEFA] text-[#6A1B9A] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{u.kycVerified ? 'Unverify KYC' : 'Verify KYC'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleUserSuspend(u.id)}
                    className="min-h-[36px] px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>{u.suspended ? 'Activate' : 'Suspend'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAdminUser(u.id)}
                    className="min-h-[36px] px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* C) TASKS */}
      {tab === 'tasks' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1A1625]">
              Pending Submissions ({submissions.filter((s) => s.status === 'PENDING REVIEW').length})
            </h2>
            {submissions.filter((s) => s.status === 'PENDING REVIEW').map((sub) => (
              <div key={sub.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="text-xs text-[#645E72]">
                      {sub.workerName} · {sub.taskTitle}
                    </div>
                    <p className="text-xs text-[#1A1625] mt-1">{sub.submissionText}</p>
                  </div>
                  <EscrowStatusBadge status={sub.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => reviewTaskSubmission(sub.id, 'APPROVE')}
                    className="min-h-[38px] px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Approve &amp; Release (+{sub.workerNetPay.toFixed(2)} Pi)
                  </button>
                  <input
                    type="text"
                    value={taskRejectReason[sub.id] || ''}
                    onChange={(e) => setTaskRejectReason((r) => ({ ...r, [sub.id]: e.target.value }))}
                    placeholder="Reject reason..."
                    className="min-h-[38px] px-3 rounded-xl border border-[#E7E3EE] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => reviewTaskSubmission(sub.id, 'REJECT', taskRejectReason[sub.id])}
                    className="min-h-[38px] px-3.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Reject &amp; Refund
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1A1625]">All Tasks &amp; Escrow ({tasks.length})</h2>
            <div className="rounded-2xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6]">
              {tasks.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#1A1625]">{t.title}</div>
                    <div className="text-xs text-[#645E72] tabular-nums">
                      {t.category} · {t.postedBy} · Escrow Locked: {t.totalBudgetLocked.toFixed(2)} Pi (+{t.afomiFeeLocked.toFixed(2)} Pi fee) · Spots: {t.spotsLeft}/{t.totalWorkers}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTaskByAdmin(t.id)}
                    className="min-h-[36px] px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 self-start cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Scam Task</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* D) MARKETPLACE */}
      {tab === 'marketplace' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1A1625]">All Marketplace Products ({products.length})</h2>
            <div className="rounded-2xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6]">
              {products.map((p) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E7E3EE] shrink-0">
                      <AfomiImage src={p.image} alt={p.name} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1A1625]">
                        {p.name} {p.hidden && <span className="text-rose-600 text-xs">(Hidden)</span>}
                      </div>
                      <div className="text-xs text-[#645E72] tabular-nums">
                        {p.sellerName} · {p.pricePi.toFixed(2)} Pi · Stock: {p.stock}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleProductVisibility(p.id)}
                    className={`min-h-[38px] px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                      p.hidden
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-[#1A1625]'
                    }`}
                  >
                    {p.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{p.hidden ? 'Approve & Show' : 'Hide Product'}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#1A1625]">Marketplace Orders &amp; Disputes ({orders.length})</h2>
            {orders.map((ord) => (
              <div key={ord.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#1A1625]">
                    {ord.productName} · {ord.totalPi.toFixed(2)} Pi
                  </div>
                  <div className="text-xs text-[#645E72]">
                    Buyer: {ord.buyerName} → Seller: {ord.sellerName}
                  </div>
                  {ord.disputeReason && (
                    <p className="text-xs text-rose-700 mt-1">Dispute: {ord.disputeReason}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EscrowStatusBadge status={ord.status} />
                  {ord.status === 'DISPUTED' && (
                    <>
                      <button
                        type="button"
                        onClick={() => resolveOrderDispute(ord.id, 'REFUND_BUYER')}
                        className="min-h-[36px] px-3 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Refund Buyer
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveOrderDispute(ord.id, 'RELEASE_SELLER')}
                        className="min-h-[36px] px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Release Seller
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* E) ESCROW CONTROL */}
      {tab === 'escrow' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1A1625]">Escrow Control Ledger</h2>
              <p className="text-xs text-[#645E72] tabular-nums">
                Currently Locked: {lockedEscrowBalance.toFixed(2)} Pi · Fee Rate: {adminSettings.afomiFeePercent}%
              </p>
            </div>
            <button
              type="button"
              onClick={exportEscrowCsv}
              className="min-h-[40px] px-4 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6]">
            {escrowTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#645E72] tabular-nums">
                    {tx.date} · {tx.type} · {tx.counterparty}
                  </div>
                  <div className="text-sm font-bold text-[#1A1625]">{tx.title}</div>
                  <div className="text-xs text-[#645E72] tabular-nums">
                    Gross: {tx.grossAmountPi.toFixed(2)} Pi · Fee: {tx.afomiFeePi.toFixed(2)} Pi · Net: {tx.netAmountPi.toFixed(2)} Pi
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <EscrowStatusBadge status={tx.status} />
                  {(tx.status === 'LOCKED' || tx.status === 'PENDING REVIEW') && (
                    <>
                      <button
                        type="button"
                        onClick={() => releaseEscrowByAdmin(tx.id)}
                        className="min-h-[36px] px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Release
                      </button>
                      <button
                        type="button"
                        onClick={() => refundEscrowByAdmin(tx.id)}
                        className="min-h-[36px] px-3 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Refund
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* F) SUBSCRIPTIONS */}
      {tab === 'subscriptions' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#1A1625]">Active Subscriptions ({activeSubscriptions.length})</h2>
          {activeSubscriptions.map((sub) => (
            <div key={sub.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#1A1625]">{sub.title}</div>
                <div className="text-xs text-[#645E72] tabular-nums">
                  {sub.providerName} · {sub.periodLabel} · Next Billing: {sub.nextPaymentDate}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EscrowStatusBadge status={sub.status === 'CANCELLED' ? 'REFUNDED' : sub.escrowStatus} />
                {sub.status === 'ACTIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => cancelSubscription(sub.id)}
                      className="min-h-[36px] px-3 rounded-lg border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => refundSubscriptionByAdmin(sub.id)}
                      className="min-h-[36px] px-3 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Refund Cycle
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* G) CEO AI */}
      {tab === 'ceo' && <CeoDashboardScreen />}

      {/* H) SETTINGS */}
      {tab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleSaveSettings} className="rounded-3xl bg-white border border-[#E7E3EE] p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#1A1625]">Platform &amp; Escrow Settings</h2>

            <div>
              <label className="block text-xs font-semibold mb-1">App Name</label>
              <input
                type="text"
                value={appNameInput}
                onChange={(e) => setAppNameInput(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">AFOMI Fee (%)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={feePercent}
                  onChange={(e) => setFeePercent(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Auto-Approve Hours</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={autoHours}
                  onChange={(e) => setAutoHours(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Change Admin PIN (4 digits)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Leave blank to keep current PIN"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Upload Custom Logo</label>
              <div className="flex items-center gap-3">
                <img src={logoInput} alt="Logo preview" className="w-12 h-12 rounded-xl object-contain border border-[#E7E3EE]" />
                <label className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] bg-[#FAF8FC] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-[#6A1B9A]" />
                  <span>Upload Logo</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] rounded-2xl bg-[#6A1B9A] text-white text-sm font-bold cursor-pointer"
            >
              Save Admin Settings
            </button>
          </form>

          <div className="space-y-4">
            <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-[#1A1625]">System Toggles</h2>

              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE]">
                <div>
                  <div className="text-sm font-bold text-[#1A1625]">Maintenance Mode</div>
                  <div className="text-xs text-[#645E72]">
                    Temporarily pause public transactions while upgrading.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateAdminSettings({ maintenanceMode: !adminSettings.maintenanceMode })}
                  className={`min-h-[40px] px-4 rounded-xl text-xs font-bold cursor-pointer ${
                    adminSettings.maintenanceMode
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-[#E7E3EE] text-[#1A1625]'
                  }`}
                >
                  {adminSettings.maintenanceMode ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE]">
                <div>
                  <div className="text-sm font-bold text-[#1A1625]">Demo Mode Data</div>
                  <div className="text-xs text-[#645E72]">
                    When OFF, shows clean production empty states (&quot;No tasks yet&quot;).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDemoMode(!adminSettings.demoMode)}
                  className={`min-h-[40px] px-4 rounded-xl text-xs font-bold cursor-pointer ${
                    adminSettings.demoMode
                      ? 'bg-[#6A1B9A] text-white'
                      : 'bg-white border border-[#E7E3EE] text-[#1A1625]'
                  }`}
                >
                  {adminSettings.demoMode ? 'DEMO ON' : 'DEMO OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* I) AUDIT LOG */}
      {tab === 'audit' && (
        <div className="rounded-2xl bg-white border border-[#E7E3EE] divide-y divide-[#F1EEF6]">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-[#6A1B9A]">{log.adminName}</span>
                <span className="text-[#1A1625] ml-2">{log.action}</span>
              </div>
              <span className="text-[#645E72] tabular-nums whitespace-nowrap">{log.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* View User Profile Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#1A1625]">User Details</h3>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="p-1.5 rounded-lg hover:bg-[#FAF8FC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div><span className="font-bold">Name:</span> {viewingUser.name}</div>
              <div><span className="font-bold">Email:</span> {viewingUser.email}</div>
              <div><span className="font-bold">Pi Username:</span> {viewingUser.piUsername || 'Not connected'}</div>
              <div><span className="font-bold">Pi Wallet:</span> {viewingUser.piWalletAddress || 'N/A'}</div>
              <div><span className="font-bold">Location:</span> {viewingUser.city}, {viewingUser.country}</div>
              <div><span className="font-bold">Balance:</span> {(viewingUser.balancePi ?? 0).toFixed(2)} Pi</div>
              <div><span className="font-bold">Skills:</span> {viewingUser.skills.join(', ')}</div>
            </div>
            <button
              type="button"
              onClick={() => setViewingUser(null)}
              className="w-full min-h-[42px] rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
