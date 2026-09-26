import React from 'react';
import {
  ShoppingBag,
  FileSpreadsheet,
  Layers,
  Wrench,
  Sparkles,
  PackageCheck,
  Lock,
  LogOut,
  Building2,
  ShieldCheck,
  Truck,
  LayoutGrid,
  User,
  WifiOff,
} from 'lucide-react';
import { ProductFamily, StoreSettings, CustomerUser } from '../types';
import { INITIAL_STORE_SETTINGS } from '../data/initialProducts';
import { formatDZD } from '../utils/pdfGenerator';
import { TulipLogo } from './TulipLogo';
import { AppLanguage, translations } from '../translations';

interface HeaderProps {
  storeSettings?: StoreSettings;
  activeFamily: ProductFamily | 'all';
  onSelectFamily: (fam: ProductFamily | 'all') => void;
  cartCount: number;
  cartTotalDA: number;
  onOpenCart: () => void;
  onOpenExcelSync: () => void;
  onOpenOrders: () => void;
  ordersCount: number;
  lastStockSyncDate?: string;
  isAdminMode?: boolean;
  onToggleAdminMode?: () => void;
  onNavigateToAdmin?: () => void;
  currentCustomer?: CustomerUser | null;
  onOpenCustomerAuth?: (initialTab?: 'login' | 'register') => void;
  onLogoutCustomer?: () => void;
  isPricesVisible?: boolean;
  lang?: AppLanguage;
  onSelectLanguage?: (lang: AppLanguage) => void;
  onOpenOrderTracking?: () => void;
  currentInterface?: 'showroom' | 'quick';
  onToggleInterface?: (mode: 'showroom' | 'quick') => void;
  onOpenInterfaceChoiceModal?: () => void;
  isOnline?: boolean;
  cachedImagesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeFamily,
  onSelectFamily,
  cartCount,
  cartTotalDA,
  onOpenCart,
  onOpenExcelSync,
  onOpenOrders,
  ordersCount,
  isAdminMode = false,
  onToggleAdminMode,
  currentCustomer,
  onOpenCustomerAuth,
  onLogoutCustomer,
  isPricesVisible = false,
  lang = 'ar',
  onSelectLanguage,
  onOpenOrderTracking,
  currentInterface = 'showroom',
  onToggleInterface,
  isOnline = true,
  cachedImagesCount = 0,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Scroll detection to hide switch mode button bar when scrolling
  const [isScrolledDown, setIsScrolledDown] = React.useState(false);

  React.useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 40) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
      }
      lastY = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md transition-all" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Offline Status Bar */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-600 shadow-xs">
          <WifiOff className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span>
            {isRtl
              ? `الوضع غير المتصل نشط • الكتالوج والصور (${cachedImagesCount > 0 ? `${cachedImagesCount} صورة محفوظة` : 'جاهزة'}) متاحة للطلب دون إنترنت`
              : `Mode Hors-Ligne • Catalogue & photos (${cachedImagesCount > 0 ? `${cachedImagesCount} photos en cache` : 'sauvegardées'}) prêts pour vos commandes`}
          </span>
        </div>
      )}
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand & Tulip Logo */}
        <div className="flex items-center gap-3">
          <TulipLogo variant="horizontal" size="md" />
        </div>

        {/* Product Family Filter Navigation (Desktop only) */}
        <div className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button
            id="nav-family-all"
            type="button"
            onClick={() => onSelectFamily('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeFamily === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            {t.allProducts}
          </button>
          <button
            id="nav-family-extrait"
            type="button"
            onClick={() => onSelectFamily('Extrait')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFamily === 'Extrait'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            {t.extraitsTitle}
          </button>
          <button
            id="nav-family-flacon"
            type="button"
            onClick={() => onSelectFamily('Flacon')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFamily === 'Flacon'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t.flaconsTitle}
          </button>
          <button
            id="nav-family-accessoire"
            type="button"
            onClick={() => onSelectFamily('Accessoire')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeFamily === 'Accessoire'
                ? 'bg-teal-600 text-white shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            {t.accessoriesTitle}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* CUSTOMER AUTHENTICATION STATUS */}
          {currentCustomer ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 border border-amber-500/40 px-2 sm:px-3 py-1.5 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline text-amber-300 font-bold max-w-[100px] sm:max-w-[140px] truncate">
                {currentCustomer.username}
              </span>
              {onLogoutCustomer && (
                <button
                  type="button"
                  onClick={onLogoutCustomer}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-750 transition cursor-pointer"
                  title={t.logoutBtn}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {onOpenCustomerAuth && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenCustomerAuth('login')}
                    className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title={t.loginBtn}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">{t.loginBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCustomerAuth('register')}
                    className="hidden md:flex px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold items-center gap-1.5 transition cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.requestAccessBtn}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* ADMIN TOOLS: STRICTLY HIDDEN UNLESS isAdminMode is TRUE */}
          {isAdminMode && (
            <>
              <button
                id="btn-admin-orders"
                type="button"
                onClick={onOpenOrders}
                className="relative px-2.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="Consulter les commandes reçues"
              >
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Commandes</span>
                {ordersCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                    {ordersCount}
                  </span>
                )}
              </button>

              <button
                id="btn-excel-sync"
                type="button"
                onClick={onOpenExcelSync}
                className="px-2.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center gap-1.5 border border-emerald-500/50 cursor-pointer"
                title="Importer le fichier Excel POS"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </>
          )}

          {/* ORDER TRACKING BUTTON (Placed Next to Cart Button as requested) */}
          {onOpenOrderTracking && (
            <button
              id="btn-header-track-order"
              type="button"
              onClick={onOpenOrderTracking}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title={t.trackOrderBtn}
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{t.trackOrderBtn}</span>
            </button>
          )}

          {/* Cart / Pre-Order Button */}
          <button
            id="btn-open-cart"
            type="button"
            onClick={onOpenCart}
            className="relative px-2.5 sm:px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 sm:gap-2 transition shadow-md cursor-pointer"
            title={t.cartBtn}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{t.cartBtn}</span>
            {cartCount > 0 ? (
              <span className="flex items-center gap-1">
                <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold">
                  {cartCount}
                </span>
                {isPricesVisible && (
                  <span className="hidden md:inline text-[11px] font-bold opacity-90 font-mono">
                    ({formatDZD(cartTotalDA)})
                  </span>
                )}
              </span>
            ) : (
              <span className="hidden sm:inline text-[11px] opacity-75 font-normal">(0)</span>
            )}
          </button>
        </div>
      </div>

      {/* Top navigation filter bar is now hidden on mobile version as requested */}

      {/* DEDICATED SUB-HEADER BAR: SWITCH MODE CENTERED (Smoothly hides on scroll down, keeps search section prominent) */}
      {onToggleInterface && (
        <div
          className={`bg-slate-950 border-t border-slate-800 flex items-center justify-center relative transition-all duration-300 overflow-hidden ${
            isScrolledDown ? 'max-h-0 py-0 opacity-0 border-transparent pointer-events-none' : 'max-h-16 py-2 opacity-100'
          }`}
        >
          {/* Centered Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-750 rounded-xl p-1 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => onToggleInterface('showroom')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                currentInterface === 'showroom'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t.showroomMode}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{t.showroomMode}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleInterface('quick')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                currentInterface === 'quick'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={t.quickOrderMode}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>{t.quickOrderMode}</span>
            </button>
          </div>

          {/* Unobtrusive Admin indicator if active (positioned on right side) */}
          {isAdminMode && (
            <div className="absolute right-3 sm:right-4 flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-[11px] text-emerald-300">
              <span className="hidden sm:inline">Admin Actif</span>
              {onToggleAdminMode && (
                <button
                  type="button"
                  onClick={onToggleAdminMode}
                  className="text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Masquer mode admin"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
