import React from 'react';
import { Vendor, Product } from '../types';
import { MapPin, Sparkles, Store, ArrowRight, MessageCircle, Trash2, Plus, Star, Award } from 'lucide-react';
import { calculateLuxeScore } from '../utils/luxeScore';

interface LuxuryShopCardProps {
  vendor: Vendor;
  products: Product[];
  onOpenCatalogue: (vendor: Vendor) => void;
  onWhatsAppContact?: (e: React.MouseEvent, vendor: Vendor) => void;
  isAdmin?: boolean;
  onDeleteShop?: (vendor: Vendor) => void;
  onAddProduct?: (vendorId: string) => void;
  isTopSelected?: boolean;
  rank?: number;
  showLuxeScore?: boolean;
}

export const LuxuryShopCard: React.FC<LuxuryShopCardProps> = ({
  vendor,
  products,
  onOpenCatalogue,
  onWhatsAppContact,
  isAdmin = false,
  onDeleteShop,
  onAddProduct,
  isTopSelected = false,
  rank,
  showLuxeScore = false,
}) => {
  const vendorProducts = products.filter(
    (p) =>
      p.vendorId === vendor.id ||
      p.vendeuseId === vendor.id ||
      (p as any).shopId === vendor.id ||
      (p as any).sellerId === vendor.id
  );
  const featuredProduct = vendorProducts[0];
  const coverImage = vendor.coverImage || featuredProduct?.image || vendor.avatar;
  const productCount = vendorProducts.length;
  const isMaisonDeLuxe = productCount > 5;
  const ownerDisplayName = vendor.ownerName || vendor.name;
  const neighborhoodName = vendor.neighborhood || 'Dakar';
  const luxeScore = calculateLuxeScore(vendor, products);

  return (
    <div
      onClick={() => onOpenCatalogue(vendor)}
      className={`group relative bg-[#FFF8F0] rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.03] sm:hover:scale-105 cursor-pointer flex flex-col justify-between ${
        isTopSelected
          ? 'border-4 border-double border-[#D4AF37] ring-4 ring-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/30 bg-gradient-to-b from-[#FFFDF8] to-[#FFF8F0]'
          : 'border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-md hover:shadow-2xl hover:shadow-[#D4AF37]/25'
      }`}
      style={{
        boxShadow: isTopSelected
          ? '0 16px 40px -10px rgba(212, 175, 55, 0.35)'
          : '0 10px 30px -10px rgba(123, 29, 42, 0.08)'
      }}
    >
      {/* Top Banner for Top 3 Selection */}
      {isTopSelected && (
        <div className="bg-gradient-to-r from-[#D4AF37] via-[#F2DA85] to-[#B38A1D] text-stone-950 px-4 py-1.5 flex items-center justify-between text-xs font-black tracking-widest uppercase shadow-md z-30">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-stone-950" />
            <span>MAISON SÉLECTIONNÉE ⭐</span>
          </span>
          {rank && (
            <span className="bg-stone-950 text-[#F2DA85] px-2 py-0.5 rounded-full text-[10px] font-black">
              #{rank} TOP LUXE
            </span>
          )}
        </div>
      )}

      {/* Top Image: Large 300px height with luxury overlay gradient */}
      <div className={`relative w-full overflow-hidden bg-[#2A0812] ${isTopSelected ? 'h-[320px]' : 'h-[300px]'}`}>
        <img
          src={coverImage}
          alt={vendor.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Multi-layered luxury vignette & gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#20050B] via-black/35 to-black/15" />

        {/* Top Badges overlay */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between gap-2 z-10 flex-wrap">
          {/* Maison de Luxe small gold badge if > 5 products */}
          {isMaisonDeLuxe ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37] text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest shadow-lg">
              <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
              <span>Maison de Luxe</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/90 text-[10px] font-semibold uppercase tracking-wider">
              <Store className="w-3 h-3 text-[#D4AF37]" />
              <span>{vendor.categoryLabel || vendor.creatorTag || 'Boutique'}</span>
            </span>
          )}

          {/* Luxe score badge in Admin or if enabled */}
          {(isAdmin || showLuxeScore) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4AF37] text-stone-950 text-[11px] font-extrabold uppercase tracking-wide shadow-md border border-[#FFF8F0]">
              <Sparkles className="w-3 h-3" />
              <span>Score {luxeScore} pts</span>
            </span>
          )}

          {/* Product count pill on image */}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#7B1D2A]/90 backdrop-blur-md text-amber-100 text-[11px] font-bold tracking-wide border border-[#D4AF37]/50 shadow-md ml-auto">
            <span>{productCount}</span>
            <span className="text-[9px] uppercase tracking-wider text-amber-200/80">
              {productCount > 1 ? 'Créations' : 'Création'}
            </span>
          </span>
        </div>

        {/* Subtle gold line on bottom border of image */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />
      </div>

      {/* Logo boutique in circle overlapping image with gold ring and shadow-xl */}
      <div className="relative -mt-12 z-20 flex justify-center">
        <div className={`relative w-24 h-24 rounded-full border-2 border-[#D4AF37] ring-4 shadow-xl overflow-hidden bg-white flex items-center justify-center group-hover:border-[#E5C158] transition-colors ${
          isTopSelected ? 'ring-[#F2DA85] scale-105' : 'ring-[#FFF8F0]'
        }`}>
          <img
            src={vendor.avatar}
            alt={vendor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      </div>

      {/* Card Content with ample whitespace & luxury typography */}
      <div className="pt-3 pb-6 px-6 sm:px-8 text-center flex-1 flex flex-col justify-between space-y-4">
        {/* Name and Origin */}
        <div className="space-y-2">
          {/* Category subtitle */}
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1px] w-6 bg-[#D4AF37]/60" />
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#D4AF37]">
              {vendor.creatorTag || 'Atelier Dakar'}
            </span>
            <span className="h-[1px] w-6 bg-[#D4AF37]/60" />
          </div>

          {/* Boutique Name in Playfair Display serif uppercase tracking-widest */}
          <h3
            className="font-serif font-black text-xl sm:text-2xl text-[#7B1D2A] uppercase tracking-widest leading-tight transition-colors group-hover:text-[#9A2234]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {vendor.name}
          </h3>

          {/* Owner (Fatou Diop) */}
          <p className="text-xs sm:text-sm text-stone-700 font-medium">
            <span className="text-stone-400 font-normal">Maison fondée par</span>{' '}
            <strong className="text-stone-900 font-bold">{ownerDisplayName}</strong>
          </p>

          {/* Quartier (Hamo 4) with gold accent pin */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-stone-600 font-semibold pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Dakar · {neighborhoodName}</span>
          </div>

          {/* Bio preview if available */}
          {vendor.bio && (
            <p className="text-xs text-stone-500 italic line-clamp-2 max-w-xs mx-auto pt-1 leading-relaxed">
              "{vendor.bio}"
            </p>
          )}
        </div>

        {/* Number of products luxury summary */}
        <div className="pt-2 pb-1 border-t border-[#D4AF37]/20 flex items-center justify-around text-xs text-stone-600">
          <div className="text-center">
            <span className="block text-base font-serif font-bold text-[#7B1D2A] tabular-nums">
              {productCount}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Articles
            </span>
          </div>
          <div className="h-6 w-[1px] bg-[#D4AF37]/30" />
          <div className="text-center">
            <span className="block text-base font-serif font-bold text-[#D4AF37]">
              ★ 5.0
            </span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Prestige
            </span>
          </div>
          <div className="h-6 w-[1px] bg-[#D4AF37]/30" />
          <div className="text-center">
            <span className="block text-base font-serif font-bold text-emerald-700">
              Wave / OM
            </span>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Direct
            </span>
          </div>
        </div>

        {/* Action Button: "Découvrir la Maison" button gold */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCatalogue(vendor);
            }}
            className={`w-full py-3.5 px-6 rounded-2xl text-stone-950 font-extrabold text-xs uppercase tracking-widest shadow-md hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 border ${
              isTopSelected
                ? 'bg-gradient-to-r from-[#F2DA85] via-[#D4AF37] to-[#B38A1D] border-[#FFF8F0] hover:brightness-110'
                : 'bg-gradient-to-r from-[#D4AF37] via-[#DFBD51] to-[#C49B28] hover:from-[#C49B28] hover:to-[#B3891C] border-[#F2DA85]'
            }`}
          >
            <span>Découvrir la Maison</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Quick WhatsApp contact link */}
          {onWhatsAppContact && vendor.phone && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWhatsAppContact(e, vendor);
              }}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer py-1"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>Contacter la Maison sur WhatsApp</span>
            </button>
          )}

          {/* Admin Controls if admin mode */}
          {isAdmin && (
            <div
              className="mt-3 pt-3 border-t border-[#D4AF37]/30 flex items-center justify-between gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {onAddProduct && (
                <button
                  type="button"
                  onClick={() => onAddProduct(vendor.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#D4AF37] text-[#7B1D2A] text-xs font-bold hover:bg-[#FCE8EF] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>+ Produit</span>
                </button>
              )}

              {onDeleteShop && (
                <button
                  type="button"
                  onClick={() => onDeleteShop(vendor)}
                  className="py-2 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Supprimer définitivement la boutique et ses articles"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
