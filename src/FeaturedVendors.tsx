import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Plus, ArrowRight, Store, Star, Award } from 'lucide-react';
import { Vendor } from '../types';
import { LuxuryShopCard } from './LuxuryShopCard';
import { sortVendorsByLuxeScore } from '../utils/luxeScore';

export const FeaturedVendors: React.FC = () => {
  const {
    vendors,
    approvedVendors,
    products,
    openWhatsAppChat,
    setIsCreatorFormOpen,
    openShopCatalogue,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'top'>('all');

  const handleWhatsAppContact = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    openWhatsAppChat(vendor.phone, vendor.name);
  };

  // Filter client-side: show if isApproved==true OR status=='active' OR isVisible==true to catch both
  const visibleApprovedVendors = (approvedVendors && approvedVendors.length > 0
    ? approvedVendors
    : (vendors || []).filter(
        (v) =>
          v.isApproved === true ||
          v.status === 'active' ||
          (v as any).isVisible === true ||
          v.status === 'approved'
      )
  ).sort((a, b) => {
    const timeA = (a as any).approvedAt?.seconds
      ? (a as any).approvedAt.seconds * 1000
      : new Date((a as any).approvedAt || (a as any).createdAt || 0).getTime();
    const timeB = (b as any).approvedAt?.seconds
      ? (b as any).approvedAt.seconds * 1000
      : new Date((b as any).approvedAt || (b as any).createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Sort shops by Luxe Score descending
  const sortedVendors = sortVendorsByLuxeScore(visibleApprovedVendors, products);

  // Filter: all or top 3 "Maisons Sélectionnées"
  const displayedVendors = activeFilter === 'top' ? sortedVendors.slice(0, 3) : sortedVendors;

  // If 0 confirmed vendors, display luxury invitation
  if (visibleApprovedVendors.length === 0) {
    return (
      <section className="py-8" id="boutiques-section" aria-label="Maisons de Beauté">
        <div className="bg-[#FFF8F0] rounded-3xl border border-[#D4AF37]/50 p-8 sm:p-14 shadow-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#7B1D2A]/10 text-[#7B1D2A] border border-[#D4AF37]/60 flex items-center justify-center mx-auto shadow-md">
            <Store className="w-8 h-8 text-[#D4AF37]" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white border border-[#D4AF37] text-[#7B1D2A] text-xs font-bold uppercase tracking-widest shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Maisons de Beauté Dakar</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#7B1D2A] tracking-wider uppercase">
            Maisons de Beauté Sélectionnées
          </h2>

          <p className="text-xs sm:text-base text-stone-700 max-w-xl mx-auto leading-relaxed font-medium">
            Découvrez nos ateliers de confection, parfumeurs et créatrices d'exception à Dakar.
            Ouvrez votre maison en quelques minutes, partagez votre catalogue exclusif et recevez directement vos paiements Wave et Orange Money.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsCreatorFormOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38A1D] hover:from-[#C49B28] hover:to-[#9E7714] text-stone-950 text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-xl transition-all active:scale-95 cursor-pointer border border-[#F2DA85]"
            >
              <span>Ouvrir une Maison de Beauté</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-10" id="boutiques-section" aria-label="Maisons de Beauté Sélectionnées">
      {/* Luxury Section Header with Gold Line Decoration */}
      <div className="text-center mb-6 sm:mb-8 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            Haute Couture & Parfumerie Dakar
          </span>
          <div className="h-[1px] w-12 sm:w-24 bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </div>

        <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#7B1D2A] uppercase tracking-widest leading-tight">
          Maisons de Beauté Sélectionnées
        </h2>

        {/* Gold Diamond ornament */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="h-[1px] w-20 bg-[#D4AF37]/50" />
          <span className="text-[#D4AF37] text-xs">◆</span>
          <div className="h-[1px] w-20 bg-[#D4AF37]/50" />
        </div>

        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto pt-1 font-medium">
          Classement par Score Luxe : ateliers réputés, créations détaillées et contacts vérifiés.
        </p>

        {/* Filter buttons: Toutes les Maisons vs Maisons Sélectionnées ⭐ */}
        <div className="pt-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#7B1D2A] text-amber-100 shadow-md border border-[#D4AF37]'
                : 'bg-[#FFF8F0] text-stone-700 border border-[#D4AF37]/40 hover:border-[#D4AF37]'
            }`}
          >
            Toutes les Maisons ({approvedVendors.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('top')}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'top'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38A1D] text-stone-950 shadow-lg border border-[#F2DA85]'
                : 'bg-[#FFF8F0] text-[#7B1D2A] border border-[#D4AF37]/60 hover:bg-[#FCE8EF]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>Maisons Sélectionnées ⭐ (Top 3)</span>
          </button>

          <button
            onClick={() => setIsCreatorFormOpen(true)}
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-[#7B1D2A] hover:text-[#D4AF37] transition-colors cursor-pointer ml-1"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="underline underline-offset-4 decoration-[#D4AF37]">
              Ouvrir votre Maison
            </span>
          </button>
        </div>
      </div>

      {/* Luxury Grid: 3 columns desktop, 1 mobile, gap-8, plenty white space */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {displayedVendors.map((vendor, index) => {
          // Top 3 in overall ranking get the special badge & double border
          const overallRank = sortedVendors.findIndex((v) => v.id === vendor.id);
          const isTop3 = overallRank < 3;

          return (
            <LuxuryShopCard
              key={vendor.id}
              vendor={vendor}
              products={products}
              onOpenCatalogue={openShopCatalogue}
              onWhatsAppContact={handleWhatsAppContact}
              isTopSelected={isTop3}
              rank={overallRank + 1}
            />
          );
        })}
      </div>
    </section>
  );
};
