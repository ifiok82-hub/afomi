import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, AfomiLogo } from '../components/AfomiUI';
import { AdminPinModal } from '../components/AdminPinModal';
import { GENERATED_IMAGES } from '../data/seedData';

const SLIDES = [
  {
    number: '01',
    title: 'Earn with Tasks',
    subtitle:
      'Complete micro-tasks in translation, data labeling, photo checks, and app testing from your phone.',
    highlight:
      'Funds are locked in AFOMI Escrow before you start — get 92% straight to your Pi balance on approval.',
    icon: Briefcase,
  },
  {
    number: '02',
    title: 'Buy & Sell in Market',
    subtitle:
      'Shop African foodstuff, Ankara fashion, tutoring, design services, and instant airtime/data.',
    highlight: 'Buyers pay into AFOMI Escrow first. Sellers only get paid when delivery is confirmed.',
    icon: ShoppingBag,
  },
  {
    number: '03',
    title: 'Subscribe & Earn Monthly',
    subtitle: 'Lock recurring tutoring, weekly farm food packs, or monthly design retainers with one approval.',
    highlight: 'Escrow locks each cycle on the payment date and releases automatically after service delivery.',
    icon: CreditCard,
  },
];

export const SplashScreen: React.FC = () => {
  const { dismissSplash, loginAsCeo, navigate, isAdminUnlocked } = useAfomi();
  const [slideIdx, setSlideIdx] = useState(0);
  const [pinOpen, setPinOpen] = useState(false);
  const tapRef = useRef<number[]>([]);
  const current = SLIDES[slideIdx];
  const Icon = current.icon;

  const handleSplashLogoTap = () => {
    const now = Date.now();
    const recent = tapRef.current.filter((t) => now - t <= 4000);
    recent.push(now);
    tapRef.current = recent;
    if (recent.length >= 7) {
      tapRef.current = [];
      if (isAdminUnlocked) navigate('admin-dashboard');
      else setPinOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <AdminPinModal open={pinOpen} onClose={() => setPinOpen(false)} />

      <header className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
        <AfomiLogo onTap={handleSplashLogoTap} size="md" />
        <button
          type="button"
          onClick={dismissSplash}
          className="text-sm font-semibold text-[#6A1B9A] hover:underline min-h-[44px] px-3 cursor-pointer"
        >
          Skip
        </button>
      </header>

      <div className="max-w-6xl w-full mx-auto px-6 py-6 grid lg:grid-cols-2 gap-10 items-center flex-1">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#6A1B9A] mb-3">
            African Marketplace for Opportunities, Micro-tasks &amp; Innovation
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1625] leading-tight text-balance">
            Earn with your own hand. Grow with your own effort.
          </h1>
          <p className="text-base text-[#645E72] mt-4 max-w-xl leading-relaxed">
            Every task, marketplace order, and subscription on AFOMI is protected by our Pi Testnet Escrow Safe Box.
          </p>

          {/* Interactive 3-Slide Showcase */}
          <div className="mt-7 rounded-2xl border border-[#E7E3EE] bg-[#FAF8FC] p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#6A1B9A] text-[#FFC107]">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs font-semibold text-[#6A1B9A]">Slide {current.number} of 03</div>
                  <h2 className="text-lg font-bold text-[#1A1625]">{current.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {SLIDES.map((s, idx) => (
                  <button
                    key={s.number}
                    type="button"
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => setSlideIdx(idx)}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === slideIdx ? 'w-7 bg-[#6A1B9A]' : 'w-2.5 bg-[#D5CEE0]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-sm text-[#1A1625] leading-relaxed">{current.subtitle}</p>
            <p className="text-xs text-[#645E72] mt-3 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-[#6A1B9A] shrink-0 mt-0.5" />
              <span>{current.highlight}</span>
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {SLIDES.map((s, idx) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => setSlideIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      idx === slideIdx
                        ? 'bg-[#6A1B9A] text-white'
                        : 'bg-white text-[#645E72] border border-[#E7E3EE] hover:text-[#1A1625]'
                    }`}
                  >
                    {idx + 1}) {s.title.split(' ')[0]}
                  </button>
                ))}
              </div>
              {slideIdx < 2 && (
                <button
                  type="button"
                  onClick={() => setSlideIdx((i) => (i + 1) % 3)}
                  className="text-xs font-semibold text-[#6A1B9A] hover:underline cursor-pointer"
                >
                  Next slide
                </button>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={dismissSplash}
              className="px-7 py-3.5 min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={loginAsCeo}
              className="px-5 py-3.5 min-h-[48px] rounded-2xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] font-semibold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>CEO Demo Access</span>
            </button>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-[#E7E3EE] aspect-[16/10] lg:aspect-[4/3]">
          <AfomiImage
            src={GENERATED_IMAGES.hero}
            alt="African creators, freelancers, and merchants working on AFOMI"
            fallbackLabel="AFOMI Pan-African Hub"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FFC107]">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Escrow Protected · Pi Testnet</span>
            </div>
            <p className="text-sm mt-1 font-medium">Lagos · Accra · Nairobi · Kigali · Johannesburg</p>
          </div>
        </div>
      </div>

      <footer className="max-w-6xl w-full mx-auto px-6 py-4 border-t border-[#F1EEF6] text-xs text-[#645E72] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AfomiLogo onTap={() => navigate('splash')} size="sm" />
          <span>· Pi Testnet Escrow Marketplace</span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('help')} className="hover:text-[#6A1B9A] cursor-pointer">
            Help
          </button>
          <button type="button" onClick={() => navigate('privacy')} className="hover:text-[#6A1B9A] cursor-pointer">
            Privacy Policy
          </button>
          <button type="button" onClick={() => navigate('terms')} className="hover:text-[#6A1B9A] cursor-pointer">
            Terms
          </button>
        </div>
      </footer>
    </div>
  );
};

export const AuthScreen: React.FC = () => {
  const { loginWithPi, loginWithEmail, loginAsCeo, navigate, piAuthLoading, isAdminUnlocked } = useAfomi();
  const [email, setEmail] = useState('amara@afomi.app');
  const [password, setPassword] = useState('afomi123');
  const [error, setError] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const tapRef = useRef<number[]>([]);

  const handleAuthLogoTap = () => {
    const now = Date.now();
    const recent = tapRef.current.filter((t) => now - t <= 4000);
    recent.push(now);
    tapRef.current = recent;
    if (recent.length >= 7) {
      tapRef.current = [];
      if (isAdminUnlocked) navigate('admin-dashboard');
      else setPinOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginWithEmail(email, password);
    if (!res.ok) setError(res.error || 'Unable to sign in');
  };

  return (
    <div className="min-h-screen bg-[#FAF8FC] flex items-center justify-center p-4 sm:p-8">
      <AdminPinModal open={pinOpen} onClose={() => setPinOpen(false)} />

      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E7E3EE] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <AfomiLogo onTap={handleAuthLogoTap} size="md" />
          <button
            type="button"
            onClick={() => navigate('splash')}
            className="text-xs font-semibold text-[#645E72] hover:text-[#6A1B9A] cursor-pointer"
          >
            Back to Intro
          </button>
        </div>

        <h1 className="text-2xl font-extrabold text-[#1A1625]">Sign in to AFOMI</h1>
        <p className="text-sm text-[#645E72] mt-1">
          Authenticate with Pi Network (Testnet) to enable Escrow payments and verified earnings.
        </p>

        {/* Real Pi SDK Testnet Authenticate */}
        <button
          type="button"
          disabled={piAuthLoading}
          onClick={() => void loginWithPi()}
          className="mt-6 w-full min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
        >
          {piAuthLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#FFC107]" />
          ) : (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FFC107] text-[#2B1F00] font-extrabold text-xs">
              π
            </span>
          )}
          <span>{piAuthLoading ? 'Connecting Pi Testnet...' : 'Continue with Pi Authentication (Testnet)'}</span>
        </button>

        {/* Login as CEO Demo Button */}
        <button
          type="button"
          onClick={loginAsCeo}
          className="mt-3 w-full min-h-[48px] rounded-2xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Login as CEO (ceo@afomi.app)</span>
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-[#645E72]">
          <div className="h-px flex-1 bg-[#E7E3EE]" />
          <span>or sign in with email</span>
          <div className="h-px flex-1 bg-[#E7E3EE]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="you@example.com or ceo@afomi.app"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              required
            />
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-2xl border border-[#6A1B9A] text-[#6A1B9A] hover:bg-[#F5EEFA] font-semibold text-sm transition-colors cursor-pointer"
          >
            Sign In with Email
          </button>
        </form>

        <p className="mt-4 text-[11px] text-center text-[#645E72]">
          By continuing you agree to{' '}
          <button
            type="button"
            onClick={() => navigate('terms')}
            className="font-semibold text-[#6A1B9A] hover:underline cursor-pointer"
          >
            Terms
          </button>{' '}
          &amp;{' '}
          <button
            type="button"
            onClick={() => navigate('privacy')}
            className="font-semibold text-[#6A1B9A] hover:underline cursor-pointer"
          >
            Privacy
          </button>
          .
        </p>

        <div className="mt-4 rounded-xl bg-[#FAF8FC] border border-[#E7E3EE] p-3.5 text-xs text-[#645E72]">
          <p className="font-semibold text-[#1A1625]">Demo CEO Credentials</p>
          <p className="mt-0.5 tabular-nums">Email: ceo@afomi.app · Password: afomi123</p>
        </div>
      </div>
    </div>
  );
};

export const KycScreen: React.FC = () => {
  const { user, completeKyc, navigate } = useAfomi();
  const [name, setName] = useState(user?.name || 'Amara Nwosu');
  const [country, setCountry] = useState(user?.country || 'Nigeria');
  const [city, setCity] = useState(user?.city || 'Lagos');
  const [phone, setPhone] = useState(user?.phone || '+234 803 555 0192');
  const [skillsText, setSkillsText] = useState(
    (user?.skills || ['Yoruba Translation', 'Data Labeling', 'Mobile QA']).join(', ')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeKyc({
      name,
      country,
      city,
      phone,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8FC] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E7E3EE] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <AfomiLogo onTap={() => navigate('home')} size="sm" />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6A1B9A]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Step 2 of 2 · KYC Verification</span>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-[#1A1625]">Complete Your KYC Profile</h1>
        <p className="text-sm text-[#645E72] mt-1">
          Verify your identity to unlock your KYC Verified badge, higher-paying tasks, and Marketplace selling.
        </p>

        {user?.piAuthenticated && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <span className="font-bold">Pi Testnet Connected:</span> {user.piUsername} ({user.piWalletAddress?.slice(0, 14)}...)
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm bg-white focus:outline-none focus:border-[#6A1B9A]"
              >
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
                <option value="Rwanda">Rwanda</option>
                <option value="South Africa">South Africa</option>
                <option value="Ethiopia">Ethiopia</option>
                <option value="Uganda">Uganda</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1625] mb-1.5">
              Your Skills (comma separated)
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Translation, Photo Verification, Graphic Design"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="flex-1 min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#FFC107]" />
              <span>Save &amp; Verify KYC</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="min-h-[48px] px-5 rounded-2xl border border-[#E7E3EE] text-sm font-semibold text-[#645E72] hover:text-[#1A1625] cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
