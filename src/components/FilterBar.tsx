import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PriceRangeFilter, SizeFilter } from '../types';
import { SlidersHorizontal, X, RotateCcw, MapPin, Tag, Palette, Scissors } from 'lucide-react';

const PRICE_RANGES: { id: PriceRangeFilter; label: string }[] = [
  { id: 'all', label: 'Tous les prix' },
  { id: '0-10000', label: '0 - 10.000 F' },
  { id: '10000-25000', label: '10.000 - 25.000 F' },
  { id: '25000+', label: '25.000 F +' }
];

const FILTER_SIZES: ('S' | 'M' | 'L' | 'XL')[] = ['S', 'M', 'L', 'XL'];

const FILTER_COLORS = [
  { id: 'all', label: 'Toutes', bg: 'bg-slate-200' },
  { id: 'noir', label: 'Noir', bg: 'bg-black' },
  { id: 'blanc', label: 'Blanc', bg: 'bg-white border border-slate-300' },
  { id: 'rose', label: 'Rose', bg: 'bg-[#D46A8A]' },
  { id: 'marron', label: 'Marron', bg: 'bg-[#8B4513]' },
  { id: 'bleu', label: 'Bleu', bg: 'bg-[#2563EB]' }
];

import { DAKAR_ZONES, PRIMARY_DAKAR_SHORTCUTS, ALL_DAKAR_NEIGHBORHOODS } from '../data/dakarNeighborhoods';

export const FilterBar: React.FC = () => {
  const {
    priceFilter,
    setPriceFilter,
    sizeFilter,
    setSizeFilter,
    colorFilter,
    setColorFilter,
    neighborhoodFilter,
    setNeighborhoodFilter,
    resetFilters,
    activeFilterCount
  } = useApp();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="pt-2 pb-3" aria-label="Filtres du catalogue">
      {/* Quick Pills Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              isOpen || activeFilterCount > 0
                ? 'bg-[#D46A8A] text-white border-[#D46A8A] shadow-xs'
                : 'bg-white text-[#5A2D3A] border-[#F8D7E3] hover:border-[#D46A8A]/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtres</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#D46A8A] text-[10px] font-bold flex items-center justify-center ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick Price shortcuts */}
          {PRICE_RANGES.map((range) => {
            const isSelected = priceFilter === range.id;
            return (
              <button
                key={range.id}
                onClick={() => setPriceFilter(isSelected && range.id !== 'all' ? 'all' : (range.id as PriceRangeFilter))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected && range.id !== 'all'
                    ? 'bg-[#D46A8A] text-white border-[#D46A8A]'
                    : isSelected && range.id === 'all'
                    ? 'bg-[#FCE8EF] text-[#8B2D4A] border-[#F8D7E3]'
                    : 'bg-white text-[#5A2D3A] border-[#F8D7E3] hover:border-[#D46A8A]/50'
                }`}
              >
                {range.label}
              </button>
            );
          })}

          {/* Quick Quartier */}
          {['Tilène', 'HLM', 'Parcelles'].map((area) => {
            const isSelected = neighborhoodFilter === area;
            return (
              <button
                key={area}
                onClick={() => setNeighborhoodFilter(isSelected ? 'all' : area)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#8B2D4A] text-white border-[#8B2D4A]'
                    : 'bg-white text-[#5A2D3A] border-[#F8D7E3] hover:border-[#D46A8A]/50'
                }`}
              >
                <MapPin className="w-3 h-3 text-[#D46A8A]" />
                <span>{area}</span>
              </button>
            );
          })}
        </div>

        {/* Reset button if any filter is active */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#5A2D3A] hover:text-[#D46A8A] font-semibold transition-colors cursor-pointer shrink-0"
            title="Effacer tous les filtres"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {isOpen && (
        <div className="mt-3 p-4 sm:p-5 bg-white rounded-3xl border border-[#F8D7E3] shadow-md animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F8D7E3]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#D46A8A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B2D4A]">
                Filtres Précis (Dakar & Rayons)
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#5A2D3A] hover:text-[#8B2D4A] p-1 rounded-full cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* 1. Prix */}
            <div className="space-y-1.5">
              <span className="font-bold text-[#8B2D4A] flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Budget
              </span>
              <div className="flex flex-col gap-1">
                {PRICE_RANGES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setPriceFilter(r.id)}
                    className={`text-left px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      priceFilter === r.id
                        ? 'bg-[#FCE8EF] border-[#D46A8A] text-[#8B2D4A] font-bold'
                        : 'border-transparent text-[#5A2D3A] hover:bg-[#FFF9FB]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Quartier */}
            <div className="space-y-1.5">
              <span className="font-bold text-[#8B2D4A] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Quartier Dakar ({ALL_DAKAR_NEIGHBORHOODS.length})
              </span>
              <div className="flex flex-col gap-1.5">
                <select
                  value={neighborhoodFilter}
                  onChange={(e) => setNeighborhoodFilter(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#F8D7E3] bg-[#FFF9FB] text-[#8B2D4A] font-semibold focus:outline-none"
                >
                  <option value="all">Tous les quartiers (Tout Dakar)</option>
                  {DAKAR_ZONES.map((zone) => (
                    <optgroup key={zone.commune} label={`📍 ${zone.commune} (${zone.department})`}>
                      <option value={zone.commune}>{zone.commune} (Tous)</option>
                      {zone.neighborhoods.map((nh) => (
                        <option key={nh} value={nh}>
                          {nh}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                  <button
                    onClick={() => setNeighborhoodFilter('all')}
                    className={`text-left px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      neighborhoodFilter === 'all'
                        ? 'bg-[#FCE8EF] border-[#D46A8A] text-[#8B2D4A] font-bold'
                        : 'border-transparent text-[#5A2D3A] hover:bg-[#FFF9FB]'
                    }`}
                  >
                    Tous les quartiers
                  </button>
                  {PRIMARY_DAKAR_SHORTCUTS.map((nh) => (
                    <button
                      key={nh}
                      onClick={() => setNeighborhoodFilter(nh)}
                      className={`text-left px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        neighborhoodFilter === nh
                          ? 'bg-[#FCE8EF] border-[#D46A8A] text-[#8B2D4A] font-bold'
                          : 'border-transparent text-[#5A2D3A] hover:bg-[#FFF9FB]'
                      }`}
                    >
                      {nh}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Tailles */}
            <div className="space-y-1.5">
              <span className="font-bold text-[#8B2D4A] flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" />
                Taille
              </span>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {FILTER_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSizeFilter(sizeFilter === s ? 'all' : s)}
                    className={`py-1.5 text-center rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      sizeFilter === s
                        ? 'bg-[#8B2D4A] text-white border-[#8B2D4A]'
                        : 'border-[#F8D7E3] text-[#5A2D3A] hover:bg-[#FFF9FB]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Couleurs */}
            <div className="space-y-1.5">
              <span className="font-bold text-[#8B2D4A] flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                Teinte
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {FILTER_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColorFilter(colorFilter === c.id ? 'all' : c.id)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full ${c.bg} transition-all cursor-pointer ${
                      colorFilter === c.id ? 'ring-2 ring-offset-2 ring-[#D46A8A] scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F8D7E3] flex items-center justify-between">
            <button
              onClick={resetFilters}
              className="text-xs text-[#5A2D3A] hover:text-[#D46A8A] font-semibold cursor-pointer"
            >
              Réinitialiser tous les filtres
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs font-bold cursor-pointer"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
