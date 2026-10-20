import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Home, Store, ShoppingBag, User, MessageCircle } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, db } from '../firebase';

interface BottomNavBarProps {
  activeScreen: 'home' | 'favorites' | 'boutiques' | 'marche';
  setActiveScreen: (screen: 'home' | 'favorites' | 'boutiques' | 'marche') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeScreen,
  setActiveScreen
}) => {
  const {
    currentRole,
    setCurrentRole,
    cartCount,
    setIsCartOpen,
    setSelectedCategory
  } = useApp();

  const [unreadMarketCount, setUnreadMarketCount] = useState<number>(0);

  // Real-time unread messages count for Marché Live
  useEffect(() => {
    const q = query(collection(db, 'global_chat'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const lastRead = Number(localStorage.getItem('tb_last_read_market') || '0');
      let unread = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const timeMs = data.createdAt?.seconds
          ? data.createdAt.seconds * 1000
          : new Date(data.createdAt || 0).getTime();
        if (timeMs > lastRead) {
          unread++;
        }
      });
      setUnreadMarketCount(activeScreen === 'marche' ? 0 : unread);
    });

    return () => unsub();
  }, [activeScreen]);

  const handleHomeClick = () => {
    setCurrentRole('client');
    setActiveScreen('home');
    setSelectedCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBoutiquesClick = () => {
    setCurrentRole('client');
    setActiveScreen('boutiques');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarcheClick = () => {
    try {
      localStorage.setItem('tb_last_read_market', Date.now().toString());
    } catch {}
    setUnreadMarketCount(0);
    setActiveScreen('marche');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileClick = () => {
    if (currentRole === 'client') {
      setCurrentRole('vendor');
    } else {
      setCurrentRole('client');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHomeActive = currentRole === 'client' && activeScreen === 'home';
  const isBoutiquesActive = currentRole === 'client' && activeScreen === 'boutiques';
  const isMarcheActive = activeScreen === 'marche';
  const displayCartBadge = cartCount > 0 ? cartCount : 2;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#F8D7E3] py-2 px-2 sm:hidden shadow-lg"
      aria-label="Navigation mobile TERANGA BEAUTY"
    >
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {/* 1: Accueil */}
        <button
          onClick={handleHomeClick}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isHomeActive
              ? 'text-[#2563EB] font-bold'
              : 'text-[#8B2D4A]/60 hover:text-[#2563EB]'
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5] fill-[#2563EB]/15' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Accueil</span>
        </button>

        {/* 2: Boutiques */}
        <button
          onClick={handleBoutiquesClick}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isBoutiquesActive
              ? 'text-[#D46A8A] font-bold'
              : 'text-[#8B2D4A]/70 hover:text-[#D46A8A]'
          }`}
        >
          <Store className={`w-5 h-5 ${isBoutiquesActive ? 'stroke-[2.5] fill-[#D46A8A]/15' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5">Boutiques</span>
        </button>

        {/* 3: Marché Live (💬 Marché Live + LIVE green dot + unread badge) */}
        <button
          onClick={handleMarcheClick}
          className={`min-h-[44px] flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
            isMarcheActive
              ? 'text-[#7B1D2A] font-black'
              : 'text-[#8B2D4A]/70 hover:text-[#7B1D2A]'
          }`}
        >
          <div className="relative">
            <MessageCircle className={`w-5 h-5 ${isMarcheActive ? 'stroke-[2.5] fill-[#7B1D2A]/15 text-[#7B1D2A]' : 'stroke-[1.8]'}`} />

            {/* LIVE green pulsing dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />

            {/* Unread badge */}
            {unreadMarketCount > 0 && !isMarcheActive && (
              <span className="absolute -top-1 -right-2.5 bg-red-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-2xs ring-1 ring-white animate-bounce">
                {unreadMarketCount > 9 ? '9+' : unreadMarketCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight flex items-center gap-0.5">
            <span>Marché</span>
            <span className="text-[7.5px] uppercase font-bold text-emerald-600">Live</span>
          </span>
        </button>

        {/* 4: Panier */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="min-h-[44px] flex flex-col items-center justify-center relative text-[#8B2D4A]/70 hover:text-[#D46A8A] transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            <span className="absolute -top-1 -right-2 bg-[#D46A8A] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs ring-1 ring-white">
              {displayCartBadge}
            </span>
          </div>
          <span className="text-[10px] mt-0.5">Panier</span>
        </button>

        {/* 5: Profil */}
        <button
          onClick={handleProfileClick}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            currentRole !== 'client'
              ? 'text-[#8B2D4A] font-bold'
              : 'text-[#8B2D4A]/70 hover:text-[#8B2D4A]'
          }`}
        >
          <User className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5">
            {currentRole === 'client' ? 'Profil' : currentRole === 'vendor' ? 'Vendeur' : 'Admin'}
          </span>
        </button>
      </div>
    </nav>
  );
};
