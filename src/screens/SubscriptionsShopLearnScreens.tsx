import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, EscrowStatusBadge, FundsLockedTag } from '../components/AfomiUI';
import { GENERATED_IMAGES } from '../data/seedData';
import { validatePiAmount, validateRequired } from '../lib/validation';
import { Course, Product, SubscriptionPlan } from '../types/afomi';

export const SubscriptionsPage: React.FC = () => {
  const {
    user,
    subscriptionPlans,
    activeSubscriptions,
    availableBalance,
    piAuthLoading,
    paymentPhase,
    loginWithPi,
    subscribeWithEscrow,
    confirmSubscriptionDelivery,
    cancelSubscription,
    showToast,
  } = useAfomi();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [approvingPlan, setApprovingPlan] = useState<SubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['All', 'Education', 'Foodstuff', 'Design', 'Airtime/Data', 'Fashion', 'Services'];

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptionPlans.filter((p) => {
      const catOk = catFilter === 'All' || p.category === catFilter;
      const qOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.providerName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [subscriptionPlans, catFilter, search]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">AFOMI Subscriptions</h1>
        <p className="text-sm text-[#645E72] mt-1">
          Approve your budget once. Each cycle, funds lock in Escrow on payment date and release only after service is confirmed.
        </p>
      </div>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1A1625]">Active Subscriptions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activeSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-2xl bg-white border border-[#E7E3EE] p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#645E72]">
                      {sub.providerName} · Next Payment: <span className="tabular-nums font-semibold">{sub.nextPaymentDate}</span>
                    </span>
                    <EscrowStatusBadge status={sub.status === 'CANCELLED' ? 'CANCELLED' : sub.escrowStatus} />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1625] mt-1.5">{sub.title}</h3>
                  <p className="text-sm font-extrabold text-[#6A1B9A] tabular-nums mt-0.5">{sub.periodLabel}</p>
                </div>

                {sub.status === 'ACTIVE' && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F1EEF6]">
                    {sub.escrowStatus === 'LOCKED' && (
                      <button
                        type="button"
                        onClick={() => confirmSubscriptionDelivery(sub.id)}
                        className="min-h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm Service Delivery
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => cancelSubscription(sub.id)}
                      className="min-h-[40px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search & Category Tabs */}
      <section className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-[#645E72] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tutoring, food packs, design retainers, data bundles..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                catFilter === cat
                  ? 'bg-[#6A1B9A] text-white'
                  : 'bg-white border border-[#E7E3EE] text-[#645E72]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredPlans.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-10 text-center">
            <p className="text-base font-bold text-[#1A1625]">
              {subscriptionPlans.length === 0 ? 'No subscriptions yet' : 'No subscriptions match your search'}
            </p>
            <p className="text-xs text-[#645E72] mt-1">
              {subscriptionPlans.length === 0
                ? 'Subscription plans will appear here once published or when Demo Mode is enabled.'
                : 'Try another category or clear your search filter.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl bg-white border border-[#E7E3EE] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/9] bg-[#FAF8FC] overflow-hidden">
                    <AfomiImage src={plan.image} alt={plan.title} />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs text-[#645E72] font-medium">
                        {plan.category} · Cancel anytime
                      </span>
                      <FundsLockedTag label="Escrow Cycle" />
                    </div>
                    <h3 className="text-lg font-extrabold text-[#1A1625]">{plan.title}</h3>
                    <div className="text-base font-extrabold text-[#6A1B9A] tabular-nums mt-1">
                      {plan.periodLabel}
                    </div>
                    <p className="text-xs text-[#645E72] mt-1">By {plan.providerName} · {plan.subscribersCount} subscribers</p>

                    <ul className="mt-4 space-y-1.5 text-xs text-[#1A1625]">
                      {plan.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#6A1B9A] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => setApprovingPlan(plan)}
                    className="w-full min-h-[46px] rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-bold cursor-pointer"
                  >
                    Subscribe ({plan.periodLabel})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approve Once Modal */}
      {approvingPlan && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#6A1B9A]">
                <CreditCard className="w-4 h-4" />
                <span>Approve Subscription Budget Once</span>
              </div>
              <button
                type="button"
                onClick={() => setApprovingPlan(null)}
                className="p-1.5 rounded-lg hover:bg-[#FAF8FC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#1A1625]">{approvingPlan.title}</h3>
              <p className="text-xs text-[#645E72] mt-1">Provided by {approvingPlan.providerName}</p>
            </div>

            <div className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#645E72]">Cycle Budget</span>
                <span className="font-extrabold text-[#6A1B9A] tabular-nums">
                  {approvingPlan.pricePi.toFixed(2)} Pi
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#645E72]">Billing Period</span>
                <span className="font-semibold capitalize">{approvingPlan.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#645E72]">Your Available Pi</span>
                <span className="font-semibold tabular-nums">{availableBalance.toFixed(2)} Pi</span>
              </div>
            </div>

            <p className="text-xs text-[#645E72] flex items-start gap-2">
              <Lock className="w-4 h-4 text-[#6A1B9A] shrink-0 mt-0.5" />
              <span>
                Your {approvingPlan.pricePi.toFixed(2)} Pi locks safely in AFOMI Escrow today and only releases to{' '}
                {approvingPlan.providerName} after service delivery is confirmed. Cancel anytime.
              </span>
            </p>

            {!user?.piAuthenticated && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Please Login with Pi first to lock subscription funds on Testnet.</span>
                </div>
                <button
                  type="button"
                  disabled={piAuthLoading}
                  onClick={() => loginWithPi()}
                  className="px-3 py-1.5 rounded-lg bg-[#6A1B9A] text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  {piAuthLoading ? 'Connecting...' : 'Login with Pi'}
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={!user?.piAuthenticated || submitting}
                onClick={async () => {
                  if (submitting) return;
                  setSubmitting(true);
                  try {
                    const res = await subscribeWithEscrow(approvingPlan.id);
                    if (res.ok) setApprovingPlan(null);
                  } catch (err) {
                    showToast(
                      err instanceof Error ? err.message : 'Subscription payment failed.',
                      'error'
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="flex-1 min-h-[46px] rounded-xl bg-[#6A1B9A] hover:bg-[#581482] disabled:bg-slate-300 disabled:text-slate-600 text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {!user?.piAuthenticated
                    ? 'Please Login with Pi first'
                    : submitting
                      ? paymentPhase || 'Verifying on Pi Testnet...'
                      : `Approve & Lock ${approvingPlan.pricePi.toFixed(2)} Pi`}
                </span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setApprovingPlan(null)}
                className="min-h-[46px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer disabled:opacity-50"
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

export const SellerShopPage: React.FC = () => {
  const {
    user,
    shop,
    orders,
    tasks,
    submissions,
    availableBalance,
    lockedEscrowBalance,
    adminSettings,
    saveShop,
    addSellerProduct,
    markOrderShipped,
    reviewTaskSubmission,
    withdrawPi,
    navigate,
  } = useAfomi();

  const [tab, setTab] = useState<'overview' | 'add-product' | 'sales' | 'tasks' | 'setup'>('overview');
  const [shopName, setShopName] = useState(shop.name);
  const [shopDesc, setShopDesc] = useState(shop.description);
  const [shopLoc, setShopLoc] = useState(shop.location);
  const [shopLogo, setShopLogo] = useState(shop.logo);

  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(12);
  const [prodCat, setProdCat] = useState<Product['category']>('Foodstuff');
  const [prodStock, setProdStock] = useState(25);
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState(GENERATED_IMAGES.foodstuff);
  const [prodError, setProdError] = useState('');

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState(10);
  const [withdrawAddr, setWithdrawAddr] = useState(user?.piWalletAddress || user?.piUsername || '@afomi_testnet');
  const [withdrawErr, setWithdrawErr] = useState('');

  const earningsBars = [
    { day: 'Mon', val: 18 },
    { day: 'Tue', val: 26 },
    { day: 'Wed', val: 22 },
    { day: 'Thu', val: 38 },
    { day: 'Fri', val: 45 },
    { day: 'Sat', val: 31 },
    { day: 'Sun', val: 52 },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setter(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateRequired(prodName, 'Product name');
    if (nameErr) {
      setProdError(nameErr);
      return;
    }
    const priceErr = validatePiAmount(prodPrice, 'Product price');
    if (priceErr) {
      setProdError(priceErr);
      return;
    }
    if (!Number.isInteger(prodStock) || prodStock < 1) {
      setProdError('Stock must be at least 1.');
      return;
    }
    setProdError('');
    addSellerProduct({
      name: prodName.trim(),
      pricePi: prodPrice,
      category: prodCat,
      image: prodImage,
      stock: prodStock,
      description: prodDesc.trim() || 'Escrow-protected African marketplace listing.',
    });
    setProdName('');
    setProdDesc('');
    setTab('overview');
  };

  return (
    <div className="space-y-6">
      {/* Shop Header */}
      <div className="rounded-3xl bg-white border border-[#E7E3EE] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#E7E3EE] bg-[#FAF8FC] shrink-0">
            <AfomiImage src={shop.logo} alt={shop.name} />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6A1B9A]">
              <Store className="w-3.5 h-3.5" />
              <span>Seller Dashboard · {shop.location}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1625] mt-0.5">{shop.name}</h1>
            <p className="text-xs text-[#645E72] mt-0.5 max-w-xl">{shop.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('post-task')}
            className="min-h-[42px] px-4 rounded-xl border border-[#6A1B9A] text-[#6A1B9A] text-xs font-bold cursor-pointer"
          >
            + Add Task
          </button>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="min-h-[42px] px-4 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-[#FFC107]" />
            <span>Withdraw Pi</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: 'My Earnings & Shop' },
          { id: 'add-product', label: '+ Add Product' },
          { id: 'sales', label: `My Sales (${orders.length})` },
          { id: 'tasks', label: `My Tasks (${tasks.length})` },
          { id: 'setup', label: 'Edit Shop Info' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              tab === t.id
                ? 'bg-[#6A1B9A] text-white'
                : 'bg-white border border-[#E7E3EE] text-[#645E72]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-[#E7E3EE] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1A1625]">My Earnings Chart (Last 7 Days)</h2>
                <p className="text-xs text-[#645E72]">Net Pi released from Escrow after {adminSettings.afomiFeePercent}% fee</p>
              </div>
              <span className="text-lg font-extrabold text-[#6A1B9A] tabular-nums">232.00 Pi</span>
            </div>
            <div className="h-48 flex items-end justify-between gap-3 pt-4">
              {earningsBars.map((b) => (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#645E72] tabular-nums">{b.val}π</span>
                  <div className="w-full max-w-[44px] bg-[#F3EBF9] rounded-t-xl overflow-hidden h-32 flex items-end">
                    <div
                      style={{ height: `${Math.round((b.val / 55) * 100)}%` }}
                      className="w-full bg-[#6A1B9A] rounded-t-xl transition-all"
                    />
                  </div>
                  <span className="text-xs font-medium text-[#645E72]">{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
              <div className="text-xs text-[#645E72]">Available Seller Balance</div>
              <div className="text-2xl font-extrabold text-[#1A1625] tabular-nums mt-1">
                {availableBalance.toFixed(2)} Pi
              </div>
              <button
                type="button"
                onClick={() => {
                  setWithdrawErr('');
                  setWithdrawOpen(true);
                }}
                className="mt-3 w-full min-h-[42px] rounded-xl bg-[#FFC107] text-[#2B1F00] text-xs font-bold cursor-pointer"
              >
                Withdraw Pi Now
              </button>
            </div>
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
              <div className="text-xs text-[#645E72]">Escrow Balance (Pending Delivery)</div>
              <div className="text-2xl font-extrabold text-[#6A1B9A] tabular-nums mt-1">
                {lockedEscrowBalance.toFixed(2)} Pi
              </div>
              <p className="text-xs text-[#645E72] mt-1">Releases automatically upon buyer delivery confirmation.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'add-product' && (
        <form onSubmit={handleCreateProduct} className="max-w-xl rounded-3xl bg-white border border-[#E7E3EE] p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-[#1A1625]">Add New Marketplace Product</h2>
          <div>
            <label className="block text-xs font-semibold mb-1">Product Name</label>
            <input
              type="text"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              placeholder="e.g. Organic Honey & Ginger Wellness Pack"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Price (0.1–1000 Pi)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1000"
                value={prodPrice}
                onChange={(e) => setProdPrice(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#E7E3EE] text-sm tabular-nums"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={prodCat}
                onChange={(e) => setProdCat(e.target.value as Product['category'])}
                className="w-full min-h-[44px] px-2.5 rounded-xl border border-[#E7E3EE] text-sm bg-white"
              >
                <option value="Foodstuff">Foodstuff</option>
                <option value="Fashion">Fashion</option>
                <option value="Tutoring">Tutoring</option>
                <option value="Design">Design</option>
                <option value="Services">Services</option>
                <option value="Airtime/Data">Airtime/Data</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Stock</label>
              <input
                type="number"
                min="1"
                value={prodStock}
                onChange={(e) => setProdStock(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#E7E3EE] text-sm tabular-nums"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Product Photo</label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] bg-[#FAF8FC] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4 text-[#6A1B9A]" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setProdImage)} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setProdImage(GENERATED_IMAGES.fashion)}
                className="min-h-[42px] px-3 rounded-xl border border-[#E7E3EE] text-xs cursor-pointer"
              >
                Fashion Sample
              </button>
              <button
                type="button"
                onClick={() => setProdImage(GENERATED_IMAGES.design)}
                className="min-h-[42px] px-3 rounded-xl border border-[#E7E3EE] text-xs cursor-pointer"
              >
                Design Sample
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Describe quality, size, delivery window..."
              className="w-full p-3.5 rounded-xl border border-[#E7E3EE] text-sm"
            />
          </div>
          {prodError && <p className="text-xs font-semibold text-rose-600">{prodError}</p>}
          <button
            type="submit"
            className="w-full min-h-[48px] rounded-2xl bg-[#6A1B9A] text-white font-bold text-sm cursor-pointer"
          >
            Publish Product to Marketplace
          </button>
        </form>
      )}

      {tab === 'sales' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-8 text-center text-sm text-[#645E72]">
              No sales orders yet.
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#645E72]">
                    Buyer: {ord.buyerName} · {ord.createdAt}
                  </div>
                  <div className="text-base font-bold text-[#1A1625]">{ord.productName}</div>
                  <div className="text-xs text-[#6A1B9A] font-semibold tabular-nums">
                    Your Net Payout: {ord.sellerNetPi.toFixed(2)} Pi (after {adminSettings.afomiFeePercent}% AFOMI fee)
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <EscrowStatusBadge status={ord.status} />
                  {ord.status === 'ESCROW_LOCKED' && (
                    <button
                      type="button"
                      onClick={() => markOrderShipped(ord.id)}
                      className="min-h-[40px] px-4 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
                    >
                      Mark Shipped
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1A1625]">Review Worker Submissions for Posted Tasks</h2>
            <button
              type="button"
              onClick={() => navigate('post-task')}
              className="min-h-[40px] px-4 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Task</span>
            </button>
          </div>
          {submissions.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-8 text-center text-sm text-[#645E72]">
              No task submissions to review yet.
            </div>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-[#645E72]">
                    Worker: {s.workerName} · {s.submittedAt}
                  </div>
                  <div className="text-base font-bold text-[#1A1625]">{s.taskTitle}</div>
                  <p className="text-xs text-[#645E72]">{s.submissionText}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <EscrowStatusBadge status={s.status} />
                  {s.status === 'PENDING REVIEW' && (
                    <>
                      <button
                        type="button"
                        onClick={() => reviewTaskSubmission(s.id, 'APPROVE')}
                        className="min-h-[38px] px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewTaskSubmission(s.id, 'REJECT', 'Submission incomplete.')}
                        className="min-h-[38px] px-3.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'setup' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveShop({ name: shopName, description: shopDesc, location: shopLoc, logo: shopLogo });
            setTab('overview');
          }}
          className="max-w-xl rounded-3xl bg-white border border-[#E7E3EE] p-6 space-y-4"
        >
          <h2 className="text-lg font-extrabold text-[#1A1625]">Create / Update My Shop</h2>
          <div>
            <label className="block text-xs font-semibold mb-1">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Location</label>
            <input
              type="text"
              value={shopLoc}
              onChange={(e) => setShopLoc(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={shopDesc}
              onChange={(e) => setShopDesc(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-[#E7E3EE] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Shop Logo Upload</label>
            <label className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] bg-[#FAF8FC] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-[#6A1B9A]" />
              <span>Upload Logo</span>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setShopLogo)} className="hidden" />
            </label>
          </div>
          <button
            type="submit"
            className="w-full min-h-[48px] rounded-2xl bg-[#6A1B9A] text-white font-bold text-sm cursor-pointer"
          >
            Save Shop Profile
          </button>
        </form>
      )}

      {/* Withdraw Pi Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-[#1A1625]">Withdraw Pi from Seller Balance</h3>
            <p className="text-xs text-[#645E72] tabular-nums">
              Available for withdrawal: {availableBalance.toFixed(2)} Pi
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">Pi Wallet Address / Username</label>
              <input
                type="text"
                value={withdrawAddr}
                onChange={(e) => setWithdrawAddr(e.target.value)}
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
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E7E3EE] text-sm tabular-nums"
              />
            </div>
            {withdrawErr && <p className="text-xs font-semibold text-rose-600">{withdrawErr}</p>}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const res = withdrawPi(withdrawAmt, withdrawAddr);
                  if (res.ok) setWithdrawOpen(false);
                  else setWithdrawErr(res.message);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
              >
                Confirm Withdrawal
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

export const LearnPage: React.FC = () => {
  const { courses, completedCourseIds, completeCourse, user } = useAfomi();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizError, setQuizError] = useState('');
  const [certCourse, setCertCourse] = useState<Course | null>(null);
  const [playingVideo, setPlayingVideo] = useState(false);

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setLessonIdx(0);
    setShowQuiz(false);
    setAnswers({});
    setQuizError('');
    setPlayingVideo(false);
  };

  const submitQuiz = () => {
    if (!selectedCourse) return;
    const allAnswered = selectedCourse.quiz.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      setQuizError('Please answer all 3 questions to earn your certificate.');
      return;
    }
    const allCorrect = selectedCourse.quiz.every((q) => answers[q.id] === q.correctIndex);
    if (!allCorrect) {
      setQuizError('One or more answers are incorrect. Review the highlighted Escrow rules and try again!');
      return;
    }
    setQuizError('');
    completeCourse(selectedCourse.id);
    setCertCourse(selectedCourse);
    setSelectedCourse(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">AFOMI Learn</h1>
        <p className="text-sm text-[#645E72] mt-1">
          Short practical courses on earning Pi, selling safely, and understanding Escrow protection. Pass the quiz to unlock a certificate.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => {
          const completed = completedCourseIds.includes(course.id);
          return (
            <div
              key={course.id}
              className="rounded-2xl bg-white border border-[#E7E3EE] p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#645E72]">
                  <span>
                    {course.level} · {course.duration} · {course.lessons.length} Lessons
                  </span>
                  {completed && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <Award className="w-4 h-4" />
                      Certified
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-extrabold text-[#1A1625] mt-2">{course.title}</h2>
                <p className="text-xs text-[#645E72] mt-1.5 leading-relaxed">{course.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#F1EEF6]">
                <button
                  type="button"
                  onClick={() => openCourse(course)}
                  className="flex-1 min-h-[42px] rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{completed ? 'Review Course' : 'Start Course'}</span>
                </button>
                {completed && (
                  <button
                    type="button"
                    onClick={() => setCertCourse(course)}
                    className="min-h-[42px] px-3.5 rounded-xl bg-[#FFC107] text-[#2B1F00] text-xs font-bold cursor-pointer"
                  >
                    Certificate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Lesson & Quiz Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto border border-[#E7E3EE]">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#E7E3EE] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#6A1B9A]">{selectedCourse.title}</div>
                <div className="text-xs text-[#645E72]">
                  {showQuiz ? 'Final Certification Quiz' : `Lesson ${lessonIdx + 1} of ${selectedCourse.lessons.length}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-xl hover:bg-[#FAF8FC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {!showQuiz ? (
                <>
                  {/* Interactive Video Placeholder */}
                  <div className="rounded-2xl bg-[#1A1625] text-white p-6 flex flex-col items-center justify-center text-center min-h-[180px]">
                    <button
                      type="button"
                      onClick={() => setPlayingVideo((p) => !p)}
                      className="w-14 h-14 rounded-full bg-[#FFC107] text-[#2B1F00] flex items-center justify-center mb-3 cursor-pointer"
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </button>
                    <div className="text-sm font-bold">
                      {playingVideo ? 'Playing Lesson Video...' : selectedCourse.lessons[lessonIdx].title}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      {selectedCourse.lessons[lessonIdx].videoSummary} ({selectedCourse.lessons[lessonIdx].duration})
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-[#1A1625]">
                      {selectedCourse.lessons[lessonIdx].title}
                    </h3>
                    <p className="text-sm text-[#1A1625] mt-2 leading-relaxed">
                      {selectedCourse.lessons[lessonIdx].content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E7E3EE]">
                    <button
                      type="button"
                      disabled={lessonIdx === 0}
                      onClick={() => {
                        setLessonIdx((i) => Math.max(0, i - 1));
                        setPlayingVideo(false);
                      }}
                      className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] disabled:opacity-40 text-xs font-semibold cursor-pointer"
                    >
                      Previous Lesson
                    </button>
                    {lessonIdx < selectedCourse.lessons.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setLessonIdx((i) => i + 1);
                          setPlayingVideo(false);
                        }}
                        className="min-h-[42px] px-5 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
                      >
                        Next Lesson
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowQuiz(true)}
                        className="min-h-[42px] px-5 rounded-xl bg-[#FFC107] text-[#2B1F00] text-xs font-bold cursor-pointer"
                      >
                        Take Final Quiz
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  {selectedCourse.quiz.map((q, qIdx) => (
                    <div key={q.id} className="rounded-2xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 space-y-2.5">
                      <p className="text-sm font-bold text-[#1A1625]">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer ${
                              answers[q.id] === optIdx
                                ? 'bg-[#F5EEFA] border-[#6A1B9A] font-semibold text-[#6A1B9A]'
                                : 'bg-white border-[#E7E3EE] text-[#1A1625]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === optIdx}
                              onChange={() => setAnswers((a) => ({ ...a, [q.id]: optIdx }))}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {quizError && (
                    <p className="text-xs font-semibold text-rose-600">{quizError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowQuiz(false)}
                      className="min-h-[44px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
                    >
                      Back to Lessons
                    </button>
                    <button
                      type="button"
                      onClick={submitQuiz}
                      className="flex-1 min-h-[44px] rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
                    >
                      Submit Quiz &amp; Claim Certificate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {certCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl border-4 border-[#FFC107] p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#6A1B9A] text-[#FFC107] mx-auto flex items-center justify-center">
              <Award className="w-9 h-9" />
            </div>
            <div className="text-xs font-bold tracking-widest text-[#6A1B9A] uppercase">
              AFOMI Academy Verified Certificate
            </div>
            <h2 className="text-2xl font-extrabold text-[#1A1625]">{user?.name || 'Amara Nwosu'}</h2>
            <p className="text-sm text-[#645E72]">
              has successfully completed all lessons and passed the Escrow mastery assessment for
            </p>
            <div className="text-lg font-extrabold text-[#6A1B9A]">{certCourse.title}</div>
            <div className="pt-3 border-t border-[#E7E3EE] flex items-center justify-between text-xs text-[#645E72]">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4" />
                Verified on AFOMI
              </span>
              <span className="tabular-nums">Issued: 2026-11-25</span>
            </div>
            <button
              type="button"
              onClick={() => setCertCourse(null)}
              className="mt-2 w-full min-h-[44px] rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
