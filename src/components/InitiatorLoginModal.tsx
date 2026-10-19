import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, X, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export const InitiatorLoginModal: React.FC = () => {
  const { isInitiatorModalOpen, setIsInitiatorModalOpen, loginAsInitiator } = useApp();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isInitiatorModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = loginAsInitiator(pin);
    if (!success) {
      setErrorMsg('Code secret invalide. Accès strictement réservé à l\'initiateur.');
    } else {
      setPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsInitiatorModalOpen(false)}
    >
      <div
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#F8D7E3] p-6 sm:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setIsInitiatorModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#FCE8EF] border border-[#F8D7E3] text-[#8B2D4A] flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-[11px] font-bold uppercase tracking-wider border border-[#F8D7E3]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D46A8A]" />
            <span>Sécurité Initiateur</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A]">
            Espace Fondateur Réservé
          </h2>
          <p className="text-xs text-[#5A2D3A] leading-relaxed">
            Nul ne peut voir ou administrer TERANGA BEAUTY sauf vous, l'initiateur.
          </p>
        </div>

        {/* Initiator ID verification display */}
        <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F8D7E3] text-left text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8B2D4A]/70 tracking-wider">
            Compte Initiateur Enregistré :
          </span>
          <p className="font-bold text-[#8B2D4A] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>aliounembengue591@gmail.com</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8B2D4A] mb-1.5 text-left">
              Code Confidentiel Initiateur (Masqué) :
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D46A8A]" />
              <input
                type="password"
                required
                autoFocus
                autoComplete="off"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#F8D7E3] bg-[#FFF9FB] text-base font-bold tracking-widest text-slate-900 focus:outline-none focus:border-[#D46A8A] focus:ring-2 focus:ring-[#F8D7E3]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#8B2D4A] hover:bg-[#641E34] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Déverrouiller l'Espace Initiateur</span>
          </button>
        </form>
      </div>
    </div>
  );
};
