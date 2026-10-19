import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryBar } from './components/CategoryBar';
import { FeaturedVendors } from './components/FeaturedVendors';
import { BoutiquesDirectory } from './components/BoutiquesDirectory';
import { ProductGrid } from './components/ProductGrid';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ShopCatalogueModal } from './components/ShopCatalogueModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { WhatsAppChatModal } from './components/WhatsAppChatModal';
import { VendorDashboard } from './components/VendorDashboard';
import { AdminPanel } from './components/AdminPanel';
import { InitiatorLoginModal } from './components/InitiatorLoginModal';
import { FilterBar } from './components/FilterBar';
import { CreatorRegistrationModal } from './components/CreatorRegistrationModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LiveCommunityChat } from './components/LiveCommunityChat';
import { BottomNavBar } from './components/BottomNavBar';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { GlobalChatMarket } from './components/GlobalChatMarket';
import { Heart, ArrowLeft } from 'lucide-react';
import { trackVisit } from './services/analytics';

const MainContent: React.FC = () => {
  const {
    currentRole,
    isMobileDeviceFrame,
    favorites,
    products
  } = useApp();

  const [activeScreen, setActiveScreen] = useState<'home' | 'favorites' | 'boutiques' | 'marche'>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/marche' || window.location.hash === '#marche')) {
      return 'marche';
    }
    return 'home';
  });

  // Track site visit upon startup using teranga_analytics
  useEffect(() => {
    trackVisit();

    const handleHashChange = () => {
      if (window.location.pathname === '/marche' || window.location.hash === '#marche') {
        setActiveScreen('marche');
      }
    };
    window.addEventListener('popstate', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const favoritedProducts = products.filter((p) => favorites.includes(p.id));

  const handleExploreClick = () => {
    setActiveScreen('boutiques');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const appBody = (
    <div className="min-h-screen flex flex-col bg-[#FFF9FB] text-[#4A2E35]">
      <Header
        onFavoritesClick={() => setActiveScreen('favorites')}
        onBoutiquesClick={() => setActiveScreen('boutiques')}
        onMarcheClick={() => setActiveScreen('marche')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-6">
        {/* Role: CLIENT */}
        {currentRole === 'client' && (
          <>
            {activeScreen === 'home' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 1. Hero Banner Rose Poudré Chic */}
                <HeroBanner onExploreClick={handleExploreClick} />

                {/* 2. Categories Bar */}
                <div id="featured-categories">
                  <CategoryBar />
                </div>

                {/* 3. Section Les boutiques TERANGA BEAUTY ("la grande cage Boutique") */}
                <FeaturedVendors />

                {/* 4. Filtres fonctionnels */}
                <FilterBar />

                {/* 5. Produits du Catalogue */}
                <ProductGrid />
              </div>
            )}

            {/* Boutiques Hub Screen ("el la grande cage Boutique doit repondre a une chose par exemple tous les boutique cree se regroupe") */}
            {activeScreen === 'boutiques' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F8D7E3]">
                  <button
                    onClick={() => setActiveScreen('home')}
                    className="p-1.5 rounded-lg hover:bg-[#FCE8EF] transition-colors cursor-pointer"
                    aria-label="Retour accueil"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#8B2D4A]" />
                  </button>
                  <span className="text-xs font-bold text-[#8B2D4A] uppercase tracking-wider">
                    Retour à l'accueil
                  </span>
                </div>

                <BoutiquesDirectory onBackToHome={() => setActiveScreen('home')} />
              </div>
            )}

            {/* Favorites Screen */}
            {activeScreen === 'favorites' && (
              <div className="py-4 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#F8D7E3]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveScreen('home')}
                      className="p-1.5 rounded-lg hover:bg-[#FCE8EF] transition-colors cursor-pointer"
                      aria-label="Retour"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#8B2D4A]" />
                    </button>
                    <h2 className="text-lg font-serif font-bold text-[#8B2D4A]">
                      Mes Coups de Cœur
                    </h2>
                    <span className="text-xs text-[#8B2D4A]/70 tabular-nums font-semibold">
                      ({favoritedProducts.length} articles)
                    </span>
                  </div>
                </div>

                {favoritedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                    {favoritedProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-[#F8D7E3] p-8">
                    <Heart className="w-12 h-12 mx-auto text-[#D46A8A]/40 mb-3" />
                    <h3 className="text-base font-bold text-[#8B2D4A]">
                      Vous n'avez pas encore de coups de cœur
                    </h3>
                    <p className="text-xs text-[#4A2E35]/70 mt-1 max-w-sm mx-auto">
                      Explorez notre sélection de boubous, soins naturels et parures, et touchez le cœur pour les retrouver ici.
                    </p>
                    <button
                      onClick={() => setActiveScreen('home')}
                      className="mt-4 px-5 py-2.5 bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs font-bold rounded-full shadow-xs cursor-pointer"
                    >
                      Découvrir les créations
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Marché Live Screen (/marche) */}
            {activeScreen === 'marche' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <GlobalChatMarket onBackToHome={() => setActiveScreen('home')} />
              </div>
            )}
          </>
        )}

        {/* Role: BOUTIQUE / VENDEUSE */}
        {currentRole === 'vendor' && (
          <div className="animate-in fade-in duration-200">
            <VendorDashboard />
          </div>
        )}

        {/* Role: ADMIN */}
        {currentRole === 'admin' && (
          <div className="animate-in fade-in duration-200">
            <AdminPanel />
          </div>
        )}
      </main>

      {/* Global Modals & Notifications */}
      <ProductDetailModal />
      <ShopCatalogueModal />
      <CartDrawer />
      <CheckoutModal />
      <WhatsAppChatModal />
      <CreatorRegistrationModal />
      <OnboardingModal />
      <InitiatorLoginModal />
      <LiveCommunityChat />
      <Toast />

      {/* Mobile Bottom Thumb Navigation */}
      <BottomNavBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

      <Footer />
    </div>
  );

  // If mobile frame simulator is active
  if (isMobileDeviceFrame) {
    return (
      <div className="min-h-screen bg-stone-900 py-8 px-4 flex flex-col items-center justify-center">
        <div className="mb-4 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D46A8A]">
            Simulation Mobile 390px · Vue Smartphone
          </span>
          <p className="text-xs text-stone-400 mt-0.5">
            Testez l'ergonomie mobile-first TERANGA BEAUTY avec la palette Rose Poudré Chic.
          </p>
        </div>

        {/* Phone Frame */}
        <div className="w-[390px] h-[844px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-stone-800 relative overflow-hidden flex flex-col">
          <div className="w-28 h-5 bg-black rounded-full mx-auto absolute top-4 inset-x-0 z-50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-stone-900 border border-stone-800 mr-2" />
          </div>

          <div className="flex-1 rounded-[38px] overflow-y-auto bg-[#FFF9FB] scrollbar-none relative">
            {appBody}
          </div>
        </div>
      </div>
    );
  }

  return appBody;
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
