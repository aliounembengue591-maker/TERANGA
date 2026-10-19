import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles, Store, Zap, ShieldCheck, Heart, MessageCircle } from 'lucide-react';
import { ROSE_POUDRE_BANNER } from '../data/mockData';

interface HeroBannerProps {
  onExploreClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick }) => {
  const { setIsCreatorFormOpen } = useApp();

  // Dynamic rotating headline as seen in the pitch video: "en 3 minutes." / "sans coder." / "dès ce soir."
  const rotatingPhrases = ['en 3 minutes.', 'sans coder.', 'dès ce soir.'];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="space-y-4">
      {/* 1. Main Banner Rose Poudré Chic avec feuilles décoratives */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FCE8EF] border border-[#F8D7E3] p-6 sm:p-10 shadow-xs">
        {/* Subtle decorative botanical leaves overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center mix-blend-multiply"
          style={{ backgroundImage: `url(${ROSE_POUDRE_BANNER})` }}
        />

        {/* Decorative leaf shapes */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-radial from-[#F8D7E3] to-transparent rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-radial from-[#E8A0BF]/30 to-transparent rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          {/* Top Badge inclusif Hommes & Femmes */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#F8D7E3] shadow-2xs backdrop-blur-xs">
            <span className="text-[11px] font-bold text-[#8B2D4A] uppercase tracking-wider flex items-center gap-1.5">
              <span>🌿</span>
              <span>Lancement Officiel Sénégal · Hommes & Femmes</span>
              <span>🇸🇳</span>
            </span>
          </div>

          {/* Chic Serif Title in #8B2D4A as specified */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-[#8B2D4A] tracking-tight leading-tight">
            Les boutiques TERANGA BEAUTY
          </h1>

          {/* Dynamic headline directly copied from the video model */}
          <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#3D232A]">
            <span>Votre boutique en ligne, </span>
            <span className="inline-block text-[#D46A8A] transition-all duration-300 underline decoration-[#D46A8A]/40 decoration-wavy underline-offset-6">
              {rotatingPhrases[currentPhraseIndex]}
            </span>
          </div>

          {/* Convincing pitch from video model, tailored for both boys/men & women */}
          <p className="text-xs sm:text-sm md:text-base text-[#5A2D3A] max-w-2xl mx-auto leading-relaxed font-normal">
            La plateforme dakaroise pour tous les créateurs, commerçants et artisans • Hommes & Femmes • Mode wax, boubous brodés, soins naturels, maroquinerie & créations locales.
            Vendez directement sur WhatsApp et encaissez par Wave & Orange Money sans commission cachée.
          </p>

          {/* Categories Pills from video */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap pt-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F8D7E3] text-[#8B2D4A] shadow-2xs">
              👔 Boubous & Mode Wax
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F8D7E3] text-[#8B2D4A] shadow-2xs">
              🌿 Soins Naturels & Karité
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F8D7E3] text-[#8B2D4A] shadow-2xs">
              👞 Chaussures & Babouches
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F8D7E3] text-[#8B2D4A] shadow-2xs">
              👜 Maroquinerie Artisanale
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F8D7E3] text-[#8B2D4A] shadow-2xs">
              ✨ Thiouraye Traditionnel
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => setIsCreatorFormOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Devenir vendeuse (Ouvrir ma boutique)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-[#FCE8EF] text-[#8B2D4A] border border-[#F8D7E3] text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Découvrir les boutiques</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
