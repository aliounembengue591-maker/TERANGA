import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, ArrowRight, ArrowLeft, Store, Camera, Sparkles, CheckCircle2, Trash2, ShieldCheck, MapPin, Loader2, Package } from 'lucide-react';
import { compressLogoFast, uploadOrCompressProductImage } from '../services/imageUpload';
import { DAKAR_ZONES } from '../data/dakarNeighborhoods';
import { ProductCategory } from '../types';

const CITIES_AND_QUARTERS = [
  'Dakar - Plateau',
  'Dakar - Médina',
  'Dakar - Almadies / Ngor / Yoff',
  'Dakar - Fann / Point E / Mermoz',
  'Dakar - Parcelles Assainies',
  'Guédiawaye',
  'Pikine',
  'Rufisque',
  'Keur Massar',
  'Touba',
  'Thiès',
  'Mbour / Saly',
  'Saint-Louis',
  'Autre quartier / ville'
];

const MAIN_CATEGORIES = [
  'Perruques & Mèches',
  'Boubous & Bazin',
  'Cosmétiques & Karité',
  'Thiouraye & Encens',
  'Bijoux & Accessoires',
  'Mode & Prêt-à-porter',
  'Autre'
];

export const CreatorRegistrationModal: React.FC = () => {
  const {
    isCreatorFormOpen,
    setIsCreatorFormOpen,
    registerVendor,
    setCurrentRole,
    setActiveVendorId,
    openShopCatalogue,
    vendors,
    showToast
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ÉTAPE 1 : Compte Vendeuse (Style Izi Shop Sénégal)
  const [fullName, setFullName] = useState<string>('');
  const [whatsAppNumber, setWhatsAppNumber] = useState<string>('');
  const [simplePin, setSimplePin] = useState<string>('');
  const [cityQuarter, setCityQuarter] = useState<string>('Guédiawaye');
  const [customQuarter, setCustomQuarter] = useState<string>('');
  const [step1Error, setStep1Error] = useState<string>('');

  // ÉTAPE 2 : Ma Boutique
  const [boutiqueName, setBoutiqueName] = useState<string>('');
  const [boutiqueLogo, setBoutiqueLogo] = useState<string>('');
  const [isLogoCompressing, setIsLogoCompressing] = useState<boolean>(false);
  const [categoryChoice, setCategoryChoice] = useState<string>('Perruques & Mèches');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [shortBio, setShortBio] = useState<string>('');
  const [deliversDakar, setDeliversDakar] = useState<boolean>(true);
  const [deliversOutside, setDeliversOutside] = useState<boolean>(true);
  const [step2Error, setStep2Error] = useState<string>('');

  // Insertion obligatoire du 1er produit réel (Fin des 4 échantillons fictifs)
  const [firstProductName, setFirstProductName] = useState<string>('');
  const [firstProductPrice, setFirstProductPrice] = useState<string>('25000');
  const [firstProductImage, setFirstProductImage] = useState<string>('');
  const [firstProductDesc, setFirstProductDesc] = useState<string>('');
  const [isFirstProductUploading, setIsFirstProductUploading] = useState<boolean>(false);

  // Upload Photo 1er Produit Réel
  const handleFirstProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setFirstProductImage(preview);
    setIsFirstProductUploading(true);

    try {
      const base64 = await uploadOrCompressProductImage(file);
      if (base64) {
        setFirstProductImage(base64);
      }
    } catch (err) {
      console.warn('Product image compress fallback', err);
    } finally {
      setIsFirstProductUploading(false);
    }
  };

  // Created vendor result
  const [createdShopId, setCreatedShopId] = useState<string>('');

  if (!isCreatorFormOpen) return null;

  // Clean WhatsApp number
  const cleanPhone = whatsAppNumber.replace(/\D/g, '');

  // Step 1: Submit Vendeuse Account
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');

    if (!fullName.trim()) {
      setStep1Error('Veuillez renseigner votre nom complet (ex: Fatou Diop).');
      return;
    }

    if (cleanPhone.length < 8) {
      setStep1Error('Veuillez entrer un numéro WhatsApp valide (ex: 77 123 45 67).');
      return;
    }

    if (!simplePin || simplePin.length < 4) {
      setStep1Error('Veuillez choisir un code simple à 4 chiffres (comme pour Wave).');
      return;
    }

    const resolvedLocation = cityQuarter === 'Autre quartier / ville'
      ? (customQuarter.trim() || 'Dakar')
      : cityQuarter;

    // Auto-save seller account
    try {
      const generatedEmail = `221${cleanPhone}@terangabeauty.sn`;
      localStorage.setItem('tb_vendor_account_v2029', JSON.stringify({
        name: fullName.trim(),
        phone: `+221 ${cleanPhone}`,
        pin: simplePin,
        location: resolvedLocation,
        email: generatedEmail,
        createdAt: new Date().toISOString()
      }));
    } catch {
      // Ignored
    }

    // Auto default boutique name if empty
    if (!boutiqueName) {
      setBoutiqueName(`Boutique ${fullName.trim().split(' ')[0]} ${categoryChoice.split(' ')[0]}`);
    }

    // Auto redirect to Step 2: Ma Boutique
    setStep(2);
  };

  // Upload Logo Libre (max 400x400)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const preview = URL.createObjectURL(file);
    setBoutiqueLogo(preview);
    setIsLogoCompressing(true);

    try {
      const base64 = await compressLogoFast(file);
      if (base64) {
        setBoutiqueLogo(base64);
      }
    } catch (err) {
      console.warn('Logo compress fallback to preview', err);
    } finally {
      setIsLogoCompressing(false);
    }
  };

  // Step 2: Ouvrir ma boutique
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error('');

    if (!boutiqueName.trim()) {
      setStep2Error('Veuillez donner un nom à votre boutique (ex: Fatou Perruques VIP).');
      return;
    }

    const finalCategory = categoryChoice === 'Autre'
      ? (customCategory.trim() || 'Mode & Beauté')
      : categoryChoice;

    const resolvedLocation = cityQuarter === 'Autre quartier / ville'
      ? (customQuarter.trim() || 'Dakar')
      : cityQuarter;

    const fullPhone = `+221 ${cleanPhone}`;

    // Delivery zones label
    const zones = [];
    if (deliversDakar) zones.push('Dakar');
    if (deliversOutside) zones.push('Régions & International');

    const defaultBio = `${boutiqueName.trim()} : Spécialiste ${finalCategory} à ${resolvedLocation}. Paiement direct Wave & Orange Money.`;

    const initials = boutiqueName.trim().slice(0, 2).toUpperCase() || 'TB';
    const fallbackLogo = boutiqueLogo || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23D46A8A"/><circle cx="100" cy="100" r="85" fill="none" stroke="%23F8D7E3" stroke-width="4"/><text x="100" y="115" font-family="serif" font-size="44" font-weight="bold" fill="%23FFFFFF" text-anchor="middle">${initials}</text></svg>`;

    // Mapping catégorie vers ProductCategory
    let mappedCategory: ProductCategory = 'mode';
    const catLow = finalCategory.toLowerCase();
    if (catLow.includes('perruque') || catLow.includes('mèche')) mappedCategory = 'perruques';
    else if (catLow.includes('boubou') || catLow.includes('bazin')) mappedCategory = 'boubous';
    else if (catLow.includes('cosmétique') || catLow.includes('karité') || catLow.includes('soin')) mappedCategory = 'cosmetiques';
    else if (catLow.includes('thiouraye') || catLow.includes('encens') || catLow.includes('parfum')) mappedCategory = 'cosmetiques';
    else if (catLow.includes('bijou')) mappedCategory = 'bijoux';

    // Création immédiate du premier produit propre (pas d'échantillon fictif)
    const initialProductsList = firstProductName.trim() ? [{
      name: firstProductName.trim(),
      price: Number(firstProductPrice) || 20000,
      category: mappedCategory,
      image: firstProductImage || fallbackLogo,
      description: firstProductDesc.trim() || `${firstProductName.trim()} par ${boutiqueName.trim()} à ${resolvedLocation}.`,
      sizes: ['S', 'M', 'L', 'XL'] as ('S' | 'M' | 'L' | 'XL')[]
    }] : undefined;

    const newShop = registerVendor({
      name: boutiqueName.trim(),
      ownerName: fullName.trim() || boutiqueName.trim(),
      phone: fullPhone,
      waveNumber: fullPhone,
      orangeMoneyNumber: fullPhone,
      neighborhood: resolvedLocation,
      bio: shortBio.trim() || defaultBio,
      creatorTag: finalCategory,
      avatar: fallbackLogo,
      initialProducts: initialProductsList
    });

    if (newShop?.id) {
      setCreatedShopId(newShop.id);
      setActiveVendorId(newShop.id);
    }

    setCurrentRole('vendor');
    setStep(3); // Show Success Screen
  };

  // Action: Aller ajouter le 1er produit
  const handleGoToAddFirstProduct = () => {
    setIsCreatorFormOpen(false);
    setCurrentRole('vendor');
    // Scroll and highlight
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast({
      title: 'Boutique Ouverte !',
      message: 'Cliquez sur "📸 Mettre en vente direct" pour ajouter votre 1er article.',
      type: 'success'
    });
  };

  // Action: Voir le catalogue boutique
  const handleOpenMyCatalogue = () => {
    setIsCreatorFormOpen(false);
    setCurrentRole('vendor');
    const targetShop = vendors.find((v) => v.id === createdShopId) || vendors[0];
    if (targetShop) {
      openShopCatalogue(targetShop);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsCreatorFormOpen(false)}
    >
      <div
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#F8D7E3] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Izi Shop Style avec ProgressBar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#F8D7E3] bg-[#FFF9FB]">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1 rounded-full hover:bg-[#FCE8EF] text-[#8B2D4A] transition-colors cursor-pointer mr-1"
                aria-label="Retour"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#D46A8A] text-white text-xs font-black flex items-center justify-center shadow-xs">
                {step === 3 ? '✓' : step}
              </span>
              <span className="font-serif font-black text-[#8B2D4A] text-sm">
                {step === 1
                  ? 'Étape 1/2 : Compte Vendeuse'
                  : step === 2
                  ? 'Étape 2/2 : Ma Boutique'
                  : 'Boutique en ligne !'}
              </span>
            </div>
          </div>

          {/* Progress Bar 1/2 -> 2/2 */}
          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-28 bg-[#F8D7E3] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#D46A8A] h-full transition-all duration-300 rounded-full"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>

            <button
              onClick={() => setIsCreatorFormOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4">
          {/* ======================================================== */}
          {/* ÉTAPE 1 : COMPTE VENDEUSE (STYLE IZI SHOP SÉNÉGAL)        */}
          {/* ======================================================== */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-[11px] font-bold border border-[#F8D7E3]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D46A8A]" />
                  <span>Inscription Vendeuse Dakaroise</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A] pt-0.5">
                  Créez votre compte vendeuse
                </h3>
                <p className="text-xs text-[#5A2D3A] max-w-sm mx-auto">
                  Aucun email compliqué. Renseignez simplement votre nom, votre WhatsApp et un code secret à 4 chiffres.
                </p>
              </div>

              {step1Error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold animate-in fade-in">
                  ⚠️ {step1Error}
                </div>
              )}

              {/* 1. Nom complet */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Nom complet * <span className="text-[11px] font-normal text-slate-500">(ex: Fatou Diop)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fatou Diop, Aminata Sow..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A] text-slate-800 font-medium"
                />
              </div>

              {/* 2. Numéro WhatsApp (+221 visual verification) */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Numéro WhatsApp * <span className="text-[11px] font-normal text-slate-500">(Paiement 100% direct Wave & OM)</span>
                </label>
                <div className="flex items-center rounded-xl border border-[#F8D7E3] overflow-hidden focus-within:border-[#D46A8A] bg-white">
                  <span className="px-3 py-2.5 bg-[#FCE8EF] text-[#8B2D4A] font-bold text-xs border-r border-[#F8D7E3] shrink-0">
                    🇸🇳 +221
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="77 123 45 67 ou 78 000 00 00"
                    value={whatsAppNumber}
                    onChange={(e) => setWhatsAppNumber(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Vos clients vous contacteront et vous enverront l'argent directement sur ce numéro.
                </p>
              </div>

              {/* 3. Mot de passe simple (4 chiffres comme Wave) */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Mot de passe simple * <span className="text-[11px] font-normal text-slate-500">(4 chiffres, comme code Wave)</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="Ex: 2029"
                  value={simplePin}
                  onChange={(e) => setSimplePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A] text-slate-800 font-bold tracking-widest text-center text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-center">
                  Retenez bien ces 4 chiffres pour gérer vos articles et vos commandes.
                </p>
              </div>

              {/* 4. Ville / Quartier Dropdown + champ libre */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Ville / Quartier *
                </label>
                <div className="space-y-1.5">
                  <select
                    value={cityQuarter}
                    onChange={(e) => setCityQuarter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] bg-[#FFF9FB] text-xs text-slate-800 font-medium focus:outline-none focus:border-[#D46A8A] cursor-pointer"
                  >
                    {CITIES_AND_QUARTERS.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>

                  {cityQuarter === 'Autre quartier / ville' && (
                    <input
                      type="text"
                      required
                      placeholder="Précisez votre quartier ou ville..."
                      value={customQuarter}
                      onChange={(e) => setCustomQuarter(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A] text-xs text-slate-800"
                    />
                  )}
                </div>
              </div>

              {/* Big Rose Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Créer mon compte →</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 2 : MA BOUTIQUE (AUTO REDIRECT APRÈS COMPTE CRÉÉ)    */}
          {/* ======================================================== */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4 text-xs">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Compte vendeuse prêt : {fullName}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A] pt-0.5">
                  Configurez votre boutique
                </h3>
                <p className="text-xs text-[#5A2D3A] max-w-sm mx-auto">
                  Donnez un nom et un logo à votre boutique pour que les clientes vous identifient facilement.
                </p>
              </div>

              {step2Error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold animate-in fade-in">
                  ⚠️ {step2Error}
                </div>
              )}

              {/* 1. Nom boutique */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Nom de la boutique * <span className="text-[11px] font-normal text-slate-500">(ex: Fatou Perruques VIP)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fatou Perruques VIP, Bazin Royal Dakar, Keur Thiouraye..."
                  value={boutiqueName}
                  onChange={(e) => setBoutiqueName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A] text-slate-800 font-bold"
                />
              </div>

              {/* 2. Logo boutique (upload libre 1 photo max, compress 400x400) */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Logo / Photo de profil boutique <span className="text-[11px] font-normal text-slate-500">(Optionnel mais recommandé)</span>
                </label>

                {boutiqueLogo ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-[#F8D7E3] bg-[#FFF9FB]">
                    <img
                      src={boutiqueLogo}
                      alt="Logo boutique"
                      className="w-16 h-16 rounded-xl object-cover border border-[#D46A8A]"
                    />
                    <div className="flex-1 space-y-1">
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Logo chargé</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1 rounded-lg bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] font-bold text-[10px] cursor-pointer">
                          Changer
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setBoutiqueLogo('')}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-[#D46A8A] bg-[#FFF9FB] hover:bg-[#FCE8EF] cursor-pointer transition-colors text-center">
                    <Camera className="w-5 h-5 text-[#D46A8A]" />
                    <span className="font-bold text-xs text-[#8B2D4A]">
                      📸 Choisir une photo ou logo (depuis galerie)
                    </span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* 3. Catégorie principale */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Catégorie principale *
                </label>
                <div className="space-y-1.5">
                  <select
                    value={categoryChoice}
                    onChange={(e) => setCategoryChoice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] bg-[#FFF9FB] text-xs text-slate-800 font-medium focus:outline-none focus:border-[#D46A8A] cursor-pointer"
                  >
                    {MAIN_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {categoryChoice === 'Autre' && (
                    <input
                      type="text"
                      required
                      placeholder="Précisez votre catégorie..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#F8D7E3] focus:outline-none text-xs text-slate-800"
                    />
                  )}
                </div>
              </div>

              {/* 4. Description courte 1 phrase */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Description courte (1 phrase)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Confection de boubous bazin riche et robes de soirée sur mesure à Dakar."
                  value={shortBio}
                  onChange={(e) => setShortBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none text-slate-800"
                />
              </div>

              {/* 5. Livraison Checkbox */}
              <div className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F8D7E3] space-y-2">
                <span className="block font-bold text-[#8B2D4A] text-xs">
                  Options de livraison :
                </span>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={deliversDakar}
                      onChange={(e) => setDeliversDakar(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D46A8A] focus:ring-[#D46A8A] accent-[#D46A8A]"
                    />
                    <span>Je livre à Dakar (24h)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={deliversOutside}
                      onChange={(e) => setDeliversOutside(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D46A8A] focus:ring-[#D46A8A] accent-[#D46A8A]"
                    />
                    <span>Je livre Hors Dakar (Régions)</span>
                  </label>
                </div>
              </div>

              {/* 6. Inserer son propre produit dès l'ouverture (Fin des 4 échantillons fictifs) */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border-2 border-[#D4AF37]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-serif font-black text-xs text-[#7B1D2A] uppercase tracking-wide">
                      📸 Insérez votre 1er article en direct
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#D4AF37] text-stone-950 font-black px-2 py-0.5 rounded-full">
                    Vos propres créations
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-tight">
                  Chaque vendeuse insère directement ses propres confections avec sa vraie photo et son prix (aucun échantillon fictif).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      Nom de l'article *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Robe Bazin Rose Poudré, Perruque Bob Lace..."
                      value={firstProductName}
                      onChange={(e) => setFirstProductName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D4AF37] text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      Prix de vente en FCFA *
                    </label>
                    <input
                      type="number"
                      min={500}
                      step={500}
                      placeholder="Ex: 25000"
                      value={firstProductPrice}
                      onChange={(e) => setFirstProductPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D4AF37] text-xs text-slate-800 font-bold text-[#8B2D4A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-[11px] mb-1">
                    Photo réelle de votre article *
                  </label>
                  {firstProductImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#D4AF37] h-28 w-28 bg-stone-900 group">
                      <img src={firstProductImage} alt="Article" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFirstProductImage('')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white text-[10px] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#D4AF37]/60 hover:border-[#D4AF37] bg-white cursor-pointer transition-colors text-xs font-bold text-[#7B1D2A]">
                      {isFirstProductUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      ) : (
                        <Camera className="w-4 h-4 text-[#D4AF37]" />
                      )}
                      <span>📸 Prendre photo / Choisir depuis galerie</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFirstProductImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Ouvrir ma boutique →</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 3 : SUCCESS (BRAVO ! TA BOUTIQUE EST EN LIGNE)     */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="text-center space-y-4 py-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center justify-center gap-1">
                  <span>En attente de validation Admin Teranga ⏳</span>
                </span>
                <h2 className="text-2xl font-serif font-black text-[#8B2D4A]">
                  Boutique soumise avec succès !
                </h2>
                <p className="text-xs text-[#5A2D3A] leading-relaxed">
                  <strong>{boutiqueName}</strong> a été transmise en direct à la supervision.
                  Dès validation par l'Admin avec le label <strong>Maison Sélectionnée ⭐</strong>, vous recevrez une confirmation sur WhatsApp ({cleanPhone}) et votre boutique sera visible par toutes les clientes avec paiement direct Wave & Orange Money.
                </p>
              </div>

              {/* Carte récapitulative vitrine */}
              <div className="p-3.5 rounded-2xl bg-[#FFF9FB] border border-[#F8D7E3] text-left flex items-center gap-3 max-w-md mx-auto">
                {boutiqueLogo ? (
                  <img src={boutiqueLogo} alt={boutiqueName} className="w-14 h-14 rounded-xl object-cover border border-[#D4AF37]" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#FCE8EF] text-[#8B2D4A] flex items-center justify-center font-bold text-base border border-[#F8D7E3]">
                    {boutiqueName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{boutiqueName}</h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" />
                    <span>Dakar · {cityQuarter}</span>
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    ✓ Wave & OM Direct (+221 {cleanPhone})
                  </p>
                </div>
              </div>

              {/* 1er produit inséré en direct */}
              {firstProductName && (
                <div className="p-3 rounded-2xl bg-[#FFF8F0] border border-[#D4AF37]/50 text-left flex items-center gap-3 max-w-md mx-auto shadow-2xs">
                  {firstProductImage ? (
                    <img src={firstProductImage} alt={firstProductName} className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-[#7B1D2A] flex items-center justify-center font-bold">
                      <Package className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-[#D4AF37] text-stone-950 font-bold px-1.5 py-0.2 rounded-md">Article réel en ligne</span>
                      <h5 className="text-xs font-bold text-stone-900 truncate">{firstProductName}</h5>
                    </div>
                    <p className="text-xs font-black text-[#7B1D2A] tabular-nums mt-0.5">
                      {(Number(firstProductPrice) || 20000).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                </div>
              )}

              {/* Action: Ajouter mon 1er produit (which is the fast upload we fixed) */}
              <div className="pt-2 flex flex-col gap-2.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleGoToAddFirstProduct}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>📸 Ajouter mon 1er produit en vente direct</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenMyCatalogue}
                  className="w-full py-2.5 px-4 rounded-2xl bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] text-xs font-bold border border-[#F8D7E3] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4 text-[#D46A8A]" />
                  <span>👁️ Voir ma vitrine boutique</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
