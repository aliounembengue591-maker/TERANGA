import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { ArrowRight, Sparkles, Plus, RotateCcw } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const {
    products,
    selectedCategory,
    searchQuery,
    priceFilter,
    sizeFilter,
    colorFilter,
    neighborhoodFilter,
    selectedVendorFilter,
    resetFilters,
    activeFilterCount,
    setIsCreatorFormOpen,
    loadSampleData,
    setCurrentRole,
    vendors
  } = useApp();

  const [showAll, setShowAll] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const isProductAllowed =
        product.status === 'approved' ||
        product.status === 'active' ||
        (product as any).isApproved === true ||
        (product as any).isVisible === true ||
        product.status === undefined;
      if (!isProductAllowed) return false;

      // Do not display products from unapproved shops on the homepage
      const parentShop = vendors.find(
        (v) => v.id === product.vendorId || v.id === (product as any).shopId
      );
      if (parentShop) {
        const isShopApproved =
          parentShop.isApproved === true ||
          parentShop.status === 'active' ||
          parentShop.status === 'approved' ||
          (parentShop as any).isVisible === true;
        if (!isShopApproved) return false;
      }

      // 1. Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesVendor = product.vendorName.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesArea = product.neighborhood?.toLowerCase().includes(query);
        if (!matchesName && !matchesVendor && !matchesDesc && !matchesArea) {
          return false;
        }
      }

      // 3. Price filter
      const effectivePrice = product.promoPrice || product.price;
      if (priceFilter === '0-10000' && effectivePrice > 10000) return false;
      if (priceFilter === '10000-25000' && (effectivePrice <= 10000 || effectivePrice > 25000)) return false;
      if (priceFilter === '25000+' && effectivePrice <= 25000) return false;

      // 4. Size filter
      if (sizeFilter !== 'all') {
        if (!product.sizes || !product.sizes.includes(sizeFilter)) return false;
      }

      // 5. Color filter
      if (colorFilter !== 'all') {
        if (!product.color || product.color.toLowerCase() !== colorFilter.toLowerCase()) return false;
      }

      // 6. Neighborhood filter
      if (neighborhoodFilter !== 'all') {
        const prodArea = (product.neighborhood || '').toLowerCase();
        const filterArea = neighborhoodFilter.toLowerCase();
        if (!prodArea.includes(filterArea)) return false;
      }

      // 7. Vendor filter
      if (selectedVendorFilter && product.vendorId !== selectedVendorFilter) {
        return false;
      }

      return true;
    });
  }, [
    products,
    selectedCategory,
    searchQuery,
    priceFilter,
    sizeFilter,
    colorFilter,
    neighborhoodFilter,
    selectedVendorFilter
  ]);

  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, 8);

  const getCategoryLabel = () => {
    switch (selectedCategory) {
      case 'chaussures':
        return 'Chaussures & Babouches';
      case 'electronique':
        return 'Électronique & Tech';
      case 'sacs':
        return 'Sacs & Maroquinerie';
      case 'mode':
        return 'Mode & Prêt-à-porter';
      case 'boubous':
        return 'Boubous & Bazin Brodé';
      case 'cosmetiques':
        return 'Cosmétiques & Soins Karité';
      case 'bijoux':
        return 'Bijoux & Accessoires';
      default:
        return 'Produits populaires';
    }
  };

  return (
    <section className="pt-2 pb-8" id="popular-products" aria-label="Produits">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-serif font-black text-[#8B2D4A] tracking-tight">
            {selectedCategory === 'all' && !selectedVendorFilter ? 'Produits populaires' : getCategoryLabel()}
          </h2>
          {searchQuery.trim() ? (
            <p className="text-xs text-[#5A2D3A] mt-0.5">
              Résultats pour &laquo; <strong className="text-[#D46A8A]">{searchQuery}</strong> &raquo;
            </p>
          ) : (
            <p className="text-xs text-[#5A2D3A]/70 mt-0.5">
              Disponible à Dakar • Vente directe WhatsApp • Livraison 24h
            </p>
          )}
        </div>

        {filteredProducts.length > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#D46A8A] hover:text-[#8B2D4A] hover:underline cursor-pointer"
          >
            <span>{showAll ? 'Réduire' : 'Voir tout'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid: 2 colonnes sur mobile */}
      {displayedProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl bg-white p-6 sm:p-10 text-center border border-[#F8D7E3] shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FCE8EF] text-[#D46A8A] flex items-center justify-center mx-auto border border-[#F8D7E3]">
            <Sparkles className="w-7 h-7" />
          </div>

          <h3 className="text-lg sm:text-xl font-serif font-black text-[#8B2D4A] max-w-md mx-auto">
            {selectedCategory !== 'all'
              ? `${getCategoryLabel()} : 0 article en ligne`
              : 'Aucun produit n\'est encore disponible'}
          </h3>

          <p className="text-xs sm:text-sm text-[#5A2D3A] max-w-lg mx-auto leading-relaxed">
            Chaque créateur ou marchande ayant le lien peut ouvrir sa propre boutique et publier ses articles directement avec photo et prix en FCFA. L'initiateur validera votre boutique pour la publier sur le site !
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsCreatorFormOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Créer ma propre boutique & ajouter mes produits</span>
            </button>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 pt-3 border-t border-[#F8D7E3] flex items-center justify-center gap-2">
              <span className="text-xs text-[#5A2D3A]">
                Filtres actifs ({activeFilterCount}) :
              </span>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#D46A8A] hover:underline font-bold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Effacer les filtres</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
