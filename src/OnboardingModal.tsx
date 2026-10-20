import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Store, ShoppingBag, Sparkles, ArrowRight, Mail, Phone, User, CheckCircle2, X } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    userAccount,
    registerUserAccount,
    setCurrentRole,
    setIsCreatorFormOpen,
    activeVendor,
    openShopCatalogue,
    showToast
  } = useApp();

  const [step, setStep] = useState<'create_account' | 'choose_role'>(
    userAccount?.email ? 'choose_role' : 'create_account'
  );
  const [email, setEmail] = useState<string>(userAccount?.email || '');
  const [fullName, setFullName] = useState<string>(userAccount?.name || '');
  const [phone, setPhone] = useState<string>(userAccount?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  if (!isOnboardingModalOpen) return null;

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Veuillez entrer une adresse email valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUserAccount({
        email: cleanEmail,
        name: fullName.trim() || cleanEmail.split('@')[0],
        phone: phone.trim()
      });
      // Move to 2 cages selection
      setStep('choose_role');
    } catch (err) {
      console.error('Erreur compte:', err);
      setFormError('Erreur lors de l\'enregistrement. Vous pouvez continuer.');
      setStep('choose_role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectVendor = () => {
    setCurrentRole('vendor');
    setIsOnboardingModalOpen(false);

    // If user already has a shop, open vendor dashboard
    if (activeVendor) {
      showToast({
        title: 'Espace Vendeuse Ouvert',
        message: `Bienvenue dans votre boutique "${activeVendor.name}". Vous pouvez mettre vos produits en vente direct.`,
        type: 'success'
      });
    } else {
      // Open boutique registration modal so they can create their shop immediately
      setIsCreatorFormOpen(true);
    }
  };

  const handleSelectClient = () => {
    setCurrentRole('client');
    setIsOnboardingModalOpen(false);
    showToast({
      title: 'Bienvenue sur TERANGA BEAUTY !',
      message: 'Explorez nos articles et contactez directement les vendeuses sur WhatsApp ou par appel.',
      type: 'info'
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        // Only allow clicking outside to close if they have an account already
        if (userAccount?.email) setIsOnboardingModalOpen(false);
      }}
    >
      <div
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#F8D7E3] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-[#FFF9FB] border-b border-[#F8D7E3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo-gold-t.svg" alt="T" className="w-7 h-7 object-contain drop-shadow-2xs" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-black text-[#8B2D4A] tracking-wide">
                TERANGA BEAUTY
              </h2>
              <p className="text-[10px] text-[#8B2D4A]/70">Marketplace Beauté & Mode · Dakar</p>
            </div>
          </div>

          {userAccount?.email && (
            <button
              onClick={() => setIsOnboardingModalOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
          {/* STEP 1: CREATE ACCOUNT WITH EMAIL */}
          {step === 'create_account' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-xs font-bold border border-[#F8D7E3]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D46A8A]" />
                  <span>Bienvenue sur TERANGA BEAUTY</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A] pt-1">
                  Créez votre compte en 10 secondes
                </h3>
                <p className="text-xs text-[#5A2D3A] max-w-md mx-auto">
                  Entrez votre adresse email pour accéder à la marketplace, ouvrir votre boutique ou contacter directement les créatrices à Dakar.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs animate-in fade-in">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleAccountSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#8B2D4A] mb-1">
                    Votre Adresse Email * <span className="text-[11px] font-normal text-slate-500">(Obligatoire)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#D46A8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Ex: fatou.diop@gmail.com ou votre-email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A] text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#8B2D4A] mb-1">
                    Prénom & Nom <span className="text-[11px] font-normal text-slate-400">(Recommandé)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#D46A8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ex: Fatou Diop, Alioune Mbengue..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A] text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#8B2D4A] mb-1">
                    Numéro Téléphone / WhatsApp <span className="text-[11px] font-normal text-slate-400">(Pour les échanges directs)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#D46A8A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="Ex: 77 123 45 67 ou 78 000 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A] text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Continuer avec cet Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-400 pt-1">
                  Paiement 100% direct Wave & Orange Money · Zéro commission immédiate aux vendeuses
                </p>
              </form>
            </div>
          )}

          {/* STEP 2: LES 2 CAGES S'AFFICHENT */}
          {step === 'choose_role' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D46A8A]">
                  Compte actif : {userAccount?.email || email}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A]">
                  Que souhaitez-vous faire ?
                </h3>
                <p className="text-xs text-[#5A2D3A] max-w-md mx-auto">
                  Choisissez une option pour personnaliser votre accès sur TERANGA BEAUTY :
                </p>
              </div>

              {/* LES 2 GRANDES CAGES INTERACTIVES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* CAGE 1: CRÉER MA BOUTIQUE */}
                <div
                  onClick={handleSelectVendor}
                  className="group relative bg-[#FFF9FB] hover:bg-[#FCE8EF] border-2 border-[#D46A8A] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#D46A8A] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Store className="w-6 h-6" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#D46A8A] text-white text-[10px] font-bold uppercase tracking-wider">
                        Vendeuse
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-serif font-black text-[#8B2D4A] group-hover:text-[#641E34]">
                        Créer ma boutique
                      </h4>
                      <p className="text-xs text-[#5A2D3A] mt-1 leading-relaxed">
                        Ouvrez votre boutique en ligne à Dakar, mettez vos articles en <strong>vente direct</strong> avec vos propres photos et recevez 100% de vos paiements sur <strong>Wave & Orange Money</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F8D7E3] flex items-center justify-between text-[#8B2D4A] font-bold text-xs">
                    <span>Ouvrir ma boutique</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* CAGE 2: JE VEUX FAIRE DES ACHATS */}
                <div
                  onClick={handleSelectClient}
                  className="group relative bg-white hover:bg-[#FFF9FB] border-2 border-[#8B2D4A] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#8B2D4A] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#8B2D4A] text-white text-[10px] font-bold uppercase tracking-wider">
                        Acheteur
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-serif font-black text-[#8B2D4A] group-hover:text-[#641E34]">
                        Je veux faire des achats
                      </h4>
                      <p className="text-xs text-[#5A2D3A] mt-1 leading-relaxed">
                        Découvrez les plus beaux boubous bazin, cosmétiques naturels, parfums thiouraye et perruques. <strong>Contactez directement la vendeuse</strong> du produit par WhatsApp ou appel.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F8D7E3] flex items-center justify-between text-[#8B2D4A] font-bold text-xs">
                    <span>Explorer le catalogue</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Bouton pour changer d'email au besoin */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setStep('create_account')}
                  className="text-[11px] text-[#8B2D4A]/70 hover:text-[#8B2D4A] underline font-medium cursor-pointer"
                >
                  Changer d'adresse email ({email})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
