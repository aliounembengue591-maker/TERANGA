import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCategory } from '../types';

interface CategoryItem {
  id: ProductCategory;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'boubous', label: 'Boubous & Bazin', emoji: '✨' },
  { id: 'cosmetiques', label: 'Soins & Karité', emoji: '🌿' },
  { id: 'mode', label: 'Mode Homme & Femme', emoji: '👔' },
  { id: 'chaussures', label: 'Chaussures & Babouches', emoji: '👞' },
  { id: 'sacs', label: 'Sacs & Maroquinerie', emoji: '👜' },
  { id: 'bijoux', label: 'Bijoux & Accessoires', emoji: '💎' },
  { id: 'electronique', label: 'High-Tech & Accessoires', emoji: '⚡' }
];

export const CategoryBar: React.FC = () => {
  const { selectedCategory, setSelectedCategory } = useApp();

  return (
    <section className="pt-1 pb-1" aria-label="Catégories TERANGA BEAUTY">
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#D46A8A] text-white border-[#D46A8A] shadow-xs'
              : 'bg-white text-[#5A2D3A] border-[#F8D7E3] hover:border-[#D46A8A]/60'
          }`}
        >
          <span>🌸 Tous les rayons</span>
        </button>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                isSelected
                  ? 'bg-[#D46A8A] text-white border-[#D46A8A] shadow-xs'
                  : 'bg-white text-[#5A2D3A] border-[#F8D7E3] hover:border-[#D46A8A]/60'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
