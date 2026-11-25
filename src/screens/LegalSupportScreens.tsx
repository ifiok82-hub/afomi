import React from 'react';
import { ArrowLeft, HelpCircle, Lock, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';

export const PrivacyPolicyPage: React.FC = () => {
  const { navigate, user, adminSettings } = useAfomi();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate(user ? 'home' : 'auth')}
        className="min-h-[40px] px-3.5 rounded-xl border border-[#E7E3EE] bg-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6A1B9A]">
          <ShieldCheck className="w-4 h-4" />
          <span>{adminSettings.appName} Legal &amp; Data Protection</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">Privacy Policy</h1>
        <p className="text-xs text-[#645E72]">Last Updated: November 25, 2026 · Contact: support@afomi.app</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">1. What Data We Collect</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            When you authenticate with Pi Network or sign in to AFOMI, we collect only the information needed to operate
            Escrow-protected work and commerce: your Pi username, Pi UID, Pi Testnet wallet address, optional KYC profile
            fields (full name, city, country, phone, skills), task submissions, marketplace orders, and support messages.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">2. How We Use Your Data</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            Your data is used strictly to verify Pi payments through our backend server, lock and release Escrow rewards,
            prevent double-spend or fraud, verify task quality, and deliver customer support.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">3. No Sale of Personal Data</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            AFOMI does NOT sell, rent, or trade your personal data, Pi wallet address, or task history to third-party
            advertisers or data brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">4. How to Delete Your Account</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            You may permanently delete your account and personal profile at any time by going to{' '}
            <span className="font-semibold text-[#1A1625]">Profile &gt; Settings &gt; Delete My Account</span>, or by
            emailing <span className="font-semibold text-[#6A1B9A]">support@afomi.app</span>.
          </p>
          {user && (
            <button
              type="button"
              onClick={() => navigate('profile')}
              className="mt-2 min-h-[40px] px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Go to Account Deletion in Profile</span>
            </button>
          )}
        </section>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const { navigate, user, adminSettings } = useAfomi();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate(user ? 'home' : 'auth')}
        className="min-h-[40px] px-3.5 rounded-xl border border-[#E7E3EE] bg-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6A1B9A]">
          <Lock className="w-4 h-4" />
          <span>{adminSettings.appName} Platform Rules</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">Terms of Service</h1>
        <p className="text-xs text-[#645E72]">Last Updated: November 25, 2026 · Pi Testnet Edition</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">1. Testnet Only Notice</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            AFOMI currently operates strictly on the Pi Network Testnet (Sandbox). No real Mainnet Pi is transferred, and
            all Pi figures represent Testnet tokens for testing and verification purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">2. Mandatory AFOMI Escrow &amp; {adminSettings.afomiFeePercent}% Fee</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            All task budgets, marketplace purchases, and subscription cycles must be deposited into AFOMI Escrow before
            work or shipment begins. AFOMI retains an {adminSettings.afomiFeePercent}% platform Escrow &amp; infrastructure
            fee upon successful release; approved workers and sellers receive {100 - adminSettings.afomiFeePercent}%.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">3. Refunds &amp; Disputes</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            If a task submission is validly rejected, 0 Pi is released to the worker and locked funds return to the
            poster&apos;s Escrow balance while the worker receives one appeal opportunity. Marketplace buyers who open a
            dispute freeze funds in Escrow until an AFOMI Admin resolves the dispute by refunding the buyer or releasing
            to the seller.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#1A1625]">4. No Guarantee of Earnings</h2>
          <p className="text-sm text-[#645E72] leading-relaxed">
            Task availability, marketplace sales, and subscription income depend on user demand and submission quality.
            AFOMI does not guarantee fixed daily or monthly income.
          </p>
        </section>
      </div>
    </div>
  );
};

export const HelpSupportPage: React.FC = () => {
  const { navigate, user, adminSettings } = useAfomi();

  const faqs = [
    {
      q: 'How does Escrow work?',
      a: `Payers lock 100% of the task budget (plus the ${adminSettings.afomiFeePercent}% AFOMI fee) or product order price inside the AFOMI Escrow Safe Box before work or delivery starts. Workers and sellers are paid only after work approval or delivery confirmation.`,
    },
    {
      q: 'How do I get paid?',
      a: `Once your task submission is approved (or automatically after the ${adminSettings.autoApproveHours}-hour review window), ${100 - adminSettings.afomiFeePercent}% of the task reward moves straight into your Available Balance. You can review every payout in Wallet & Escrow Wallet.`,
    },
    {
      q: 'How do I appeal a rejected task?',
      a: 'Open Tasks > My Submitted Work. On any rejected submission, enter your explanation in the Appeal box and click "Appeal Once" to send it directly to AFOMI Admin / Reviewer evaluation.',
    },
    {
      q: 'Why must I authenticate with Pi before paying?',
      a: 'Pi Core Team rules require explicit Pi SDK authentication with username, payments, and wallet_address scopes plus backend approval/completion verification before locking Escrow funds.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate(user ? 'home' : 'auth')}
        className="min-h-[40px] px-3.5 rounded-xl border border-[#E7E3EE] bg-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold text-[#6A1B9A]">
          <HelpCircle className="w-4 h-4" />
          <span>Help &amp; Trust Center</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">AFOMI Help &amp; FAQ</h1>
          <p className="text-sm text-[#645E72] mt-1">
            Need help with an Escrow payment, dispute, or Pi Testnet checkout? Reach us anytime.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 space-y-1.5">
              <h2 className="text-sm font-extrabold text-[#1A1625]">{f.q}</h2>
              <p className="text-xs text-[#645E72] leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#6A1B9A] text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-purple-100">Official Support Contact</div>
            <div className="text-lg font-extrabold flex items-center gap-2 mt-0.5">
              <Mail className="w-4 h-4 text-[#FFC107]" />
              <span>support@afomi.app</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('privacy')}
              className="px-4 py-2 rounded-xl bg-white/15 text-xs font-semibold hover:bg-white/25 cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('terms')}
              className="px-4 py-2 rounded-xl bg-white/15 text-xs font-semibold hover:bg-white/25 cursor-pointer"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
