import React from 'react';
import { Sparkles, Layers, RefreshCw } from 'lucide-react';
import { AppLanguage } from '../translations';

interface ProductSkeletonGridProps {
  lang?: AppLanguage;
  count?: number;
}

export const ProductSkeletonGrid: React.FC<ProductSkeletonGridProps> = ({
  lang = 'ar',
  count = 8,
}) => {
  const isRtl = lang === 'ar';

  const statusText = {
    ar: {
      title: 'جاري تحميل وتحديث كتالوج Tulip مباشرة...',
      subtitle: 'يتم جلب أحدث تشكيلة من الزيوت العطرية النقية والعبوات ومخزون الورشة',
    },
    fr: {
      title: 'Chargement du catalogue Tulip en direct...',
      subtitle: 'Récupération des stocks d’extraits purs, flacons et accessoires',
    },
    en: {
      title: 'Loading live Tulip catalog...',
      subtitle: 'Retrieving pure extracts, flacons, and workshop accessories',
    },
  }[lang];

  return (
    <div className="w-full space-y-6">
      {/* Sleek Live Loading Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{statusText.title}</span>
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 animate-pulse">
                Direct
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              {statusText.subtitle}
            </p>
          </div>
        </div>

        {/* Shimmering Progress Bar on the Right */}
        <div className="hidden sm:flex flex-col items-end gap-1.5 w-36 shrink-0">
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full w-2/3 animate-[shimmer_1.5s_infinite]" />
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-400">
            Connexion sécurisée...
          </span>
        </div>
      </div>

      {/* Grid of Shimmering Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col animate-pulse"
          >
            {/* Image Placeholder */}
            <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-300">
                <Layers className="w-6 h-6" />
              </div>
              {/* Badge placeholder */}
              <div className="absolute top-3 left-3 w-16 h-5 bg-slate-200/80 rounded-full" />
              <div className="absolute top-3 right-3 w-7 h-7 bg-slate-200/80 rounded-full" />
            </div>

            {/* Card Content Skeleton */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                {/* Code & category */}
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                </div>

                {/* Title */}
                <div className="h-4 w-4/5 bg-slate-200 rounded" />
                <div className="h-3.5 w-3/5 bg-slate-200 rounded" />
              </div>

              {/* Price and Action button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-amber-100 rounded" />
                  <div className="h-2.5 w-10 bg-slate-100 rounded" />
                </div>
                <div className="h-9 w-24 bg-slate-900/10 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
