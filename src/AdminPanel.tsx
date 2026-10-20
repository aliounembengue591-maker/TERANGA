import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Package,
  Sparkles,
  Plus,
  Trash2,
  Store,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShoppingBag,
  X,
  CheckCircle2,
  Flower2,
  Clock,
  Check,
  Lock,
  LogOut,
  AlertTriangle,
  Camera,
  Loader2
} from 'lucide-react';
import { ProductCategory, CommissionRecord } from '../types';
import { DAKAR_ZONES } from '../data/dakarNeighborhoods';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { LuxuryShopCard } from './LuxuryShopCard';
import { ConfirmDeleteShopModal } from './ConfirmDeleteShopModal';
import { uploadOrCompressProductImage } from '../services/imageUpload';

import awaPortraitImg from '../assets/images/awa_fashion_portrait_1792239007909.jpg';
import moussaPortraitImg from '../assets/images/moussa_portrait_1792239009061.jpg';
import keurSabarPortraitImg from '../assets/images/keur_sabar_duo_portrait_1792239009383.jpg';
import voileBeigeImg from '../assets/images/voile_beige_luxury_1792196275342.jpg';

export const AdminPanel: React.FC = () => {
  const {
    products,
    vendors,
    approvedVendors,
    pendingVendors,
    approveVendor,
    rejectVendor,
    updateProductStatus,
    orders,
    commissions,
    toggleProductBoost,
    adminAddVendor,
    adminAddProduct,
    deleteVendor,
    deleteShop,
    deleteProduct,
    clearAllVendorsAndProducts,
    cleanDemoData,
    loadSampleData,
    isInitiatorAuthenticated,
    loginAsInitiator,
    logoutInitiator,
    isFirestoreConnected,
    isCloudSyncing,
    syncLocalDataToFirestore,
    showToast,
    openShopCatalogue
  } = useApp();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [activeAdminTab, setActiveAdminTab] = useState<'pending' | 'vendors' | 'products' | 'overview'>(
    pendingVendors.length > 0 ? 'pending' : 'vendors'
  );

  // Filter "Boutiques Réelles vs Démo"
  const [vendorTypeFilter, setVendorTypeFilter] = useState<'all' | 'real' | 'demo'>('all');

  // Search & Filter state for direct Admin deletion of any vendor and product
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [vendorToDelete, setVendorToDelete] = useState<typeof vendors[0] | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeletingShop, setIsDeletingShop] = useState(false);

  const handleConfirmDeleteShop = async () => {
    if (!vendorToDelete) return;
    setIsDeletingShop(true);
    try {
      await deleteShop(vendorToDelete.id);
      setIsConfirmDeleteOpen(false);
      setVendorToDelete(null);
    } catch (err) {
      console.error('Erreur delete shop:', err);
    } finally {
      setIsDeletingShop(false);
    }
  };

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productVendorFilter, setProductVendorFilter] = useState<string>('all');
  const [productToDelete, setProductToDelete] = useState<typeof products[0] | null>(null);

  // Modals state
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [presetVendorIdForProduct, setPresetVendorIdForProduct] = useState<string>('');

  // New Vendor Form
  const [vendorName, setVendorName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorNeighborhood, setVendorNeighborhood] = useState('HLM');
  const [vendorBio, setVendorBio] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Mode & Boubous');
  const [creatorTag, setCreatorTag] = useState('Vendeuse • Artisan');
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState<'awa' | 'moussa' | 'keur' | 'voile'>('awa');

  // New Product Form (Vraies photos réelles - fin des 4 échantillons)
  const [targetVendorId, setTargetVendorId] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number>(25000);
  const [productPromoPrice, setProductPromoPrice] = useState<string>('');
  const [productCategory, setProductCategory] = useState<ProductCategory>('boubous');
  const [productStock, setProductStock] = useState<number>(10);
  const [productDesc, setProductDesc] = useState('');
  const [productCustomImage, setProductCustomImage] = useState<string>('');
  const [isUploadingProdImage, setIsUploadingProdImage] = useState<boolean>(false);

  // WhatsApp Notification History Log
  const [whatsappSentMap, setWhatsappSentMap] = useState<Record<string, { sent: boolean; sentAt: string }>>(() => {
    try {
      const saved = localStorage.getItem('tb_admin_whatsapp_sent_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const markWhatsAppSent = (id: string) => {
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const next = {
      ...whatsappSentMap,
      [id]: { sent: true, sentAt: timeStr }
    };
    setWhatsappSentMap(next);
    try {
      localStorage.setItem('tb_admin_whatsapp_sent_v2', JSON.stringify(next));
    } catch {}
  };

  // WhatsApp auto message for shop validation
  const sendValidationWhatsApp = (shop: typeof vendors[0]) => {
    const rawDigits = (shop.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawDigits.startsWith('221') ? rawDigits : (rawDigits.length === 9 ? `221${rawDigits}` : rawDigits);
    const boutiqueName = shop.name;
    const owner = shop.ownerName || shop.name;
    const message = `✨ Félicitations ${owner} !\n\nTa Maison ${boutiqueName} vient d'être validée par TERANGA BEAUTY et est maintenant visible en tant que MAISON SÉLECTIONNÉE ⭐ sur notre page d'accueil luxe.\n\n🔗 Voir ta boutique: https://teranga-beauty-luxe.web.app/boutique/${shop.id}\n\nConseil Luxe: Ajoute 2 produits avec la prompt Édition Limitée pour rester en TOP.\n\nBienvenue dans les Maisons de Beauté Sélectionnées de Dakar ! 💛\n- L'équipe Teranga`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    markWhatsAppSent(shop.id);
    showToast({
      title: 'Message WhatsApp prêt',
      message: 'Clique sur Envoyer dans WhatsApp pour féliciter la vendeuse !',
      type: 'success'
    });
  };

  const handleApproveShopWithWhatsApp = (shop: typeof vendors[0]) => {
    approveVendor(shop.id);
    sendValidationWhatsApp(shop);
  };

  // WhatsApp auto message for product validation
  const sendProductValidationWhatsApp = (prod: typeof products[0]) => {
    const targetVendor = vendors.find((v) => v.id === prod.vendorId) || approvedVendors.find((v) => v.id === prod.vendorId);
    const rawPhone = targetVendor?.phone || prod.vendorWhatsApp || (prod as any).whatsappVendeuse || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const phone = cleanPhone.startsWith('221') ? cleanPhone : (cleanPhone.length === 9 ? `221${cleanPhone}` : cleanPhone);
    const priceFormatted = (prod.promoPrice || prod.price).toLocaleString('fr-FR');
    const message = `✅ Ton produit ${prod.name} à ${priceFormatted} FCFA est validé ! Il est maintenant en ligne dans ta boutique luxe. Ajoutes-en encore pour garder ton badge Maison Sélectionnée.`;
    if (phone) {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
    markWhatsAppSent(prod.id);
    showToast({
      title: 'Message WhatsApp prêt',
      message: 'Clique sur Envoyer dans WhatsApp pour notifier la vendeuse !',
      type: 'success'
    });
  };

  const handleApproveProductWithWhatsApp = (prod: typeof products[0]) => {
    updateProductStatus(prod.id, 'approved');
    sendProductValidationWhatsApp(prod);
  };

  // Upload or compress custom product photo
  const handleProductImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast local preview
    const instantPreview = URL.createObjectURL(file);
    setProductCustomImage(instantPreview);
    setIsUploadingProdImage(true);

    try {
      const base64 = await uploadOrCompressProductImage(file);
      if (base64) {
        setProductCustomImage(base64);
      }
    } catch (err) {
      console.warn('Compress fallback to preview', err);
    } finally {
      setIsUploadingProdImage(false);
    }
  };

  // Stats
  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommissions = (commissions || []).reduce((sum: number, c: CommissionRecord) => sum + (c.commissionAmount || 0), 0);

  // Handle Add Vendor Submit
  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !vendorPhone.trim()) {
      showToast({ title: 'Champs requis', message: 'Veuillez saisir le nom de la boutique et le numéro WhatsApp.', type: 'warning' });
      return;
    }

    let chosenAvatar = awaPortraitImg;
    if (selectedAvatarPreset === 'moussa') chosenAvatar = moussaPortraitImg;
    if (selectedAvatarPreset === 'keur') chosenAvatar = keurSabarPortraitImg;
    if (selectedAvatarPreset === 'voile') chosenAvatar = voileBeigeImg;

    adminAddVendor({
      name: vendorName.trim(),
      ownerName: ownerName.trim() || vendorName.trim(),
      phone: vendorPhone.trim(),
      neighborhood: vendorNeighborhood,
      bio: vendorBio.trim() || `Boutique certifiée sur TERANGA BEAUTY Dakar.`,
      categoryLabel: vendorCategory,
      creatorTag,
      avatar: chosenAvatar
    });

    setVendorName('');
    setOwnerName('');
    setVendorPhone('');
    setVendorBio('');
    setIsAddVendorOpen(false);
  };

  // Handle Add Product Submit (Vraies photos réelles - zéro échantillon fictif)
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorId = targetVendorId || presetVendorIdForProduct || approvedVendors[0]?.id || vendors[0]?.id;
    if (!vendorId) {
      showToast({ title: 'Aucune boutique trouvée', message: 'Veuillez d’abord ajouter une boutique.', type: 'warning' });
      return;
    }
    if (!productName.trim() || !productPrice) {
      showToast({ title: 'Champs requis', message: 'Veuillez saisir le nom et le prix.', type: 'warning' });
      return;
    }

    if (!productCustomImage || productCustomImage.trim() === '') {
      showToast({
        title: 'Photo obligatoire',
        message: 'Veuillez importer ou photographier votre article réel (fin des 4 échantillons).',
        type: 'warning'
      });
      return;
    }

    const promo = productPromoPrice ? Number(productPromoPrice) : undefined;

    adminAddProduct({
      name: productName.trim(),
      price: Number(productPrice),
      promoPrice: promo,
      category: productCategory,
      vendorId,
      description: productDesc.trim() || `Création authentique confectionnée à Dakar.`,
      image: productCustomImage,
      photos: [productCustomImage],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: Number(productStock) || 5,
      isBoosted: false
    });

    setProductName('');
    setProductPrice(25000);
    setProductPromoPrice('');
    setProductDesc('');
    setProductCustomImage('');
    setIsAddProductOpen(false);
    setPresetVendorIdForProduct('');
  };

  const handleOpenAddProductForVendor = (vId: string) => {
    setPresetVendorIdForProduct(vId);
    setTargetVendorId(vId);
    setIsAddProductOpen(true);
  };

  // 1. Strict Initiator Access Control ("nulle ne doit voir la page admin sauf moi l initiateur")
  if (!isInitiatorAuthenticated) {
    return (
      <div className="py-12 max-w-md mx-auto px-4 text-center animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-[#F8D7E3] p-6 sm:p-8 shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-[#FCE8EF] border border-[#F8D7E3] text-[#8B2D4A] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-[11px] font-bold uppercase tracking-wider border border-[#F8D7E3]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D46A8A]" />
              <span>Accès Strictement Privé</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A]">
              Espace Réservé à l'Initiateur
            </h1>
            <p className="text-xs text-[#5A2D3A] leading-relaxed">
              Nul ne peut voir ou accéder à cette page sauf vous, l'initiateur (<strong>aliounembengue591@gmail.com</strong>).
            </p>
          </div>

          <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F8D7E3] text-left text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#8B2D4A]/70 tracking-wider">
              Compte Autorisé :
            </span>
            <p className="font-bold text-[#8B2D4A] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>aliounembengue591@gmail.com (Fondateur)</span>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPinError('');
              const ok = loginAsInitiator(pinInput);
              if (!ok) {
                setPinError('Code PIN invalide. Accès réservé à l\'initiateur.');
              } else {
                setPinInput('');
              }
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-bold text-[#8B2D4A] mb-1.5 text-left">
                Code Secret Initiateur :
              </label>
              <input
                type="password"
                required
                autoFocus
                autoComplete="off"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-[#F8D7E3] bg-[#FFF9FB] text-base font-bold tracking-widest text-slate-900 focus:outline-none focus:border-[#D46A8A]"
              />
            </div>

            {pinError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
            >
              Déverrouiller l'Espace Initiateur
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-5 max-w-5xl mx-auto">
      {/* Title Bar TERANGA BEAUTY Supervision Initiateur */}
      <div className="bg-[#8B2D4A] text-white rounded-3xl p-5 sm:p-7 shadow-md border border-[#F8D7E3]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#D46A8A] text-white">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#F8D7E3] uppercase tracking-wider">
              Espace Initiateur Fondateur Exclusif
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-white mt-1 tracking-tight">
            Supervision & Validation des Boutiques
          </h1>
          <p className="text-xs text-[#FCE8EF]/90 mt-0.5">
            Connecté en tant que : <strong className="underline text-amber-300">aliounembengue591@gmail.com</strong> (Initiateur)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {/* Synchronisation Firestore Temps Réel */}
          <button
            onClick={() => syncLocalDataToFirestore()}
            disabled={isCloudSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Synchroniser toutes les boutiques et produits vers Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isCloudSyncing ? 'Synchronisation...' : 'Sync Firestore'}</span>
          </button>

          {/* Déconnexion Initiateur */}
          <button
            onClick={logoutInitiator}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            title="Verrouiller l'accès"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Verrouiller Admin</span>
          </button>

          {/* Charger boutiques modèles */}
          <button
            onClick={loadSampleData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition-all cursor-pointer shadow-xs"
            title="Charger Awa Fashion, Moussa & Co et Keur Sabar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Charger modèles de test</span>
          </button>

          {/* Effacer tout */}
          <button
            onClick={() => {
              if (confirm('Voulez-vous vraiment effacer tous les produits et boutiques ? (Permet de repartir de zéro avant confirmation officielle)')) {
                clearAllVendorsAndProducts();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold border border-red-400/40 transition-all cursor-pointer shadow-xs"
            title="Effacer tous les produits et vendeurs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer tout (0 données)</span>
          </button>
        </div>
      </div>

      {/* TABLEAU DE BORD ANALYTIQUE EN HAUT DE PAGE ADMIN */}
      <AdminAnalyticsDashboard />

      {/* Statut de Synchronisation Cloud Firestore Temps Réel */}
      <div className="bg-[#FFF9FB] rounded-2xl border border-[#F8D7E3] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FCE8EF] border border-[#F8D7E3] text-[#8B2D4A] flex items-center justify-center shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B2D4A]">
                Synchronisation Firestore Temps Réel Active
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                ● Direct Cloud
              </span>
            </div>
            <p className="text-xs text-[#5A2D3A] leading-relaxed">
              Toutes les boutiques et produits sont connectés à Firebase Firestore en direct. Dès qu'une vendeuse (ou votre sœur) crée sa boutique depuis son smartphone, elle s'affiche <strong>instantanément ici sans recharger la page</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={() => syncLocalDataToFirestore()}
          disabled={isCloudSyncing}
          className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
          <span>{isCloudSyncing ? 'Synchronisation...' : 'Forcer la sync Cloud'}</span>
        </button>
      </div>

      {/* BOUTIQUES EN ATTENTE DE VALIDATION INITIATEUR ("je doit avoir des notif en direct d une nouvelle boutique crée je doit le validé ou non") */}
      {pendingVendors.length > 0 && (
        <div className="bg-amber-50 rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-black text-amber-950">
                  Nouvelles Boutiques en Attente d'Approbation ({pendingVendors.length})
                </h2>
                <p className="text-xs text-amber-800">
                  Validez les demandes d'ouverture de boutique pour les mettre en ligne sur la marketplace.
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
              Action Requise
            </span>
          </div>

          <div className="space-y-4">
            {pendingVendors.map((vendor) => {
              const vendorPendingProducts = products.filter((p) => p.vendorId === vendor.id);

              return (
                <div
                  key={vendor.id}
                  className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={vendor.avatar}
                      alt={vendor.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{vendor.name}</h3>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          {vendor.creatorTag || 'Nouveau Vendeur'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Inscrit le {vendor.joinedDate}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700">
                        Gérant(e) : <strong>{vendor.ownerName}</strong> · WhatsApp :{' '}
                        <strong className="text-emerald-700">{vendor.phone}</strong> · Quartier :{' '}
                        <strong>{vendor.neighborhood}</strong>
                      </p>

                      <p className="text-xs text-slate-500 line-clamp-1 italic">
                        "{vendor.bio}"
                      </p>

                      {/* Initial products preview with photo and price ("il faut avoir la photo du produit du vendeur et son prix") */}
                      {vendorPendingProducts.length > 0 && (
                        <div className="pt-2.5 space-y-2">
                          <span className="text-xs font-bold text-[#8B2D4A] flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-[#D46A8A]" />
                            <span>{vendorPendingProducts.length} article(s) soumis avec photos et prix :</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {vendorPendingProducts.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs"
                              >
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-[#F8D7E3] shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                                  <p className="text-xs font-extrabold text-[#8B2D4A] tabular-nums">
                                    {(p.promoPrice || p.price).toLocaleString('fr-FR')} FCFA
                                  </p>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{p.category}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for this pending vendor */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 shrink-0 self-end md:self-center">
                    {whatsappSentMap[vendor.id]?.sent ? (
                      <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp envoyé ✅ ({whatsappSentMap[vendor.id]?.sentAt})</span>
                      </span>
                    ) : (
                      <a
                        href={`https://wa.me/${vendor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${vendor.name}, je suis l'administrateur de TERANGA BEAUTY concernant votre demande d'ouverture de boutique.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => rejectVendor(vendor.id)}
                      className="px-3.5 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      ❌ Refuser
                    </button>

                    <button
                      onClick={() => handleApproveShopWithWhatsApp(vendor)}
                      title="Va ouvrir WhatsApp automatiquement"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38A1D] hover:from-[#C49B28] hover:to-[#9E7714] text-stone-950 text-xs sm:text-sm font-extrabold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 border border-[#F2DA85]"
                    >
                      <MessageCircle className="w-4 h-4 fill-stone-950/20 stroke-[2.5]" />
                      <span>✅ Valider & Prévenir sur WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Bar: 2 Grands boutons faciles d'accès */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setIsAddVendorOpen(true)}
          className="p-5 rounded-2xl bg-white border-2 border-[#F8D7E3] hover:border-[#D46A8A] text-left shadow-xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE8EF] text-[#D46A8A] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#F8D7E3]">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#8B2D4A] flex items-center gap-1.5">
                <span>+ Ajouter une Vendeuse / Vendeur</span>
                <span className="text-[10px] bg-[#D46A8A] text-white px-2 py-0.5 rounded-full font-bold">Direct</span>
              </h3>
              <p className="text-xs text-[#5A2D3A] mt-0.5">
                Boutique validée directement par l'initiateur
              </p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-[#D46A8A]" />
        </button>

        <button
          onClick={() => {
            if (approvedVendors.length === 0) {
              showToast({
                title: 'Créez d’abord une boutique',
                message: 'Veuillez ajouter ou valider une boutique avant d\'y ajouter un article.',
                type: 'info'
              });
              setIsAddVendorOpen(true);
            } else {
              setIsAddProductOpen(true);
            }
          }}
          className="p-5 rounded-2xl bg-white border-2 border-[#F8D7E3] hover:border-[#D46A8A] text-left shadow-xs hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FCE8EF] text-[#8B2D4A] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#F8D7E3]">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#8B2D4A] flex items-center gap-1.5">
                <span>+ Ajouter un Produit au Catalogue</span>
                <span className="text-[10px] bg-[#8B2D4A] text-white px-2 py-0.5 rounded-full font-bold">Produit</span>
              </h3>
              <p className="text-xs text-[#5A2D3A] mt-0.5">
                Prix en FCFA, photo réelle et boutique associée
              </p>
            </div>
          </div>
          <Plus className="w-5 h-5 text-[#8B2D4A]" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#5A2D3A] mb-1">
            <span className="font-semibold">Boutiques Validées</span>
            <Store className="w-4 h-4 text-[#D46A8A]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#8B2D4A] tabular-nums">
            {approvedVendors.length}
          </div>
          <p className="text-[10px] text-[#5A2D3A]/70 mt-1">
            {pendingVendors.length > 0 ? `+ ${pendingVendors.length} en attente` : 'Toutes à jour'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#5A2D3A] mb-1">
            <span className="font-semibold">Articles en Ligne</span>
            <Package className="w-4 h-4 text-[#D46A8A]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#8B2D4A] tabular-nums">
            {products.filter((p) => p.status === 'approved' || !p.status).length}
          </div>
          <p className="text-[10px] text-[#5A2D3A]/70 mt-1">Disponibles à Dakar</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#5A2D3A] mb-1">
            <span className="font-semibold">Volume des Ventes (GMV)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#8B2D4A] tabular-nums">
            {totalGMV.toLocaleString('fr-FR')} <span className="text-xs font-normal text-[#5A2D3A]">FCFA</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Paiements Wave & OM</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#5A2D3A] mb-1">
            <span className="font-semibold">Commissions Réseau</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#8B2D4A] tabular-nums">
            {totalCommissions.toLocaleString('fr-FR')} <span className="text-xs font-normal text-[#5A2D3A]">FCFA</span>
          </div>
          <p className="text-[10px] text-[#5A2D3A]/70 mt-1">{orders.length} commandes traitées</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F8D7E3] pb-2 flex-wrap">
        {pendingVendors.length > 0 && (
          <button
            onClick={() => setActiveAdminTab('pending')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>À Valider ({pendingVendors.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveAdminTab('vendors')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeAdminTab === 'vendors'
              ? 'bg-[#8B2D4A] text-white shadow-xs'
              : 'bg-white text-[#5A2D3A] border border-[#F8D7E3] hover:bg-[#FCE8EF]'
          }`}
        >
          🏪 Boutiques Validées ({approvedVendors.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('products')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeAdminTab === 'products'
              ? 'bg-[#8B2D4A] text-white shadow-xs'
              : 'bg-white text-[#5A2D3A] border border-[#F8D7E3] hover:bg-[#FCE8EF]'
          }`}
        >
          📦 Articles ({products.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('overview')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeAdminTab === 'overview'
              ? 'bg-[#8B2D4A] text-white shadow-xs'
              : 'bg-white text-[#5A2D3A] border border-[#F8D7E3] hover:bg-[#FCE8EF]'
          }`}
        >
          📊 Commandes & Historique
        </button>
      </div>

      {/* Boutiques Validées Tab - Style LUXE DIOR / SEPHORA LUXE */}
      {activeAdminTab === 'vendors' && (
        <div className="space-y-6">
          {/* Header Luxe avec Section Title et Décoration Dorée */}
          <div className="bg-[#FFF8F0] p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-[#D4AF37]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                  Haute Sélection Dakar ({approvedVendors.length} Maisons)
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-[#7B1D2A] uppercase tracking-widest">
                Maisons de Beauté Sélectionnées
              </h3>
              <p className="text-xs text-stone-600">
                Gérez vos ateliers partenaires, ajoutez de nouvelles confections ou retirez des maisons en cascade complète.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddVendorOpen(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B38A1D] hover:from-[#C49B28] hover:to-[#9E7714] text-stone-950 text-xs font-extrabold uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer border border-[#F2DA85] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Nouvelle Maison</span>
              </button>
            </div>
          </div>

          {approvedVendors.length === 0 ? (
            <div className="p-12 text-center bg-[#FFF8F0] rounded-3xl border border-dashed border-[#D4AF37]/50 space-y-4">
              <Store className="w-14 h-14 text-[#D4AF37]/60 mx-auto" />
              <p className="text-base font-serif font-bold text-[#7B1D2A]">0 Maison de Beauté validée</p>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Toutes les maisons ont été nettoyées ou sont en cours d'approbation. Vous pouvez en ajouter une nouvelle ou charger des modèles de démonstration.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setIsAddVendorOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#7B1D2A] text-amber-100 text-xs font-bold hover:bg-[#601520] cursor-pointer shadow-sm"
                >
                  + Ajouter une Maison
                </button>
                <button
                  onClick={loadSampleData}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#7B1D2A] text-xs font-bold border border-[#D4AF37] hover:bg-[#FFF8F0] cursor-pointer"
                >
                  Charger modèles prestige
                </button>
              </div>
            </div>
          ) : (
            /* Layout Grid: 3 columns desktop, 1 mobile, gap-8, plenty white space */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {approvedVendors.map((vendor) => (
                <LuxuryShopCard
                  key={vendor.id}
                  vendor={vendor}
                  products={products}
                  isAdmin={true}
                  showLuxeScore={true}
                  onOpenCatalogue={openShopCatalogue}
                  onAddProduct={(vId) => handleOpenAddProductForVendor(vId)}
                  onDeleteShop={(v) => {
                    setVendorToDelete(v);
                    setIsConfirmDeleteOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeAdminTab === 'products' && (
        <div className="bg-white rounded-3xl border border-[#F8D7E3] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#F8D7E3] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#8B2D4A]">
                Articles au Catalogue ({products.length})
              </h3>
              <p className="text-xs text-[#5A2D3A]/70">Photo, prix en FCFA et mise en vedette</p>
            </div>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#D46A8A] text-white text-xs font-bold hover:bg-[#C0587A] cursor-pointer"
            >
              + Nouvel Article
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Package className="w-12 h-12 text-[#D46A8A]/40 mx-auto" />
              <p className="text-sm font-bold text-[#8B2D4A]">0 article au catalogue</p>
              <p className="text-xs text-[#5A2D3A]">
                Tous les articles non confirmés ont été effacés. Ajoutez vos premiers articles pour vos boutiques.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#D46A8A] text-white text-xs font-bold hover:bg-[#C0587A] cursor-pointer"
                >
                  + Ajouter un produit
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#F8D7E3]/60">
              {products.map((prod) => (
                <div key={prod.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#FFF9FB]">
                  <div className="flex items-center gap-3">
                    <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-[#F8D7E3]" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{prod.name}</h4>
                      <p className="text-xs text-[#5A2D3A]">
                        {prod.vendorName} · <strong className="text-[#8B2D4A]">{prod.price.toLocaleString('fr-FR')} FCFA</strong> · Stock: {prod.stock}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleProductBoost(prod.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        prod.isBoosted
                          ? 'bg-[#8B2D4A] text-white'
                          : 'border border-[#F8D7E3] text-[#8B2D4A] hover:bg-[#FCE8EF]'
                      }`}
                    >
                      {prod.isBoosted ? 'En vedette ★' : 'Mettre en vedette'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Supprimer l'article "${prod.name}" ?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700 rounded-lg cursor-pointer"
                      title="Supprimer cet article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {activeAdminTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-[#F8D7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-[#8B2D4A]">
            Commandes & Commissions (10% réseau)
          </h3>
          {orders.length > 0 ? (
            <div className="divide-y divide-[#F8D7E3]">
              {orders.map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">Commande #{o.id} · {o.customerName}</h4>
                    <p className="text-slate-500">Boutique : {o.vendorName} · {o.paymentMethod.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#8B2D4A]">{o.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                    <span className="text-[10px] text-emerald-600 font-bold">Commission : {(o.commissionAmount || 0).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              Aucune commande enregistrée pour le moment.
            </p>
          )}
        </div>
      )}

      {/* Modal Add Vendor */}
      {isAddVendorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsAddVendorOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#F8D7E3] space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F8D7E3] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#8B2D4A]">Ajouter une Boutique / Vendeur</h3>
                <p className="text-xs text-[#5A2D3A]">Créez et activez directement une boutique</p>
              </div>
              <button onClick={() => setIsAddVendorOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom de la boutique *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Awa Fashion, Moussa & Co, Dakar Soins..."
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom du gérant(e)</label>
                  <input
                    type="text"
                    placeholder="Ex: Awa Fall / Moussa Diop..."
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numéro WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="77 123 45 67"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quartier Dakar (Sans exception)</label>
                  <select
                    value={vendorNeighborhood}
                    onChange={(e) => setVendorNeighborhood(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] bg-[#FFF9FB] focus:outline-none"
                  >
                    {DAKAR_ZONES.map((zone) => (
                      <optgroup key={zone.commune} label={`📍 ${zone.commune} (${zone.department})`}>
                        <option value={zone.commune}>{zone.commune} (Général)</option>
                        {zone.neighborhoods.map((nh) => (
                          <option key={nh} value={nh}>
                            {nh}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge Vendeur</label>
                  <select
                    value={creatorTag}
                    onChange={(e) => setCreatorTag(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] bg-[#FFF9FB] focus:outline-none"
                  >
                    <option value="Vendeuse • Artisan">Vendeuse • Artisan</option>
                    <option value="Vendeur • Soins Naturels">Vendeur • Soins Naturels</option>
                    <option value="Duo • Mode & Beauté">Duo • Mode & Beauté</option>
                    <option value="Commerçant Vérifié">Commerçant Vérifié</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courte description / Bio</label>
                <textarea
                  rows={2}
                  placeholder="Spécialité, matières premières, atelier..."
                  value={vendorBio}
                  onChange={(e) => setVendorBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#F8D7E3]">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirmer et créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Product */}
      {isAddProductOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsAddProductOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#F8D7E3] space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F8D7E3] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#8B2D4A]">Ajouter un Article au Catalogue</h3>
                <p className="text-xs text-[#5A2D3A]">Photo du produit et son prix en FCFA</p>
              </div>
              <button onClick={() => setIsAddProductOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Boutique associée *</label>
                <select
                  value={targetVendorId || presetVendorIdForProduct || approvedVendors[0]?.id || ''}
                  onChange={(e) => setTargetVendorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] bg-[#FFF9FB] font-bold text-[#8B2D4A] focus:outline-none"
                  required
                >
                  {approvedVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.neighborhood}) - {v.ownerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du produit *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boubou Wax Homme/Femme, Coffret Soin Karité, Chaussures cuir..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prix (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    step={500}
                    value={productPrice}
                    onChange={(e) => setProductPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] font-bold text-[#8B2D4A] focus:outline-none focus:border-[#D46A8A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prix promo (optionnel)</label>
                  <input
                    type="number"
                    min={500}
                    step={500}
                    placeholder="Ex: 22000"
                    value={productPromoPrice}
                    onChange={(e) => setProductPromoPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value as ProductCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] bg-[#FFF9FB] focus:outline-none"
                  >
                    <option value="boubous">Boubous & Bazin</option>
                    <option value="cosmetiques">Cosmétiques & Soins Karité</option>
                    <option value="mode">Mode & Prêt-à-porter</option>
                    <option value="chaussures">Chaussures & Babouches</option>
                    <option value="sacs">Sacs & Maroquinerie</option>
                    <option value="bijoux">Bijoux & Accessoires</option>
                    <option value="electronique">Électronique</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantité en stock</label>
                  <input
                    type="number"
                    min={1}
                    value={productStock}
                    onChange={(e) => setProductStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none"
                  />
                </div>
              </div>

              {/* Photo Réelle de l'Article (Fin définitive des 4 échantillons) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800 text-xs">
                    Photo réelle de l'article * <span className="font-normal text-slate-500">(Vos propres créations)</span>
                  </label>
                  {productCustomImage && (
                    <button
                      type="button"
                      onClick={() => setProductCustomImage('')}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Supprimer la photo
                    </button>
                  )}
                </div>

                {productCustomImage ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-stone-900 group h-44 flex items-center justify-center">
                    <img
                      src={productCustomImage}
                      alt="Prévisualisation article"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold cursor-pointer hover:bg-stone-100 flex items-center gap-1.5 shadow-md">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Changer la photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleProductImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#F8D7E3] hover:border-[#D4AF37] rounded-2xl p-4 sm:p-5 text-center bg-[#FFF9FB] transition-colors space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FCE8EF] text-[#8B2D4A] flex items-center justify-center mx-auto shadow-2xs">
                      {isUploadingProdImage ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
                      ) : (
                        <Camera className="w-6 h-6 text-[#D4AF37]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">
                        {isUploadingProdImage ? 'Traitement de la photo...' : 'Prenez en photo votre article ou choisissez depuis vos fichiers'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Chaque vendeuse insère ses propres confections. Format JPG/PNG optimisé en direct.
                      </p>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                      <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38A1D] hover:from-[#C49B28] hover:to-[#9E7714] text-stone-950 font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                        <Camera className="w-3.5 h-3.5" />
                        <span>📸 Prendre photo / Galerie</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleProductImageFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 shrink-0">Ou URL image :</span>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={productCustomImage}
                        onChange={(e) => setProductCustomImage(e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-[#F8D7E3] bg-white focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Détails du produit, coupe, matières, conseils d'utilisation..."
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#F8D7E3]">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold cursor-pointer shadow-xs"
                >
                  Publier au catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Cascade Delete Shop Modal */}
      <ConfirmDeleteShopModal
        isOpen={isConfirmDeleteOpen}
        vendor={vendorToDelete}
        productCount={
          vendorToDelete
            ? products.filter(
                (p) =>
                  p.vendorId === vendorToDelete.id ||
                  p.vendeuseId === vendorToDelete.id ||
                  (p as any).shopId === vendorToDelete.id ||
                  (p as any).sellerId === vendorToDelete.id
              ).length
            : 0
        }
        isDeleting={isDeletingShop}
        onConfirm={handleConfirmDeleteShop}
        onCancel={() => {
          if (!isDeletingShop) {
            setIsConfirmDeleteOpen(false);
            setVendorToDelete(null);
          }
        }}
      />
    </div>
  );
};
