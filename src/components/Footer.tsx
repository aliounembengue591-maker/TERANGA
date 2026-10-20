import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const {
    isInitiatorAuthenticated,
    setIsInitiatorModalOpen,
    currentRole,
    setCurrentRole
  } = useApp();

  return (
    <footer className="mt-8 bg-[#111111] text-stone-300 rounded-t-[32px] sm:rounded-t-[40px] pt-6 pb-20 sm:pb-8 px-4 text-center">
      <div className="max-w-md mx-auto space-y-4">
        {/* Golden title: "Paiements sécurisés" */}
        <p className="text-xs font-semibold text-[#DDB37B] tracking-wide">
          Paiements sécurisés à Dakar
        </p>

        {/* Wave and Orange Money Pill Buttons */}
        <div className="flex items-center justify-center gap-3">
          {/* Wave Button */}
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00B2E3] text-white shadow-xs cursor-default">
            {/* Wave Penguin/Waveform Icon */}
            <div className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center font-black text-[9px] text-white">
              ~
            </div>
            <span className="text-xs font-bold tracking-tight">Wave</span>
          </div>

          {/* Orange Money Button */}
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF7900] text-white shadow-xs cursor-default">
            {/* Orange Money Icon */}
            <div className="w-4 h-4 rounded-sm bg-white/25 flex items-center justify-center font-black text-[9px] text-white">
              OM
            </div>
            <span className="text-xs font-bold tracking-tight">Orange Money</span>
          </div>
        </div>

        {/* Clean copyright and footer links */}
        <div className="pt-2 space-y-1.5">
          <div className="flex justify-center">
            <a
              href="https://teranga-beauty-luxe.web.app"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-amber-900/30 text-stone-300 transition-colors"
            >
              <img src="/logo-gold-t.svg" alt="T" className="w-3.5 h-3.5 object-contain" />
              <span className="text-[10px] tracking-wider text-[#DEA83A] font-serif font-bold">
                teranga-beauty-luxe.web.app
              </span>
            </a>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 tracking-tight">
            © 2026 TERANGA BEAUTY · Hommes & Femmes Dakar · by DIGITaline
          </p>

          {/* Discreet Initiator access */}
          <div className="pt-1">
            {isInitiatorAuthenticated ? (
              <button
                onClick={() => setCurrentRole(currentRole === 'admin' ? 'client' : 'admin')}
                className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Espace Initiateur (Alioune) · {currentRole === 'admin' ? 'Quitter Admin' : 'Superviser'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsInitiatorModalOpen(true)}
                className="inline-flex items-center gap-1 text-[10px] text-stone-600 hover:text-stone-400 transition-colors cursor-pointer"
                title="Accès réservé à l'initiateur"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Espace Fondateur Privé</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
