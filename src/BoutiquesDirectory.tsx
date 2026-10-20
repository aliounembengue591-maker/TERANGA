import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Store, MapPin, Search, Plus, Sparkles } from 'lucide-react';
import { Vendor } from '../types';
import { DAKAR_ZONES, PRIMARY_DAKAR_SHORTCUTS, ALL_DAKAR_NEIGHBORHOODS } from '../data/dakarNeighborhoods';
import { LuxuryShopCard } from './LuxuryShopCard';
import { sortVendorsByLuxeScore } from '../utils/luxeScore';

interface BoutiquesDirectoryProps {
  onBackToHome?: () => void;
}

export const BoutiquesDirectory: React.FC<BoutiquesDirectoryProps> = () => {
  const {
    vendors,
    approvedVendors,
    products,
    openShopCatalogue,
    openWhatsAppChat,
    setIsCreatorFormOpen,
  } = useApp();

  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [vendorSearch, setVendorSearch] = useState<string>('');

  // Show all shops where isVisible==true OR isApproved==true OR status=='active'
  const visibleVendors = (vendors && vendors.length > 0 ? vendors : approvedVendors).filter(
    (v) => (v as any).isVisible === true || v.isApproved === true || v.status === 'active' || v.status === 'approved'
  );

  // Sorted by Luxe score
  const allSortedVendors = sortVendorsByLuxeScore(visibleVendors.length > 0 ? visibleVendors : approvedVendors, products);

  // Filtered vendors (approved maisons)
  const filteredVendors = allSortedVendors.filter((v) => {
    const matchesNeighborhood =
      selectedNeighborhood === 'all' ||
      v.neighborhood.toLowerCase().includes(selectedNeighborhood.toLowerCase()) ||
      selectedNeighborhood.toLowerCase().includes(v.neighborhood.toLowerCase());
    const query = vendorSearch.trim().toLowerCase();
    const matchesQuery =
      !query ||
      v.name.toLowerCase().includes(query) ||
      (v.ownerName && v.ownerName.toLowerCase().includes(query)) ||
      v.neighborhood.toLowerCase().includes(query) ||
      (v.bio && v.bio.toLowerCase().includes(query));
    return matchesNeighborhood && matchesQuery;
  });

  const handleWhatsAppContact = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    openWhatsAppChat(vendor.phone, vendor.name);
  };

  return (
    <div className="py-4 space-y-8 animate-in fade-in duration-200" id="boutiques-hub">
      {/* Luxury Header Banner */}
      <div className="bg-[#FFF8F0] rounded-3xl border border-[#D4AF37]/50 p-6 sm:p-10 shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#D4AF37]/15 to-transparent rounded-full pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Gold decoration */}
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-[#D4AF37]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                Répertoire Haute Sélection
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-black text-[#7B1D2A] uppercase tracking-widest leading-tight">
              Maisons de Beauté Sélectionnées
            </h1>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
              Explorez les créatrices et créateurs d'excellence de Dakar. 
              Chaque maison dispose de son univers, de ses créations artisanales et de ses coordonnées directes Wave, Orange Money et WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreatorFormOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38A1D] hover:from-[#C49B28] hover:to-[#9E7714] text-stone-950 text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-lg transition-all active:scale-95 cursor-pointer border border-[#F2DA85]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Ouvrir une Maison</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barre de Recherche & Filtres de Quartiers Luxe */}
      <div className="space-y-4 bg-white p-5 rounded-3xl border border-[#D4AF37]/30 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
          <input
            type="text"
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Rechercher une maison par nom, fondatrice ou quartier (HLM, Tilène, Médina, Plateau, Almadies, Hamo 4)..."
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-[#FFF8F0] border border-[#D4AF37]/40 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
          />
        </div>

        {/* Neighborhood Selector with ALL Dakar Neighborhoods & Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Exhaustive Dakar Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="text-xs px-3.5 py-2 rounded-xl border border-[#D4AF37]/50 bg-[#FFF8F0] text-[#7B1D2A] font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">📍 Tout Dakar ({ALL_DAKAR_NEIGHBORHOODS.length} quartiers)</option>
              {DAKAR_ZONES.map((zone) => (
                <optgroup key={zone.commune} label={`📍 ${zone.commune} (${zone.department})`}>
                  <option value={zone.commune}>{zone.commune} (Tout)</option>
                  {zone.neighborhoods.map((nh) => (
                    <option key={nh} value={nh}>
                      {nh}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Quick Popular Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            <button
              onClick={() => setSelectedNeighborhood('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedNeighborhood === 'all'
                  ? 'bg-[#7B1D2A] text-amber-100 shadow-sm border border-[#D4AF37]'
                  : 'bg-[#FFF8F0] text-stone-700 border border-[#D4AF37]/30 hover:border-[#D4AF37]'
              }`}
            >
              Toutes les Maisons
            </button>
            {PRIMARY_DAKAR_SHORTCUTS.slice(0, 8).map((n) => {
              const isSelected = selectedNeighborhood.toLowerCase() === n.toLowerCase();
              return (
                <button
                  key={n}
                  onClick={() => setSelectedNeighborhood(n)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7B1D2A] text-amber-100 shadow-sm border border-[#D4AF37]'
                      : 'bg-[#FFF8F0] text-stone-700 border border-[#D4AF37]/30 hover:border-[#D4AF37]'
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Luxury Grid: 3 columns desktop, 1 mobile, gap-8, plenty white space */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredVendors.map((vendor) => {
            const overallRank = allSortedVendors.findIndex((v) => v.id === vendor.id);
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
      ) : (
        <div className="py-20 text-center bg-[#FFF8F0] rounded-3xl border border-dashed border-[#D4AF37]/60 p-8 space-y-4">
          <Store className="w-14 h-14 mx-auto text-[#D4AF37]/60" />
          <h3 className="text-lg font-serif font-bold text-[#7B1D2A]">
            Aucune Maison trouvée pour ces critères
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
            {approvedVendors.length === 0
              ? "Aucune maison n'est encore active. Ouvrez la toute première maison de Dakar !"
              : "Essayez de modifier votre recherche ou de réinitialiser le quartier sélectionné."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setVendorSearch('');
                setSelectedNeighborhood('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#7B1D2A] text-amber-100 text-xs font-bold shadow-md cursor-pointer hover:bg-[#601520]"
            >
              Afficher toutes les maisons
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
