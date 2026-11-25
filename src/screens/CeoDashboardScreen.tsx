import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Lock,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, EscrowStatusBadge } from '../components/AfomiUI';
import { CEO_CHAT_CHIPS } from '../data/seedData';

export const CeoDashboardScreen: React.FC = () => {
  const {
    isCeo,
    user,
    tasks,
    products,
    orders,
    submissions,
    lockedEscrowBalance,
    afomiCommissionEarned,
    supportTickets,
    ceoChat,
    ceoBriefingVersion,
    refreshCeoBriefing,
    sendCeoChat,
    reviewTaskSubmission,
    resolveOrderDispute,
    sendSupportReply,
    navigate,
    showToast,
  } = useAfomi();

  const [section, setSection] = useState<
    'overview' | 'chat' | 'reviewer' | 'money' | 'content' | 'support'
  >('overview');
  const [chatInput, setChatInput] = useState('');
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<{ title: string; body: string }>({
    title: 'Marketing Post',
    body: 'Earn Pi with your own hand on AFOMI! Complete verified micro-tasks, shop African goods, and subscribe to weekly food packs—with 100% of funds protected in AFOMI Escrow until approved. Join thousands of builders across Lagos, Accra & Nairobi today.',
  });
  const [copied, setCopied] = useState(false);
  const [draftOverrides, setDraftOverrides] = useState<Record<string, string>>({});
  const [reportModalOpen, setReportModalOpen] = useState(false);

  if (!isCeo) {
    return (
      <div className="max-w-lg mx-auto rounded-3xl bg-white border border-[#E7E3EE] p-8 text-center space-y-4">
        <Lock className="w-10 h-10 text-[#6A1B9A] mx-auto" />
        <h1 className="text-xl font-extrabold text-[#1A1625]">CEO Access Restricted</h1>
        <p className="text-sm text-[#645E72]">
          AFOMI CEO AI is exclusively visible to the CEO account (ceo@afomi.app / admin@afomi.app).
        </p>
        <button
          type="button"
          onClick={() => navigate('home')}
          className="min-h-[44px] px-6 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const pendingReviews = submissions.filter((s) => s.status === 'PENDING REVIEW');
  const pendingDisputes = orders.filter((o) => o.status === 'DISPUTED');
  const platformTotalEscrow = Number((lockedEscrowBalance + 1482.5).toFixed(2));
  const totalUsersCount = 3420 + ceoBriefingVersion * 12;
  const totalSalesToday = Number(
    (orders.reduce((s, o) => s + o.totalPi, 0) + 186.5).toFixed(2)
  );

  const briefings = [
    `Good morning CEO. Yesterday AFOMI earned ${afomiCommissionEarned.toFixed(2)} Pi in cumulative commissions. 120 tasks completed across 6 African countries, 35 new KYC-verified users joined, and ${pendingDisputes.length} dispute(s) plus ${pendingReviews.length} task review(s) need your attention.`,
    `Executive Update #${ceoBriefingVersion}: Escrow Safe Box currently safeguards ${platformTotalEscrow.toFixed(2)} Pi across ${tasks.length} open micro-tasks and ${orders.length} active marketplace orders. Tutoring & Foodstuff subscriptions are pacing +40% week-over-week.`,
    `Liquidity & Risk Pulse: 94.2% of submitted tasks scored above 85% quality by AFOMI AI Reviewer. Resolving the ${pendingReviews.length} pending reviews below will unlock ${(pendingReviews.reduce((s, r) => s + r.workerNetPay, 0)).toFixed(2)} Pi to workers immediately.`,
  ];
  const currentBriefing = briefings[(ceoBriefingVersion - 1) % briefings.length];

  const earnings7Days = [
    { day: 'Mon', pi: 48 },
    { day: 'Tue', pi: 62 },
    { day: 'Wed', pi: 55 },
    { day: 'Thu', pi: 74 },
    { day: 'Fri', pi: 88 },
    { day: 'Sat', pi: 69 },
    { day: 'Sun', pi: 94 },
  ];

  const userGrowthPoints = [
    { label: 'W1', users: 1400 },
    { label: 'W2', users: 1890 },
    { label: 'W3', users: 2340 },
    { label: 'W4', users: 2810 },
    { label: 'W5', users: 3120 },
    { label: 'Now', users: totalUsersCount },
  ];

  const topCategories = [
    { name: 'Foodstuff & Harvest Boxes', share: 34, pi: '1,240 Pi' },
    { name: 'Translation & Language AI', share: 26, pi: '910 Pi' },
    { name: 'Tutoring & STEM Subscriptions', share: 21, pi: '740 Pi' },
    { name: 'Design & Branding Services', share: 19, pi: '620 Pi' },
  ];

  const topSellers = useMemo(
    () => [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 4),
    [products]
  );

  const lowTasks = useMemo(
    () => [...tasks].sort((a, b) => a.payPerWorker - b.payPerWorker).slice(0, 3),
    [tasks]
  );

  const handleGenerateContent = (kind: 'marketing' | 'pitch' | 'email') => {
    setCopied(false);
    if (kind === 'marketing') {
      setGeneratedContent({
        title: 'Marketing Post (WhatsApp / X / Pi Social)',
        body: `Earn with your own hand. Grow with your own effort.\n\nAFOMI connects African talent, local merchants, and Pi pioneers in one Escrow-protected marketplace.\n- Complete micro-tasks (Translation, Photo checks, App QA) & get paid 92% via Escrow\n- Buy & sell foodstuff, fashion, tutoring & data with zero payment risk\n- Subscribe weekly or monthly with 1-tap budget approval\n\nJoin ${totalUsersCount.toLocaleString()} pioneers on AFOMI today.`,
      });
    } else if (kind === 'pitch') {
      setGeneratedContent({
        title: 'Hackathon & Investor Pitch (60-Second Script)',
        body: `Trust is the #1 barrier in African digital commerce and remote micro-work. Workers fear doing tasks without pay; buyers fear paying sellers who never deliver.\n\nAFOMI solves this with mandatory Pi Escrow for every task, marketplace order, and recurring subscription. Funds lock upfront (+8% transparent AFOMI fee) and release only upon approval or 48h/3-day protection rules.\n\nToday we already track ${platformTotalEscrow.toFixed(2)} Pi locked in Escrow, ${afomiCommissionEarned.toFixed(2)} Pi in platform commission, and ${totalUsersCount.toLocaleString()} users across Nigeria, Ghana, Kenya & Rwanda.`,
      });
    } else {
      setGeneratedContent({
        title: 'Email to AFOMI Sellers',
        body: `Subject: Unlock 40% More Repeat Orders with AFOMI Subscriptions\n\nHello AFOMI Merchant,\n\nBuyers on AFOMI love Escrow protection—and Tutoring & Weekly Food Packs are growing 40% faster than one-off orders.\n\nConvert your top product into a Weekly or Monthly Subscription inside Seller Hub today. Funds lock automatically on each renewal date and release straight to your Pi balance after delivery confirmation.\n\nGrow with your own effort,\nEmeka Obi, CEO — AFOMI`,
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent.body);
      setCopied(true);
      showToast('Copied generated content to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Content ready to copy from the box.', 'info');
    }
  };

  const handleDownloadReport = () => {
    const reportText = [
      'AFOMI EXECUTIVE CEO REPORT',
      `Generated: 2026-11-25 | CEO: ${user?.email}`,
      '--------------------------------------------------',
      `Total Users: ${totalUsersCount}`,
      `Active Tasks Today: ${tasks.length}`,
      `Total Pi Locked in Escrow: ${platformTotalEscrow.toFixed(2)} Pi`,
      `Total Pi Earned as Commission (8%): ${afomiCommissionEarned.toFixed(2)} Pi`,
      `Total Sales Volume Today: ${totalSalesToday.toFixed(2)} Pi`,
      `Pending Task Reviews: ${pendingReviews.length}`,
      `Pending Disputes: ${pendingDisputes.length}`,
      '',
      'DAILY BRIEFING:',
      currentBriefing,
    ].join('\n');

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'afomi-ceo-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CEO Executive Report downloaded!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* CEO Header */}
      <div className="rounded-3xl bg-[#1A1625] text-white p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#FFC107] shrink-0">
            <AfomiImage src={user?.avatar} alt="AFOMI CEO" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#FFC107]">
              <Sparkles className="w-4 h-4" />
              <span>AFOMI CEO AI · Executive Suite ({user?.email})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              CEO Personal Manager, Accountant &amp; Advisor
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="min-h-[44px] px-5 rounded-xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] text-xs font-bold inline-flex items-center gap-2 self-start lg:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download CEO Report</span>
        </button>
      </div>

      {/* Daily CEO Briefing Box */}
      <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6A1B9A]">
            <Bot className="w-4 h-4" />
            <span>Daily CEO Briefing</span>
          </div>
          <p className="text-sm text-[#1A1625] leading-relaxed">{currentBriefing}</p>
        </div>
        <button
          type="button"
          onClick={refreshCeoBriefing}
          className="min-h-[42px] px-4 rounded-xl bg-[#F5EEFA] hover:bg-[#ebddf7] text-[#6A1B9A] text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Briefing</span>
        </button>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Users', val: totalUsersCount.toLocaleString(), sub: '+35 joined today' },
          { label: 'Active Tasks Today', val: `${tasks.length}`, sub: '120 completed yest.' },
          { label: 'Total Pi Locked in Escrow', val: `${platformTotalEscrow.toFixed(1)} Pi`, sub: 'Safe Box active' },
          { label: 'Commission Earned', val: `${afomiCommissionEarned.toFixed(1)} Pi`, sub: '8% platform fee' },
          { label: 'Total Sales Today', val: `${totalSalesToday.toFixed(1)} Pi`, sub: 'Market + Subs' },
          { label: 'Pending Disputes', val: `${pendingDisputes.length}`, sub: `${pendingReviews.length} task reviews` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-white border border-[#E7E3EE] p-4">
            <div className="text-[11px] font-medium text-[#645E72]">{kpi.label}</div>
            <div className="text-xl font-extrabold text-[#1A1625] tabular-nums mt-1">{kpi.val}</div>
            <div className="text-[11px] text-[#6A1B9A] font-medium mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Section Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: 'Analytics & Charts', icon: BarChart3 },
          { id: 'chat', label: 'Ask CEO AI', icon: MessageSquare },
          { id: 'reviewer', label: `AI Task Reviewer (${pendingReviews.length})`, icon: ShieldCheck },
          { id: 'money', label: 'AI Money Manager', icon: TrendingUp },
          { id: 'content', label: 'Content Generator', icon: FileText },
          { id: 'support', label: `AI Support Inbox (${supportTickets.filter((t) => t.status === 'OPEN').length})`, icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id as typeof section)}
              className={`min-h-[42px] px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                section === tab.id
                  ? 'bg-[#6A1B9A] text-white'
                  : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. ANALYTICS & CHARTS */}
      {section === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Bar Chart: Earnings Last 7 Days */}
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
            <h2 className="text-base font-bold text-[#1A1625]">Earnings Last 7 Days (Pi)</h2>
            <p className="text-xs text-[#645E72]">Daily AFOMI commission &amp; Escrow fee capture</p>
            <div className="h-48 flex items-end justify-between gap-2.5 pt-6">
              {earnings7Days.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#6A1B9A] tabular-nums">{d.pi}</span>
                  <div className="w-full bg-[#F3EBF9] rounded-t-lg h-32 flex items-end">
                    <div
                      style={{ height: `${Math.round((d.pi / 100) * 100)}%` }}
                      className="w-full bg-[#6A1B9A] rounded-t-lg"
                    />
                  </div>
                  <span className="text-[11px] text-[#645E72]">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line Chart: Users Growth */}
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
            <h2 className="text-base font-bold text-[#1A1625]">Users Growth</h2>
            <p className="text-xs text-[#645E72]">Verified African workers, buyers &amp; sellers</p>
            <div className="mt-5">
              <svg viewBox="0 0 300 130" className="w-full h-36 overflow-visible">
                <polyline
                  fill="none"
                  stroke="#6A1B9A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="15,105 70,88 125,68 180,45 235,28 285,12"
                />
                {userGrowthPoints.map((pt, i) => {
                  const x = 15 + i * 54;
                  const yList = [105, 88, 68, 45, 28, 12];
                  return (
                    <g key={pt.label}>
                      <circle cx={x} cy={yList[i]} r="4.5" fill="#FFC107" stroke="#6A1B9A" strokeWidth="2" />
                      <text x={x} y="126" textAnchor="middle" fontSize="10" fill="#645E72">
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex justify-between text-xs font-semibold text-[#1A1625] tabular-nums mt-1">
                <span>Start: 1,400</span>
                <span className="text-[#6A1B9A]">Current: {totalUsersCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
            <h2 className="text-base font-bold text-[#1A1625]">Top Categories</h2>
            <p className="text-xs text-[#645E72]">Share of weekly Escrow transaction volume</p>
            <div className="mt-5 space-y-3.5">
              {topCategories.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#1A1625]">{c.name}</span>
                    <span className="font-bold text-[#6A1B9A] tabular-nums">
                      {c.share}% ({c.pi})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3EBF9] overflow-hidden">
                    <div style={{ width: `${c.share}%` }} className="h-full bg-[#6A1B9A] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CEO AI CHAT ASSISTANT */}
      {section === 'chat' && (
        <div className="rounded-3xl bg-white border border-[#E7E3EE] overflow-hidden">
          <div className="p-5 border-b border-[#E7E3EE] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#6A1B9A] text-[#FFC107] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-[#1A1625]">Ask CEO AI</h2>
                <p className="text-xs text-[#645E72]">Grounded in live AFOMI Escrow, Task, and Marketplace data</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto bg-[#FAF8FC]">
            {ceoChat.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'ceo' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-sm whitespace-pre-line leading-relaxed ${
                    msg.sender === 'ceo'
                      ? 'bg-[#6A1B9A] text-white'
                      : 'bg-white border border-[#E7E3EE] text-[#1A1625]'
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[10px] mt-1.5 tabular-nums ${
                      msg.sender === 'ceo' ? 'text-purple-200' : 'text-[#645E72]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#E7E3EE] space-y-3 bg-white">
            <div className="flex flex-wrap gap-2">
              {CEO_CHAT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => sendCeoChat(chip)}
                  className="px-3 py-1.5 rounded-xl bg-[#F5EEFA] hover:bg-[#ebddf7] text-[#6A1B9A] text-xs font-semibold cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                sendCeoChat(chatInput);
                setChatInput('');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask CEO AI about growth, pricing, margins, or Escrow strategy..."
                className="flex-1 min-h-[44px] px-4 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              />
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. CEO AI TASK REVIEWER */}
      {section === 'reviewer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1A1625]">
              AI-Scored Pending Task Submissions ({pendingReviews.length})
            </h2>
          </div>

          {pendingReviews.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-8 text-center text-sm text-[#645E72]">
              All task submissions reviewed!
            </div>
          ) : (
            pendingReviews.map((sub) => (
              <div key={sub.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-[#645E72]">
                      Worker: <span className="font-semibold text-[#1A1625]">{sub.workerName}</span> · {sub.category} ·{' '}
                      {sub.hoursRemaining48h}h auto-approve remaining
                    </div>
                    <h3 className="text-base font-bold text-[#1A1625] mt-0.5">{sub.taskTitle}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl tabular-nums ${
                        sub.aiVerdict === 'Good'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      AI Score: {sub.aiScore}% {sub.aiVerdict} · Suggestion: {sub.aiSuggestion}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 items-start">
                  <div className="sm:col-span-2 space-y-2">
                    <p className="text-xs text-[#1A1625] bg-[#FAF8FC] p-3.5 rounded-xl border border-[#F1EEF6]">
                      {sub.submissionText}
                    </p>
                    <p className="text-xs text-[#645E72]">
                      <span className="font-bold text-[#6A1B9A]">AI Reason:</span> {sub.aiReason}
                    </p>
                  </div>
                  {sub.submissionImage && (
                    <div className="h-28 rounded-xl overflow-hidden border border-[#E7E3EE]">
                      <AfomiImage src={sub.submissionImage} alt="Submitted task proof" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-[#F1EEF6]">
                  <button
                    type="button"
                    onClick={() => reviewTaskSubmission(sub.id, 'APPROVE')}
                    className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Approve (Release +{sub.workerNetPay.toFixed(2)} Pi)
                  </button>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={rejectNotes[sub.id] || ''}
                      onChange={(e) => setRejectNotes((n) => ({ ...n, [sub.id]: e.target.value }))}
                      placeholder="Rejection reason (returns funds to Payer Escrow)..."
                      className="flex-1 min-h-[42px] px-3 rounded-xl border border-[#E7E3EE] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => reviewTaskSubmission(sub.id, 'REJECT', rejectNotes[sub.id])}
                      className="min-h-[42px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. CEO AI MONEY MANAGER */}
      {section === 'money' && (
        <div className="space-y-6">
          {/* AI Alerts */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-900">AI Margin Warning</div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Warning: Tasks under 1.00 Pi (e.g. 0.90 Pi micro-survey) have lower completion velocity — workers may leave for higher-paying translation tasks.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-900">AI Growth Opportunity</div>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Opportunity: Tutoring tasks &amp; monthly plans are growing 40% week-over-week — invite 10 more STEM tutors and feature them on Home.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Escrow Overview & Commission */}
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-3">
              <h3 className="text-base font-bold text-[#1A1625]">Escrow Overview &amp; Commission Earned</h3>
              <div className="divide-y divide-[#F1EEF6] text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#645E72]">Total Pi Locked in Escrow</span>
                  <span className="font-bold tabular-nums">{platformTotalEscrow.toFixed(2)} Pi</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#645E72]">Commission Earned (8% Take Rate)</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{afomiCommissionEarned.toFixed(2)} Pi</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#645E72]">Active Disputes Held</span>
                  <span className="font-bold text-rose-700 tabular-nums">{pendingDisputes.length}</span>
                </div>
              </div>
              {pendingDisputes.map((d) => (
                <div key={d.id} className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs space-y-2">
                  <div className="font-bold text-rose-900">Dispute: {d.productName} ({d.totalPi.toFixed(2)} Pi)</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => resolveOrderDispute(d.id, 'REFUND_BUYER')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                    >
                      Refund Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveOrderDispute(d.id, 'RELEASE_SELLER')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                    >
                      Release Seller
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Earning Sellers */}
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-3">
              <h3 className="text-base font-bold text-[#1A1625]">Top Earning Sellers</h3>
              <div className="divide-y divide-[#F1EEF6] text-xs">
                {topSellers.map((s) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#1A1625]">{s.sellerName}</div>
                      <div className="text-[#645E72]">{s.category} · {s.location}</div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-bold text-[#6A1B9A]">{(s.salesCount * s.pricePi * 0.92).toFixed(0)} Pi net</div>
                      <div className="text-[#645E72]">{s.salesCount} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Low Performing Tasks */}
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
            <h3 className="text-base font-bold text-[#1A1625] mb-3">Low Performing Tasks (Need Pay Boost)</h3>
            <div className="divide-y divide-[#F1EEF6] text-xs">
              {lowTasks.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#1A1625]">{t.title}</div>
                    <div className="text-[#645E72]">{t.category} · Posted by {t.postedBy}</div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="font-bold text-amber-700">{t.payPerWorker.toFixed(2)} Pi / worker</div>
                    <div className="text-[#645E72]">{t.spotsLeft}/{t.totalWorkers} spots still open</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. CEO AI CONTENT GENERATOR */}
      {section === 'content' && (
        <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#1A1625]">CEO AI Content Generator</h2>
            <p className="text-xs text-[#645E72]">Generate ready-to-publish copy grounded in AFOMI Escrow traction.</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleGenerateContent('marketing')}
              className="min-h-[42px] px-4 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
            >
              Generate Marketing Post
            </button>
            <button
              type="button"
              onClick={() => handleGenerateContent('pitch')}
              className="min-h-[42px] px-4 rounded-xl bg-[#FFC107] text-[#2B1F00] text-xs font-bold cursor-pointer"
            >
              Generate Hackathon Pitch
            </button>
            <button
              type="button"
              onClick={() => handleGenerateContent('email')}
              className="min-h-[42px] px-4 rounded-xl border border-[#6A1B9A] text-[#6A1B9A] text-xs font-bold cursor-pointer"
            >
              Generate Email to Sellers
            </button>
          </div>

          <div className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6A1B9A]">{generatedContent.title}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[36px] px-3 rounded-lg bg-white border border-[#E7E3EE] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={7}
              value={generatedContent.body}
              onChange={(e) => setGeneratedContent((g) => ({ ...g, body: e.target.value }))}
              className="w-full p-3.5 rounded-xl bg-white border border-[#E7E3EE] text-sm leading-relaxed focus:outline-none focus:border-[#6A1B9A]"
            />
          </div>
        </div>
      )}

      {/* 6. CEO AI CUSTOMER SUPPORT INBOX */}
      {section === 'support' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1A1625]">AI Customer Support Inbox</h2>
          {supportTickets.map((tkt) => {
            const replyVal = draftOverrides[tkt.id] ?? tkt.aiDraftReply;
            return (
              <div key={tkt.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-[#645E72]">
                      {tkt.userName} ({tkt.userEmail}) · {tkt.receivedAt}
                    </div>
                    <h3 className="text-base font-bold text-[#1A1625]">{tkt.subject}</h3>
                  </div>
                  <EscrowStatusBadge status={tkt.status === 'REPLIED' ? 'COMPLETED' : 'PENDING'} />
                </div>

                <p className="text-xs text-[#1A1625] bg-[#FAF8FC] p-3 rounded-xl border border-[#F1EEF6]">
                  "{tkt.message}"
                </p>

                {tkt.status === 'OPEN' ? (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-[#6A1B9A]">AI Draft Reply (Editable)</div>
                    <textarea
                      rows={3}
                      value={replyVal}
                      onChange={(e) => setDraftOverrides((d) => ({ ...d, [tkt.id]: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-[#E7E3EE] text-xs leading-relaxed focus:outline-none focus:border-[#6A1B9A]"
                    />
                    <button
                      type="button"
                      onClick={() => sendSupportReply(tkt.id, replyVal)}
                      className="min-h-[40px] px-4 rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve &amp; Send Reply</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <span className="font-bold">Sent Reply:</span> {tkt.sentReply}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Download CEO Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#1A1625]">AFOMI Executive CEO Report</h3>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#FAF8FC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#645E72]">Total Users</span>
                <span className="font-bold tabular-nums">{totalUsersCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#645E72]">Total Pi Locked in Escrow</span>
                <span className="font-bold tabular-nums">{platformTotalEscrow.toFixed(2)} Pi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#645E72]">Total Commission Earned (8%)</span>
                <span className="font-bold text-emerald-700 tabular-nums">{afomiCommissionEarned.toFixed(2)} Pi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#645E72]">Pending Reviews / Disputes</span>
                <span className="font-bold tabular-nums">
                  {pendingReviews.length} / {pendingDisputes.length}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#645E72] leading-relaxed">{currentBriefing}</p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleDownloadReport}
                className="flex-1 min-h-[44px] rounded-xl bg-[#6A1B9A] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download .TXT Report</span>
              </button>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="min-h-[44px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
