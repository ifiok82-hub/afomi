import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AfomiImage, EscrowStatusBadge, FundsLockedTag, PiValue } from '../components/AfomiUI';
import { loginWithPi as authenticatePiSession } from '../lib/piAuth';
import { payForProduct } from '../lib/piPayments';
import { Product, ProductCategory } from '../types/afomi';

const MARKET_CATEGORIES: ProductCategory[] = [
  'All',
  'Foodstuff',
  'Fashion',
  'Tutoring',
  'Design',
  'Services',
  'Airtime/Data',
];

export const MarketplaceScreen: React.FC<{
  initialProductId?: string | null;
  cartDrawerOpen?: boolean;
  onCloseCartDrawer?: () => void;
}> = ({ initialProductId, cartDrawerOpen = false, onCloseCartDrawer }) => {
  const {
    products,
    cart,
    orders,
    user,
    availableBalance,
    nairaRate,
    paymentPhase,
    piAuthLoading,
    loginWithPi,
    addToCart,
    updateCartQty,
    removeFromCart,
    checkoutCartWithEscrow,
    confirmOrderDelivery,
    autoReleaseOrder3Days,
    disputeOrder,
    reportListing,
    showToast,
  } = useAfomi();

  const [tab, setTab] = useState<'shop' | 'orders'>('shop');
  const [category, setCategory] = useState<ProductCategory>('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    () => (initialProductId ? products.find((p) => p.id === initialProductId && !p.hidden) || null : null)
  );
  const [localCartOpen, setLocalCartOpen] = useState(false);
  const [disputeTargetId, setDisputeTargetId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [reportTarget, setReportTarget] = useState<Product | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [paying, setPaying] = useState(false);

  const isCartOpen = cartDrawerOpen || localCartOpen;
  const closeCart = () => {
    setLocalCartOpen(false);
    if (onCloseCartDrawer) onCloseCartDrawer();
  };

  const visibleProducts = useMemo(() => products.filter((p) => !p.hidden), [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = visibleProducts.filter((p) => {
      const catOk = category === 'All' || p.category === category;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sellerName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return catOk && qOk;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.pricePi - b.pricePi);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.pricePi - a.pricePi);
    if (sortBy === 'rating') return [...list].sort((a, b) => b.sellerRating - a.sellerRating);
    return [...list].sort((a, b) => b.salesCount - a.salesCount);
  }, [visibleProducts, category, search, sortBy]);

  const cartTotalPi = useMemo(
    () => Number(cart.reduce((sum, item) => sum + item.product.pricePi * item.quantity, 0).toFixed(2)),
    [cart]
  );

  const handleCheckout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (paying) return;
    setPaying(true);
    try {
      await authenticatePiSession();
      const res = await checkoutCartWithEscrow();
      if (res.ok) {
        closeCart();
        setTab('orders');
      } else {
        window.alert(`Payment failed: ${res.message}`);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err || 'Unknown Pi error');
      const errorMsg = `Payment failed: ${msg}`;
      showToast(errorMsg, 'error');
      window.alert(errorMsg);
    } finally {
      setPaying(false);
    }
  };

  const handleBuyNow = async (
    e: React.MouseEvent<HTMLButtonElement>,
    product: Product
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (paying) return;
    setPaying(true);
    try {
      await authenticatePiSession();
      await payForProduct({
        productId: product.id,
        productTitle: product.title || product.name,
        amount: Number(product.pricePi),
        sellerUid: product.sellerUid || '',
      });
      const successMsg = 'Payment held in escrow!';
      showToast(successMsg, 'success');
      window.alert(successMsg);
      setSelectedProduct(null);
      setTab('orders');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err || 'Unknown Pi error');
      const errorMsg = `Payment failed: ${msg}`;
      showToast(errorMsg, 'error');
      window.alert(errorMsg);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1625]">AFOMI Marketplace</h1>
          <p className="text-sm text-[#645E72] mt-1">
            Buyers pay into AFOMI Escrow via Pi Testnet first. Funds release to sellers only after delivery confirmation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLocalCartOpen(true)}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer tabular-nums"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)}) · {cartTotalPi.toFixed(2)} Pi</span>
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-[#E7E3EE] pb-3">
        <button
          type="button"
          onClick={() => setTab('shop')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            tab === 'shop'
              ? 'bg-[#6A1B9A] text-white'
              : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
          }`}
        >
          Shop Listings ({visibleProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
            tab === 'orders'
              ? 'bg-[#6A1B9A] text-white'
              : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
          }`}
        >
          My Escrow Orders ({orders.length})
        </button>
      </div>

      {tab === 'shop' ? (
        <>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#645E72] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search foodstuff, Ankara fashion, tutoring, design, airtime..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="min-h-[44px] px-3.5 rounded-xl bg-white border border-[#E7E3EE] text-sm font-medium text-[#1A1625] focus:outline-none focus:border-[#6A1B9A]"
              >
                <option value="popular">Sort: Best Selling</option>
                <option value="price-asc">Sort: Price Low to High</option>
                <option value="price-desc">Sort: Price High to Low</option>
                <option value="rating">Sort: Highest Rated</option>
              </select>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {MARKET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    category === cat
                      ? 'bg-[#6A1B9A] text-white'
                      : 'bg-white border border-[#E7E3EE] text-[#645E72] hover:text-[#1A1625]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-10 text-center">
              <p className="text-base font-bold text-[#1A1625]">
                {visibleProducts.length === 0 ? 'No products yet' : 'No products match your search'}
              </p>
              <p className="text-xs text-[#645E72] mt-1">
                {visibleProducts.length === 0
                  ? 'Add a product in My Shop or enable Demo Mode in Admin Settings.'
                  : 'Try clearing your search or selecting All categories.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl bg-white border border-[#E7E3EE] overflow-hidden flex flex-col justify-between hover:border-[#6A1B9A] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="text-left cursor-pointer"
                  >
                    <div className="aspect-[4/3] bg-[#FAF8FC] overflow-hidden">
                      <AfomiImage src={product.image} alt={product.name} fallbackLabel={product.category} />
                    </div>
                    <div className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#645E72]">
                        <span>{product.category}</span>
                        <FundsLockedTag label="Escrow Protected" />
                      </div>
                      <h2 className="text-base font-bold text-[#1A1625] mt-1.5 line-clamp-2">{product.name}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#645E72]">
                        <span className="font-semibold text-[#1A1625]">{product.sellerName}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {product.sellerRating.toFixed(1)}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {product.location}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="p-4 pt-2 border-t border-[#F1EEF6] flex items-center justify-between gap-2">
                    <div>
                      <PiValue amount={product.pricePi} showNaira className="text-base font-extrabold text-[#6A1B9A]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Report product"
                        onClick={() => {
                          setReportTarget(product);
                          setReportReason('');
                        }}
                        className="min-h-[40px] min-w-[36px] rounded-xl border border-[#E7E3EE] text-[#645E72] hover:text-rose-600 flex items-center justify-center cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="min-h-[40px] px-3 rounded-xl border border-[#E7E3EE] text-xs font-semibold text-[#1A1625] hover:border-[#6A1B9A] cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => addToCart(product, 1)}
                        className="min-h-[40px] px-3.5 rounded-xl bg-[#6A1B9A] hover:bg-[#581482] text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#E7E3EE] p-10 text-center text-sm text-[#645E72]">
              No marketplace orders yet.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white border border-[#E7E3EE] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8FC] border border-[#E7E3EE] shrink-0">
                      <AfomiImage src={order.productImage} alt={order.productName} />
                    </div>
                    <div>
                      <div className="text-xs text-[#645E72]">
                        Order #{order.id} · Seller:{' '}
                        <span className="font-semibold text-[#1A1625]">{order.sellerName}</span>
                      </div>
                      <h3 className="text-base font-bold text-[#1A1625] mt-0.5">
                        {order.productName} (×{order.quantity})
                      </h3>
                      <div className="text-xs text-[#645E72] mt-0.5 tabular-nums">
                        Total Locked: <span className="font-bold text-[#6A1B9A]">{order.totalPi.toFixed(2)} Pi</span> ·
                        Seller Net: {order.sellerNetPi.toFixed(2)} Pi · AFOMI Fee: {order.afomiFeePi.toFixed(2)} Pi
                      </div>
                    </div>
                  </div>
                  <EscrowStatusBadge
                    status={
                      order.status === 'ESCROW_LOCKED'
                        ? 'Payment Locked in Escrow'
                        : order.status === 'SHIPPED'
                        ? 'Shipped · Funds Locked'
                        : order.status === 'DELIVERED_RELEASED'
                        ? 'RELEASED'
                        : order.status
                    }
                  />
                </div>

                {(order.status === 'ESCROW_LOCKED' || order.status === 'SHIPPED') && (
                  <div className="rounded-xl bg-[#FAF8FC] border border-[#E7E3EE] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-[#645E72]">
                      <span className="font-semibold text-[#1A1625]">Escrow Protection Active:</span> Seller will be paid
                      after you confirm delivery (or auto-releases in {order.autoReleaseDaysLeft} days).
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => confirmOrderDelivery(order.id)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Delivery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => autoReleaseOrder3Days(order.id)}
                        className="min-h-[42px] px-3 py-2 rounded-xl border border-[#E7E3EE] bg-white text-xs font-semibold text-[#645E72] hover:text-[#1A1625] cursor-pointer"
                      >
                        Simulate 3-Day Auto-Release
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDisputeTargetId(order.id);
                          setDisputeReason('');
                        }}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Dispute</span>
                      </button>
                    </div>
                  </div>
                )}

                {order.status === 'DISPUTED' && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
                    <span className="font-bold">Dispute Active (Funds Frozen in Escrow):</span> {order.disputeReason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto border border-[#E7E3EE]">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#E7E3EE] flex items-center justify-between">
              <FundsLockedTag label="AFOMI Marketplace Escrow" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReportTarget(selectedProduct);
                    setReportReason('');
                  }}
                  className="min-h-[36px] px-3 rounded-lg border border-[#E7E3EE] text-xs font-semibold text-rose-600 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-[#FAF8FC] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF8FC] border border-[#E7E3EE]">
                <AfomiImage src={selectedProduct.image} alt={selectedProduct.name} />
              </div>
              <div>
                <div className="text-xs text-[#645E72]">
                  {selectedProduct.category} · {selectedProduct.location} · Delivery: {selectedProduct.deliveryEstimate}
                </div>
                <h2 className="text-2xl font-extrabold text-[#1A1625] mt-1">{selectedProduct.name}</h2>
                <div className="mt-2">
                  <PiValue
                    amount={selectedProduct.pricePi}
                    showNaira
                    className="text-2xl font-extrabold text-[#6A1B9A]"
                  />
                </div>
                <p className="text-sm text-[#645E72] mt-3 leading-relaxed">{selectedProduct.description}</p>
              </div>

              {!user?.piAuthenticated && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-amber-900">Please Login with Pi first to pay.</span>
                  <button
                    type="button"
                    disabled={piAuthLoading}
                    onClick={() => void loginWithPi()}
                    className="min-h-[38px] px-4 rounded-xl bg-[#6A1B9A] text-white text-xs font-bold cursor-pointer"
                  >
                    {piAuthLoading ? 'Connecting...' : 'Login with Pi'}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={paying}
                  onClick={(e) => void handleBuyNow(e, selectedProduct)}
                  className="flex-1 min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] disabled:bg-slate-200 disabled:text-slate-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFC107]" />
                      <span>
                        {paymentPhase === 'approving'
                          ? 'Server Approving...'
                          : paymentPhase === 'completing'
                          ? 'Verifying Tx...'
                          : 'Processing Pi Payment...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#FFC107]" />
                      <span>Buy Now with Pi (Lock in Escrow)</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct, 1);
                    setSelectedProduct(null);
                    setLocalCartOpen(true);
                  }}
                  className="min-h-[48px] px-6 rounded-2xl bg-[#FFC107] hover:bg-[#f0b400] text-[#2B1F00] font-bold text-sm cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between border-l border-[#E7E3EE]">
            <div className="p-5 border-b border-[#E7E3EE] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#1A1625]">Checkout Cart</h2>
                <p className="text-xs text-[#645E72]">Pi Testnet Payment goes to AFOMI Escrow, not seller</p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-[#FAF8FC] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-10 h-10 text-[#D5CEE0] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#1A1625]">Your cart is empty</p>
                  <p className="text-xs text-[#645E72] mt-1">Add marketplace products to pay safely via Escrow.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="rounded-2xl border border-[#E7E3EE] p-3.5 flex items-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FAF8FC] shrink-0">
                      <AfomiImage src={item.product.image} alt={item.product.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#1A1625] truncate">{item.product.name}</div>
                      <div className="text-xs font-semibold text-[#6A1B9A] tabular-nums mt-0.5">
                        {(item.product.pricePi * item.quantity).toFixed(2)} Pi
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg border border-[#E7E3EE] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold tabular-nums w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-[#E7E3EE] flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-[#E7E3EE] bg-[#FAF8FC] space-y-3">
                <div className="flex justify-between text-xs text-[#645E72]">
                  <span>Available Balance</span>
                  <span className="font-semibold tabular-nums">{availableBalance.toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#1A1625]">
                  <span>Total to Lock in Escrow</span>
                  <span className="text-[#6A1B9A] tabular-nums">
                    {cartTotalPi.toFixed(2)} Pi (₦{Math.round(cartTotalPi * nairaRate).toLocaleString()})
                  </span>
                </div>
                {!user?.piAuthenticated && (
                  <button
                    type="button"
                    disabled={piAuthLoading}
                    onClick={() => void loginWithPi()}
                    className="w-full min-h-[42px] rounded-xl bg-[#FFC107] text-[#2B1F00] font-bold text-xs cursor-pointer"
                  >
                    {piAuthLoading ? 'Connecting Pi Testnet...' : 'Login with Pi first'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={!user?.piAuthenticated || paying}
                  onClick={(e) => void handleCheckout(e)}
                  className="w-full min-h-[48px] rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] disabled:bg-slate-200 disabled:text-slate-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFC107]" />
                      <span>Verifying Pi Payment on Backend...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#FFC107]" />
                      <span>
                        {user?.piAuthenticated ? 'Pay with Pi (Lock in Escrow)' : 'Please Login with Pi first'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeTargetId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-[#1A1625]">Report Problem &amp; Freeze Escrow</h3>
            <p className="text-xs text-[#645E72]">
              Your Pi stays safely locked inside AFOMI Escrow while an Admin reviews this dispute.
            </p>
            <textarea
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Describe what went wrong (missing item, wrong size, damaged package)..."
              className="w-full p-3 rounded-xl border border-[#E7E3EE] text-sm focus:outline-none focus:border-[#6A1B9A]"
            />
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  disputeOrder(disputeTargetId, disputeReason);
                  setDisputeTargetId(null);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Freeze Funds &amp; Open Dispute
              </button>
              <button
                type="button"
                onClick={() => setDisputeTargetId(null)}
                className="min-h-[44px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Product Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-[#1A1625]">Report Product</h3>
            <p className="text-xs text-[#645E72]">Reporting: {reportTarget.name}</p>
            <textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Why are you reporting this product?"
              className="w-full p-3 rounded-xl border border-[#E7E3EE] text-sm"
            />
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  reportListing('product', reportTarget.id, reportTarget.name, reportReason);
                  setReportTarget(null);
                }}
                className="flex-1 min-h-[42px] rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Submit Report
              </button>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="min-h-[42px] px-4 rounded-xl border border-[#E7E3EE] text-xs font-semibold cursor-pointer"
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
