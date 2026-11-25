import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Lock,
  PlusCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Wallet,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, FundsLockedTag, PiValue } from '../components/AfomiUI';

export const HomeScreen: React.FC<{
  onSelectTask?: (taskId: string) => void;
  onSelectProduct?: (productId: string) => void;
}> = ({ onSelectTask, onSelectProduct }) => {
  const {
    user,
    isCeo,
    isAdminUnlocked,
    availableBalance,
    weeklyEarnings,
    lockedEscrowBalance,
    tasks,
    products,
    subscriptionPlans,
    navigate,
    addToCart,
  } = useAfomi();
  const [query, setQuery] = useState('');

  const visibleProducts = useMemo(() => products.filter((p) => !p.hidden), [products]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks.slice(0, 3);
    return tasks
      .filter((t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      .slice(0, 4);
  }, [tasks, query]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleProducts.slice(0, 3);
    return visibleProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sellerName.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [visibleProducts, query]);

  const topSellers = useMemo(() => {
    const seen = new Set<string>();
    return visibleProducts
      .filter((p) => {
        if (seen.has(p.sellerName)) return false;
        seen.add(p.sellerName);
        return true;
      })
      .slice(0, 4);
  }, [visibleProducts]);

  const quickActions = [
    { label: 'Post Task', icon: PlusCircle, route: 'post-task' as const, accent: true },
    { label: 'Sell Product', icon: ShoppingBag, route: 'shop' as const, accent: false },
    { label: 'My Shop', icon: Store, route: 'shop' as const, accent: false },
    { label: 'Learn', icon: BookOpen, route: 'learn' as const, accent: false },
    { label: 'Escrow Wallet', icon: Lock, route: 'escrow' as const, accent: false },
    { label: 'Admin Review', icon: ShieldCheck, route: 'admin' as const, accent: false },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting & Balance Hero Card */}
      <section className="rounded-3xl bg-[#6A1B9A] text-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hello, {user?.name || 'Amara Nwosu'}
              </h1>
              {user?.kycVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#FFC107] text-[#2B1F00] px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>KYC Verified</span>
                </span>
              )}
            </div>
            <p className="text-sm text-purple-100 mt-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFC107] shrink-0" />
              <span>Your money is safe. AFOMI holds it until work is approved.</span>
            </p>
          </div>

          {(isCeo || isAdminUnlocked) && (
            <div className="flex flex-wrap gap-2 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => navigate('admin-dashboard')}
                className="px-4 py-3 min-h-[44px] rounded-2xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] font-bold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('ceo')}
                className="px-4 py-3 min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-sm inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FFC107]" />
                <span>CEO AI</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate('wallet')}
            className="text-left rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 p-4 transition-colors cursor-pointer"
          >
            <div className="text-xs text-purple-100 font-medium">Pi Balance</div>
            <div className="text-2xl font-extrabold mt-1 tabular-nums">
              {availableBalance.toFixed(2)} Pi
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('wallet')}
            className="text-left rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 p-4 transition-colors cursor-pointer"
          >
            <div className="text-xs text-purple-100 font-medium">Earnings This Week</div>
            <div className="text-2xl font-extrabold mt-1 tabular-nums text-[#FFC107]">
              +{weeklyEarnings.toFixed(2)} Pi
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('escrow')}
            className="text-left rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 p-4 transition-colors cursor-pointer"
          >
            <div className="text-xs text-purple-100 font-medium">Locked in Escrow</div>
            <div className="text-2xl font-extrabold mt-1 tabular-nums">
              {lockedEscrowBalance.toFixed(2)} Pi
            </div>
          </button>
        </div>
      </section>

      {/* Search & Quick Actions */}
      <section className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-[#645E72] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search micro-tasks, products, sellers, or subscriptions..."
            className="w-full min-h-[48px] pl-12 pr-4 rounded-2xl bg-white border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                type="button"
                onClick={() => navigate(act.route)}
                className={`min-h-[72px] p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-colors cursor-pointer ${
                  act.accent
                    ? 'bg-[#FFC107] border-[#FFC107] text-[#2B1F00] hover:bg-[#f0b400]'
                    : 'bg-white border-[#E7E3EE] text-[#1A1625] hover:border-[#6A1B9A]'
                }`}
              >
                <Icon className={`w-5 h-5 ${act.accent ? 'text-[#2B1F00]' : 'text-[#6A1B9A]'}`} />
                <span className="text-xs font-semibold leading-tight">{act.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Tasks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1A1625]">Featured Tasks</h2>
            <p className="text-xs text-[#645E72] mt-0.5">Every task budget is pre-funded in AFOMI Escrow</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('tasks')}
            className="text-sm font-semibold text-[#6A1B9A] inline-flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>All {tasks.length} Tasks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-8 text-center">
            <p className="text-sm font-bold text-[#1A1625]">No tasks yet</p>
            <p className="text-xs text-[#645E72] mt-1">Post an Escrow-funded task or adjust your search.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  if (onSelectTask) onSelectTask(task.id);
                  else navigate('tasks');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('tasks')}
                className="rounded-2xl bg-white border border-[#E7E3EE] p-5 hover:border-[#6A1B9A] transition-colors flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs text-[#645E72] font-medium">
                      {task.category} · {task.estimatedTime} · {task.difficulty}
                    </span>
                    <FundsLockedTag />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1625] leading-snug">{task.title}</h3>
                  <p className="text-xs text-[#645E72] mt-2 line-clamp-2">{task.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1EEF6] flex items-center justify-between">
                  <div>
                    <div className="text-base font-extrabold text-[#6A1B9A] tabular-nums">
                      {task.payPerWorker.toFixed(2)} Pi
                    </div>
                    <div className="text-[11px] text-[#645E72] tabular-nums">
                      Spots Left: {task.spotsLeft}/{task.totalWorkers}
                    </div>
                  </div>
                  <span className="px-3.5 py-2 rounded-xl bg-[#F5EEFA] text-[#6A1B9A] text-xs font-bold">
                    Start Task
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trending Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1A1625]">Trending Products</h2>
            <p className="text-xs text-[#645E72] mt-0.5">Pay in Pi — Escrow releases only after delivery confirmation</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('market')}
            className="text-sm font-semibold text-[#6A1B9A] inline-flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Browse Market</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E7E3EE] p-8 text-center">
            <p className="text-sm font-bold text-[#1A1625]">No products yet</p>
            <p className="text-xs text-[#645E72] mt-1">List a product in My Shop or adjust your search.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl bg-white border border-[#E7E3EE] overflow-hidden flex flex-col justify-between"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectProduct) onSelectProduct(product.id);
                    else navigate('market');
                  }}
                  className="text-left cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-[#FAF8FC] overflow-hidden">
                    <AfomiImage src={product.image} alt={product.name} fallbackLabel={product.category} />
                  </div>
                  <div className="p-4 pb-2">
                    <div className="text-xs text-[#645E72]">
                      {product.category} · {product.location}
                    </div>
                    <h3 className="text-base font-bold text-[#1A1625] mt-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#645E72]">
                      <span className="font-medium text-[#1A1625]">{product.sellerName}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {product.sellerRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="p-4 pt-2 flex items-center justify-between gap-3">
                  <PiValue amount={product.pricePi} showNaira className="text-base font-extrabold text-[#6A1B9A]" />
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top Sellers & Recommended Subscriptions */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1625]">Top Sellers</h2>
            <button
              type="button"
              onClick={() => navigate('market')}
              className="text-xs font-semibold text-[#6A1B9A] hover:underline cursor-pointer"
            >
              View Directory
            </button>
          </div>
          {topSellers.length === 0 ? (
            <p className="text-xs text-[#645E72] py-6 text-center">No sellers yet.</p>
          ) : (
            <div className="divide-y divide-[#F1EEF6]">
              {topSellers.map((seller) => (
                <div key={seller.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#1A1625]">{seller.sellerName}</div>
                    <div className="text-xs text-[#645E72]">
                      {seller.category} · {seller.location}
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="text-xs font-bold text-[#6A1B9A]">{seller.salesCount} orders</div>
                    <div className="text-xs text-amber-600 font-semibold">{seller.sellerRating.toFixed(1)} ★</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-[#E7E3EE] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1625]">Recommended Subscriptions</h2>
            <button
              type="button"
              onClick={() => navigate('subscriptions')}
              className="text-xs font-semibold text-[#6A1B9A] hover:underline cursor-pointer"
            >
              See All {subscriptionPlans.length} Plans
            </button>
          </div>
          {subscriptionPlans.length === 0 ? (
            <p className="text-xs text-[#645E72] py-6 text-center">No subscriptions yet.</p>
          ) : (
            <div className="divide-y divide-[#F1EEF6]">
              {subscriptionPlans.slice(0, 3).map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#1A1625]">{sub.title}</div>
                    <div className="text-xs text-[#645E72]">
                      {sub.providerName} · Cancel anytime
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('subscriptions')}
                    className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#FFF8E1] border border-[#FFC107] text-[#2B1F00] text-xs font-bold whitespace-nowrap cursor-pointer tabular-nums"
                  >
                    {sub.periodLabel}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
