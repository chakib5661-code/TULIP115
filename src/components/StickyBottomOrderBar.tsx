import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';
import { AppLanguage, translations } from '../translations';
import { formatDZD } from '../utils/pdfGenerator';

interface StickyBottomOrderBarProps {
  cart: CartItem[];
  isPricesVisible: boolean;
  lang?: AppLanguage;
  onOpenCart: () => void;
}

export const StickyBottomOrderBar: React.FC<StickyBottomOrderBarProps> = ({
  cart,
  isPricesVisible,
  lang = 'ar',
  onOpenCart,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const validCart = cart.filter((item) => item && item.product && typeof item.quantity === 'number');
  if (validCart.length === 0) return null;

  const totalUnitsOrGrams = validCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPriceDA = validCart.reduce((sum, item) => {
    const p = item.product;
    if (!p) return sum;
    const unitPrice =
      p.discountPercent && p.discountPercent > 0
        ? Math.round((p.priceDA || 0) * (1 - p.discountPercent / 100))
        : (p.priceDA || 0);
    return sum + unitPrice * (item.quantity || 0);
  }, 0);

  return (
    <aside
      aria-label="Récapitulatif de votre commande"
      className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 py-2.5 sm:py-3 px-3 sm:px-4 z-40 shadow-2xl"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>
                {cart.length} <span className="hidden xs:inline sm:inline">{lang === 'ar' ? 'أصناف' : 'références'}</span>
              </span>
              <span>•</span>
              <span className="text-slate-300">
                {totalUnitsOrGrams} <span className="hidden sm:inline">{lang === 'ar' ? 'وحدة / غرام' : 'unités / g'}</span>
              </span>
            </div>

            {/* Total Price Display */}
            <div className="text-xs font-mono font-extrabold flex items-center gap-1.5 mt-0.5">
              {isPricesVisible ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-amber-300 font-sans font-bold">
                    {lang === 'ar' ? 'المجموع :' : 'Total :'}
                  </span>
                  <span className="text-amber-400 text-sm sm:text-base font-black tracking-tight">
                    {formatDZD(totalPriceDA)}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-sans font-normal truncate">
                  {t.totalHiddenNotice}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-sticky-bar-cart"
            type="button"
            onClick={onOpenCart}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg cursor-pointer transition"
          >
            <span>{t.cartBtn}</span>
            <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full text-[11px]">
              {cart.length}
            </span>
            {isPricesVisible && (
              <span className="text-slate-950 font-mono text-xs font-bold hidden xs:inline sm:inline">
                • {formatDZD(totalPriceDA)}
              </span>
            )}
            <ArrowRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
};
