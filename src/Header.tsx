import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Search, Heart, User, Smartphone, Monitor, Plus, Store, Flower2, Lock, X, ArrowRight, ShieldCheck, Tag, Share2 } from 'lucide-react';
import { ProductCategory } from '../types';
import { AdminLiveBell } from './AdminLiveBell';
import { MessageCircle } from 'lucide-react';

interface HeaderProps {
  onFavoritesClick?: () => void;
  onBoutiquesClick?: () => void;
  onMarcheClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onFavoritesClick, onBoutiquesClick, onMarcheClick }) => {
  const {
    currentRole,
    setCurrentRole,
    cartCount,
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    isMobileDeviceFrame,
    setIsMobileDeviceFrame,
    favorites,
    setIsCreatorFormOpen,
    isInitiatorAuthenticated,
    setIsInitiatorModalOpen,
    logoutInitiator,
    products,
    approvedVendors,
    setSelectedProduct,
    setCatalogueVendor,
    openShopCatalogue,
    setSelectedCategory,
    userAccount,
    setIsOnboardingModalOpen,
    activeVendor,
    showToast
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleGoHome = () => {
    setCurrentRole('client');
    setSelectedProduct(null);
    setCatalogueVendor(null);
    setSelectedCategory('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareSite = async () => {
    const luxuryUrl = 'https://teranga-beauty-luxe.web.app';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TERANGA BEAUTY - Maison de Beauté Sénégal',
          text: 'Découvrez la marketplace beauté de luxe à Dakar avec paiement direct Wave et Orange Money !',
          url: luxuryUrl,
        });
      } catch {
        // User dismissed
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(luxuryUrl);
      showToast({
        title: 'Lien officiel copié',
        message: 'https://teranga-beauty-luxe.web.app',
        type: 'success'
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchingVendors = trimmedQuery ? approvedVendors.filter((v) => v.name.toLowerCase().includes(trimmedQuery) || (v.ownerName && v.ownerName.toLowerCase().includes(trimmedQuery)) || v.neighborhood.toLowerCase().includes(trimmedQuery)).slice(0, 3) : [];
  const matchingProducts = trimmedQuery ? products.filter((p) => (p.status === 'approved' || !p.status) && (p.name.toLowerCase().includes(trimmedQuery) || p.vendorName.toLowerCase().includes(trimmedQuery) || p.category.toLowerCase().includes(trimmedQuery))).slice(0, 4) : [];
  const hasSuggestions = trimmedQuery.length > 0 && (matchingVendors.length > 0 || matchingProducts.length > 0);
  const handleSelectVendor = (vendor: typeof approvedVendors[0]) => { openShopCatalogue(vendor); setIsSearchFocused(false); };
  const handleSelectProduct = (product: typeof products[0]) => { setSelectedProduct(product); setIsSearchFocused(false); };
  const handleInitiatorClick = () => { if (isInitiatorAuthenticated) { if (currentRole === 'admin') { setCurrentRole('client'); } else { setCurrentRole('admin'); } } else { setIsInitiatorModalOpen(true); } };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-3.5 sm:px-6 py-2.5 transition-colors border-b border-[#F8D7E3] shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2.5 group focus:outline-none cursor-pointer py-1 transition-transform active:scale-98"
            title="Accueil TERANGA BEAUTY"
            aria-label="Accueil TERANGA BEAUTY - Retour à la boutique"
          >
            {/* Luxury T Gold Monogram without background square */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo-gold-t.svg"
                alt="T"
                className="w-full h-full object-contain drop-shadow-2xs"
              />
            </div>

            {/* Side by side gold brand typography */}
            <div className="flex flex-col text-left">
              <span className="font-serif font-black tracking-[0.14em] text-base sm:text-lg md:text-xl bg-gradient-to-r from-[#DDA336] via-[#F7D87E] to-[#B87F1C] bg-clip-text text-transparent leading-none">
                TERANGA BEAUTY
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-[0.26em] text-[#B87F1C] leading-tight mt-0.5">
                Maison de Beauté · Sénégal
              </span>
            </div>
          </button>
        </div>
        <div ref={searchContainerRef} className="flex-1 max-w-md hidden md:block mx-4 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D46A8A]" />
            <input type="text" value={searchQuery} onFocus={() => setIsSearchFocused(true)} onChange={(e) => { setSearchQuery(e.target.value); setIsSearchFocused(true); }} placeholder="Rechercher un produit, boutique..." className="w-full pl-11 pr-9 py-2.5 text-xs sm:text-sm bg-[#FFF9FB] border border-[#F8D7E3] rounded-full placeholder:text-[#8B2D4A]/50 text-[#3D232A] focus:outline-none focus:border-[#D46A8A] focus:ring-2 focus:ring-[#F8D7E3] shadow-2xs transition-all" />
            {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"><X className="w-3.5 h-3.5" /></button>)}
          </div>
          {isSearchFocused && hasSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#F8D7E3] overflow-hidden z-50 divide-y divide-[#F8D7E3]/60">
              {matchingVendors.length > 0 && (<div className="p-2"><div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[#8B2D4A]/70 tracking-wider flex items-center gap-1"><Store className="w-3 h-3 text-[#D46A8A]" /><span>Boutiques</span></div>{matchingVendors.map((vendor) => (<button key={vendor.id} onClick={() => handleSelectVendor(vendor)} className="w-full px-2.5 py-2 rounded-xl hover:bg-[#FFF9FB] text-left flex items-center justify-between"><div className="flex items-center gap-2.5"><img src={vendor.avatar} alt={vendor.name} className="w-8 h-8 rounded-lg object-cover border border-[#F8D7E3]" /><div><div className="text-xs font-bold text-slate-900">{vendor.name}</div><div className="text-[10px] text-slate-500">Dakar · {vendor.neighborhood}</div></div></div><span className="text-[11px] font-bold text-[#D46A8A] flex items-center gap-0.5"><span>Voir</span><ArrowRight className="w-3 h-3" /></span></button>))}</div>)}
              {matchingProducts.length > 0 && (<div className="p-2"><div className="px-2.5 py-1 text-[10px] uppercase font-bold text-[#8B2D4A]/70 tracking-wider flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-[#D46A8A]" /><span>Articles</span></div>{matchingProducts.map((prod) => (<button key={prod.id} onClick={() => handleSelectProduct(prod)} className="w-full px-2.5 py-2 rounded-xl hover:bg-[#FFF9FB] text-left flex items-center justify-between"><div className="flex items-center gap-2.5"><img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover border border-[#F8D7E3]" /><div><div className="text-xs font-bold text-slate-900 line-clamp-1">{prod.name}</div><div className="text-[10px] text-slate-500">{prod.vendorName}</div></div></div><span className="text-xs font-black text-[#8B2D4A] tabular-nums shrink-0 ml-2">{(prod.promoPrice || prod.price).toLocaleString('fr-FR')} F</span></button>))}</div>)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onBoutiquesClick && (<button onClick={onBoutiquesClick} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] text-xs font-bold border border-[#F8D7E3]"><Store className="w-3.5 h-3.5 text-[#D46A8A]" /><span>Boutiques</span></button>)}
          {/* Izi Shop Header Style: Boutique Avatar + Name OR Big Rose 'Devenir vendeuse' */}
          {activeVendor ? (
            <button
              onClick={() => {
                setCurrentRole('vendor');
                openShopCatalogue(activeVendor);
              }}
              className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#FFF9FB] hover:bg-[#FCE8EF] border border-[#F8D7E3] cursor-pointer shadow-2xs transition-transform active:scale-95"
              title="Voir ma vitrine boutique"
            >
              <img
                src={activeVendor.avatar}
                alt={activeVendor.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-[#D46A8A]"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-[#8B2D4A] line-clamp-1 max-w-[120px]">
                  {activeVendor.name}
                </div>
                <div className="text-[9px] text-emerald-600 font-bold leading-none">
                  ● Ma Boutique
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsCreatorFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs sm:text-sm font-bold shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Devenir vendeuse</span>
            </button>
          )}

          {onMarcheClick && (
            <button
              onClick={onMarcheClick}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#7B1D2A] to-[#641E34] hover:from-[#641E34] hover:to-[#500F1A] text-[#F7D87E] text-xs font-bold border border-[#D4AF37]/50 shadow-xs cursor-pointer transition-transform active:scale-95"
              title="Accéder à la Place du Marché Live"
            >
              <div className="relative">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-ping" />
              </div>
              <span>Marché Live</span>
            </button>
          )}

          <div className="flex items-center bg-[#FCE8EF] p-0.5 rounded-xl border border-[#F8D7E3]">
            <button onClick={() => setCurrentRole('client')} className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${currentRole === 'client' ? 'bg-white text-[#8B2D4A] shadow-xs' : 'text-[#8B2D4A]/70'}`}>Acheteur</button>
            <button onClick={() => setCurrentRole('vendor')} className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${currentRole === 'vendor' ? 'bg-[#D46A8A] text-white shadow-xs' : 'text-[#8B2D4A]/70'}`}>Vendeur</button>
            {isInitiatorAuthenticated && (<button onClick={() => setCurrentRole('admin')} className={`px-2 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 ${currentRole === 'admin' ? 'bg-[#8B2D4A] text-white shadow-xs' : 'text-[#8B2D4A] hover:bg-white/50'}`}><ShieldCheck className="w-3 h-3 text-amber-400" /><span>Admin</span></button>)}
          </div>
          <button onClick={handleInitiatorClick} className={`p-2 rounded-xl ${isInitiatorAuthenticated ? 'text-amber-600 bg-amber-50 border border-amber-200' : 'text-[#8B2D4A]/40 hover:text-[#8B2D4A] hover:bg-[#FCE8EF]'}`}><Lock className="w-4 h-4" /></button>
          <AdminLiveBell />
          <button onClick={handleShareSite} className="w-9 h-9 rounded-full flex items-center justify-center text-[#B87F1C] hover:bg-[#FCE8EF] transition-colors relative cursor-pointer" title="Partager le site TERANGA BEAUTY (https://teranga-beauty-luxe.web.app)" aria-label="Partager"><Share2 className="w-4.5 h-4.5 stroke-[2]" /></button>
          <button onClick={onFavoritesClick} className="w-9 h-9 rounded-full flex items-center justify-center text-[#D46A8A] hover:bg-[#FCE8EF] relative"><Heart className="w-5 h-5 stroke-[2] fill-[#D46A8A]/10" />{favorites.length > 0 && (<span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#D46A8A] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">{favorites.length}</span>)}</button>
          <button onClick={() => setIsCartOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center text-[#D46A8A] hover:bg-[#FCE8EF] relative"><ShoppingBag className="w-5 h-5 stroke-[2]" />{cartCount > 0 && (<span className="absolute top-0.5 right-0.5 w-4.5 h-4.5 rounded-full bg-[#D46A8A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{cartCount}</span>)}</button>
        </div>
      </div>
    </header>
  );
};
