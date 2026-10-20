import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCategory, Product } from '../types';
import {
  Plus,
  Store,
  DollarSign,
  Package,
  TrendingUp,
  MessageCircle,
  Truck,
  Users,
  Bell,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  Sparkles,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Clock,
  Upload,
  Camera,
  Trash2,
  Loader2
} from 'lucide-react';
import { uploadOrCompressProductImage } from '../services/imageUpload';
import { ConfirmDeleteShopModal } from './ConfirmDeleteShopModal';

export const VendorDashboard: React.FC = () => {
  const {
    vendors,
    activeVendor,
    setActiveVendorId,
    products,
    addProduct,
    deleteShop,
    toggleProductBoost,
    orders,
    setIsCreatorFormOpen,
    getVendorNotifications,
    clearVendorNotifications,
    openShopCatalogue
  } = useApp();

  const currentVendor = activeVendor || vendors[0];
  const vendorProducts = currentVendor ? products.filter((p) => p.vendorId === currentVendor.id) : [];
  const vendorOrders = currentVendor ? orders.filter((o) => o.vendorId === currentVendor.id) : [];

  // Vendor Notifications (Product touches: "chaque produit touché le boutiquier recois la notif")
  const notifications = currentVendor ? getVendorNotifications(currentVendor.id) : [];

  // Guided Tour modal state
  const [showGuidedTour, setShowGuidedTour] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(1);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'activity' | 'orders'>('overview');

  // Add Product Form
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [prodName, setProdName] = useState<string>('');
  const [prodPrice, setProdPrice] = useState<number | string>(25000);
  const [prodPromoPrice, setProdPromoPrice] = useState<string>('');
  const [prodCategory, setProdCategory] = useState<string>('Boubous & Bazin');
  const [prodStock, setProdStock] = useState<number>(10);
  const [prodDesc, setProdDesc] = useState<string>('');
  const [prodImage, setProdImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const [isDeletingShop, setIsDeletingShop] = useState<boolean>(false);

  const handleConfirmDeleteShop = async () => {
    if (!currentVendor) return;
    setIsDeletingShop(true);
    try {
      await deleteShop(currentVendor.id);
      setIsConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Erreur delete shop in VendorDashboard:', err);
    } finally {
      setIsDeletingShop(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview (<5ms) so user immediately sees their photo
    const instantPreview = URL.createObjectURL(file);
    setProdImage(instantPreview);
    setIsUploadingImage(true);
    setFormError('');

    // Spinner auto-dismiss after 600ms max
    const timer = setTimeout(() => {
      setIsUploadingImage(false);
    }, 600);

    try {
      // Compress fast in <150ms client-side to max 800x800 quality 0.60 JPEG
      const base64 = await uploadOrCompressProductImage(file);
      if (base64) {
        setProdImage(base64);
      }
    } catch (err) {
      console.warn('Compression fallback to preview:', err);
    } finally {
      clearTimeout(timer);
      setIsUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!prodName.trim()) {
      setFormError('Le nom du produit est obligatoire.');
      return;
    }

    if (!prodImage || prodImage.trim() === '') {
      setFormError('La photo de l\'article est obligatoire. Cliquez sur "📸 Prendre photo / Choisir depuis galerie".');
      return;
    }

    const priceNum = Number(prodPrice);
    if (!priceNum || priceNum < 100) {
      setFormError('Veuillez renseigner un prix en FCFA valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryValue = (prodCategory.trim().toLowerCase() as ProductCategory) || 'mode';
      const result = await addProduct({
        name: prodName.trim(),
        price: priceNum,
        promoPrice: prodPromoPrice ? Number(prodPromoPrice) : undefined,
        category: categoryValue,
        stock: Number(prodStock) || 10,
        description: prodDesc.trim() || `${prodName.trim()} disponible chez ${currentVendor?.name || 'Ma Boutique'}. Confection dakaroise.`,
        image: prodImage,
        photos: [prodImage],
        vendorId: currentVendor?.id || 'vendor-1',
        vendeuseId: currentVendor?.id || 'vendor-1',
        vendorName: currentVendor?.name || 'Boutique Teranga',
        vendorWhatsApp: currentVendor?.phone || '+221 77 123 45 67',
        whatsappVendeuse: currentVendor?.phone || '+221 77 123 45 67',
        vendorAvatar: currentVendor?.avatar || '',
        neighborhood: currentVendor?.neighborhood || 'Dakar',
        rating: 5.0,
        reviewCount: 0
      });

      if (result && 'success' in result && !result.success) {
        setFormError(result.error || 'Erreur lors de l\'enregistrement sur Firestore.');
        setIsSubmitting(false);
        return;
      }

      setProdName('');
      setProdDesc('');
      setProdPromoPrice('');
      setProdImage('');
      setIsAddProductOpen(false);
    } catch (err) {
      console.error('Erreur soumission produit:', err);
      setFormError('Impossible d\'ajouter le produit sur Firestore. Veuillez vérifier votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const vendorDisplayName = currentVendor?.ownerName || currentVendor?.name || 'Commerçant(e)';
  const vendorInitials = (currentVendor?.name || 'TB').slice(0, 2).toUpperCase();

  // Stats calculation
  const totalSales = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="py-4 space-y-5 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F8D7E3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A] tracking-tight">
              Bonjour {vendorDisplayName}
            </h1>
            {(!currentVendor?.isApproved || currentVendor?.status === 'pending') ? (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300 shadow-2xs flex items-center gap-1.5 animate-pulse">
                <span>En attente de validation par l'Admin Teranga ⏳ - Tu recevras un WhatsApp dès validation</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1">
                <span>⭐ Maison Sélectionnée Validée</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#5A2D3A] font-medium mt-0.5">
            {currentVendor?.name ? `Boutique : ${currentVendor.name}` : 'Espace Marchand TERANGA BEAUTY'} · {currentVendor?.neighborhood || 'Dakar'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct product listing CTA */}
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mettre en vente direct</span>
            <span className="sm:hidden">+ Vendre</span>
          </button>

          {/* Direct shop catalogue view */}
          {currentVendor && (
            <button
              onClick={() => openShopCatalogue(currentVendor)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] text-xs font-bold border border-[#F8D7E3] cursor-pointer"
              title="Aperçu de mon catalogue boutique tel que vu par les acheteurs"
            >
              <Store className="w-3.5 h-3.5 text-[#D46A8A]" />
              <span className="hidden sm:inline">Mon Catalogue Boutique</span>
            </button>
          )}

          {/* Delete boutique button */}
          {currentVendor && (
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 cursor-pointer transition-colors"
              title="Supprimer définitivement ma boutique et tous ses articles"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Supprimer la boutique</span>
            </button>
          )}

          <button
            onClick={() => setShowGuidedTour(true)}
            className="p-2 rounded-full hover:bg-[#FCE8EF] text-[#8B2D4A] relative cursor-pointer"
            title="Visite guidée"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications button with badge */}
          <button
            onClick={() => setActiveTab('activity')}
            className="p-2 rounded-full hover:bg-[#FCE8EF] text-[#8B2D4A] relative cursor-pointer"
            title="Activité en direct sur vos produits"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D46A8A] ring-2 ring-white animate-ping" />
            )}
          </button>

          {/* User Initials Circle */}
          <div className="w-9 h-9 rounded-full bg-[#D46A8A] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white">
            {vendorInitials}
          </div>
        </div>
      </div>

      {/* Boutique Pending Alert Banner */}
      {(!currentVendor?.isApproved || currentVendor?.status === 'pending') && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>En attente de validation par l'Admin Teranga ⏳ - Tu recevras un WhatsApp dès validation</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Votre Maison est transmise en direct à la supervision. Dès validation par l'Admin en tant que <strong>Maison Sélectionnée ⭐</strong>, tu recevras un message WhatsApp de confirmation et ta vitrine apparaîtra sur la page d'accueil luxe !
          </p>
        </div>
      )}

      {/* LIVE ACTIVITY BANNER ("chaque produit touché le boutiquier recois la notif") */}
      {notifications.length > 0 && activeTab !== 'activity' && (
        <div
          onClick={() => setActiveTab('activity')}
          className="p-3.5 rounded-2xl bg-[#FCE8EF] border border-[#F8D7E3] flex items-center justify-between cursor-pointer hover:bg-[#F8D7E3] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D46A8A] animate-ping" />
            <div className="text-xs text-[#8B2D4A]">
              <strong>Activité en direct :</strong> {notifications[0].message}
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#D46A8A] hover:underline whitespace-nowrap ml-2">
            Voir l'historique ({notifications.length}) →
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F8D7E3] pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#8B2D4A] text-white shadow-xs'
              : 'bg-white text-[#5A2D3A] border border-[#F8D7E3] hover:bg-[#FCE8EF]'
          }`}
        >
          📊 Vue d'ensemble
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'bg-[#8B2D4A] text-white shadow-xs'
              : 'bg-white text-[#5A2D3A] border border-[#F8D7E3] hover:bg-[#FCE8EF]'
          }`}
        >
          📦 Mes Articles ({vendorProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer relative ${
            activeTab === 'activity'
              ? 'bg-[#8B2D4A] text-white shadow-xs'
              : 'bg-white text-[#5A2D3A] border border-[#F8D7E3] hover:bg-[#FCE8EF]'
          }`}
        >
          🔔 Visites & Clics Produits ({notifications.length})
          {notifications.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#D46A8A] text-white text-[9px] font-bold">
              Live
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#8B2D4A] text-white shadow-xs'
              : 'bg-white text-[#5A2D3A] border border-[#F8D7E3] hover:bg-[#FCE8EF]'
          }`}
        >
          🛍️ Commandes ({vendorOrders.length})
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-2xs">
              <span className="text-xs text-[#5A2D3A] font-semibold">Chiffre d'Affaires</span>
              <div className="text-xl sm:text-2xl font-black text-[#8B2D4A] tabular-nums mt-1">
                {totalSales.toLocaleString('fr-FR')} <span className="text-xs font-normal">FCFA</span>
              </div>
              <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>Paiements Wave & OM</span>
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-2xs">
              <span className="text-xs text-[#5A2D3A] font-semibold">Articles en Ligne</span>
              <div className="text-xl sm:text-2xl font-black text-[#8B2D4A] tabular-nums mt-1">
                {vendorProducts.length}
              </div>
              <p className="text-[10px] text-[#5A2D3A]/70 mt-1">Visible sur le catalogue</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#F8D7E3] shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-xs text-[#5A2D3A] font-semibold">Produits Consultés (Live)</span>
              <div className="text-xl sm:text-2xl font-black text-[#D46A8A] tabular-nums mt-1">
                {notifications.length}
              </div>
              <p className="text-[10px] text-[#D46A8A] mt-1 font-semibold">Clients ayant touché vos articles</p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Ajouter un article à ma boutique</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: LIVE ACTIVITY ("chaque produit touché le boutiquier recois la notif") */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl border border-[#F8D7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F8D7E3]">
            <div>
              <h2 className="text-base font-serif font-black text-[#8B2D4A]">
                Activité en Direct sur vos Produits
              </h2>
              <p className="text-xs text-[#5A2D3A]">
                Chaque fois qu'un client consulte, clique WhatsApp ou ajoute l'un de vos articles, vous recevez une alerte ici.
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => clearVendorNotifications(currentVendor?.id)}
                className="text-xs text-[#8B2D4A] hover:underline font-semibold cursor-pointer"
              >
                Effacer l'historique
              </button>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="divide-y divide-[#F8D7E3]/60 space-y-1">
              {notifications.map((notif) => (
                <div key={notif.id} className="py-3 flex items-start gap-3 text-xs">
                  <div className="w-9 h-9 rounded-xl bg-[#FCE8EF] border border-[#F8D7E3] text-[#D46A8A] flex items-center justify-center shrink-0">
                    {notif.type === 'whatsapp_click' ? (
                      <MessageCircle className="w-4.5 h-4.5 fill-[#D46A8A]" />
                    ) : notif.type === 'cart_add' ? (
                      <ShoppingBag className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 leading-snug">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{notif.timestamp}</span>
                      {notif.productPrice && (
                        <span className="font-bold text-[#8B2D4A]">
                          · {notif.productPrice.toLocaleString('fr-FR')} FCFA
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Eye className="w-10 h-10 text-[#D46A8A]/40 mx-auto" />
              <h3 className="text-sm font-bold text-[#8B2D4A]">
                Aucune visite pour le moment
              </h3>
              <p className="text-xs text-[#5A2D3A] max-w-sm mx-auto">
                Partagez le lien de votre boutique TERANGA BEAUTY sur vos statuts WhatsApp pour commencer à recevoir des visites !
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB: MES ARTICLES */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-[#F8D7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F8D7E3]">
            <div>
              <h2 className="text-base font-serif font-black text-[#8B2D4A]">
                Mes Articles ({vendorProducts.length})
              </h2>
              <p className="text-xs text-[#5A2D3A]">
                Chaque article est affiché avec sa photo, son prix en FCFA et sa boutique
              </p>
            </div>

            <button
              onClick={() => setIsAddProductOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D46A8A] text-white text-xs font-bold hover:bg-[#C0587A] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nouvel Article</span>
            </button>
          </div>

          {vendorProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendorProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl border border-[#F8D7E3] bg-[#FFF9FB] flex gap-3 items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[#F8D7E3]"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs font-black text-[#8B2D4A]">
                        {(p.promoPrice || p.price).toLocaleString('fr-FR')} FCFA
                      </p>
                      <span className="text-[10px] text-slate-500">Stock : {p.stock}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleProductBoost(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      p.isBoosted
                        ? 'bg-[#8B2D4A] text-white'
                        : 'border border-[#F8D7E3] text-[#8B2D4A] hover:bg-[#FCE8EF]'
                    }`}
                  >
                    {p.isBoosted ? 'En vedette ★' : 'Booster'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <Package className="w-10 h-10 text-[#D46A8A]/40 mx-auto" />
              <h3 className="text-sm font-bold text-[#8B2D4A]">0 article pour l'instant</h3>
              <p className="text-xs text-[#5A2D3A]">Ajoutez vos photos et fixez vos prix pour commencer à vendre.</p>
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#D46A8A] text-white text-xs font-bold hover:bg-[#C0587A] cursor-pointer"
              >
                + Ajouter mon premier article
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: COMMANDES */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-[#F8D7E3] p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-serif font-black text-[#8B2D4A]">
            Commandes Récentes ({vendorOrders.length})
          </h2>

          {vendorOrders.length > 0 ? (
            <div className="divide-y divide-[#F8D7E3]">
              {vendorOrders.map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      Commande #{o.id} · {o.customerName}
                    </h4>
                    <p className="text-slate-500">{o.customerPhone} · {o.customerAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#8B2D4A]">
                      {o.totalAmount.toLocaleString('fr-FR')} FCFA
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">
                      {o.paymentMethod} · Payé
                    </span>
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

      {/* MODAL AJOUTER UN PRODUIT */}
      {isAddProductOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAddProductOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#F8D7E3] space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F8D7E3] pb-3">
              <h3 className="text-base font-serif font-black text-[#8B2D4A]">
                Ajouter un article à votre boutique
              </h3>
              <button onClick={() => setIsAddProductOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs animate-in fade-in">
                  ⚠️ {formError}
                </div>
              )}

              {/* Photo de l'article (FREE upload) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#8B2D4A]">
                    Photo de l'article * <span className="text-[11px] font-normal text-slate-500">(Obligatoire)</span>
                  </label>
                  {prodImage && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Photo prête
                    </span>
                  )}
                </div>

                {prodImage ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#D46A8A] bg-[#FFF9FB] p-2 space-y-2">
                    <img
                      src={prodImage}
                      alt="Aperçu article"
                      className="w-full h-48 sm:h-56 object-cover rounded-xl shadow-xs"
                    />
                    <div className="flex items-center justify-between px-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] font-bold text-xs cursor-pointer transition-colors border border-[#F8D7E3]">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Changer la photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setProdImage('')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={`w-full flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group ${
                      formError.includes('photo')
                        ? 'border-red-400 bg-red-50/50'
                        : 'border-[#D46A8A] bg-[#FFF9FB] hover:bg-[#FCE8EF]'
                    }`}>
                      <div className="space-y-2 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#FCE8EF] group-hover:scale-105 transition-transform flex items-center justify-center text-[#D46A8A] shadow-xs relative">
                          <Camera className="w-6 h-6" />
                          {isUploadingImage && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#D46A8A] border-2 border-white animate-spin" />
                          )}
                        </div>
                        <span className="inline-block px-4 py-2.5 rounded-xl bg-[#D46A8A] group-hover:bg-[#C0587A] text-white font-bold text-xs shadow-xs transition-colors">
                          📸 Prendre photo / Choisir depuis galerie
                        </span>
                        <p className="text-[11px] text-[#5A2D3A]/80 max-w-xs">
                          {isUploadingImage ? 'Traitement instantané...' : 'Prenez directement la photo de votre création avec votre téléphone ou choisissez dans votre galerie.'}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Nom du produit (Free text) */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Boubou Bazin Riche Brodé Or, Sérum Teint Métisse, Robe Mousseline..."
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                />
              </div>

              {/* Prix FCFA & Prix promo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#8B2D4A] mb-1">
                    Prix en FCFA *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    placeholder="25000"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] font-bold text-[#8B2D4A] focus:outline-none focus:border-[#D46A8A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#8B2D4A] mb-1">
                    Prix Promo (optionnel)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    placeholder="Ex: 22000"
                    value={prodPromoPrice}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                  />
                </div>
              </div>

              {/* Catégorie (free text + dropdown but editable) & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#8B2D4A] mb-1">
                    Catégorie (saisie libre ou suggestion) *
                  </label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Boubous, Soins Cheveux, Bijoux..."
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setProdCategory(e.target.value);
                      }}
                      defaultValue=""
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#F8D7E3] bg-[#FFF9FB] text-[11px] text-[#8B2D4A] font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled>Ou choisissez une catégorie suggérée...</option>
                      <option value="Boubous & Bazin">Boubous & Bazin</option>
                      <option value="Cosmétiques & Soins Karité">Cosmétiques & Soins Karité</option>
                      <option value="Mode & Prêt-à-porter">Mode & Prêt-à-porter</option>
                      <option value="Chaussures & Babouches">Chaussures & Babouches</option>
                      <option value="Sacs & Maroquinerie">Sacs & Maroquinerie</option>
                      <option value="Bijoux & Accessoires">Bijoux & Accessoires</option>
                      <option value="Perruques & Mèches">Perruques & Mèches</option>
                      <option value="Parfums & Thiouraye">Parfums & Thiouraye</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#8B2D4A] mb-1">
                    Stock disponible
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#F8D7E3] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nombre d'exemplaires en stock</p>
                </div>
              </div>

              {/* Description (Free text) */}
              <div>
                <label className="block font-bold text-[#8B2D4A] mb-1">
                  Description de l'article
                </label>
                <textarea
                  rows={3}
                  placeholder="Matière, coupe, tissu, finitions, taille, conseils d'entretien..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F8D7E3] focus:outline-none focus:border-[#D46A8A]"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-[#F8D7E3]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publication en cours...</span>
                    </>
                  ) : (
                    <span>Mettre en vente sur TERANGA BEAUTY</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUIDED TOUR MODAL ("Visite guidée TERANGA BEAUTY") */}
      {showGuidedTour && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowGuidedTour(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#F8D7E3] space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>Visite guidée TERANGA BEAUTY</span>
              <span>{tourStep} sur 3</span>
            </div>

            {tourStep === 1 && (
              <div className="space-y-2 py-2">
                <h3 className="text-lg font-serif font-black text-[#8B2D4A]">
                  Bienvenue sur votre Espace Marchand !
                </h3>
                <p className="text-xs sm:text-sm text-[#5A2D3A] leading-relaxed">
                  Votre vitrine est prête. Vous pouvez publier vos boubous, cosmétiques et accessoires avec leurs photos et prix en FCFA.
                </p>
              </div>
            )}

            {tourStep === 2 && (
              <div className="space-y-2 py-2">
                <h3 className="text-lg font-serif font-black text-[#8B2D4A]">
                  Notifications en direct
                </h3>
                <p className="text-xs sm:text-sm text-[#5A2D3A] leading-relaxed">
                  Chaque fois qu'un client touche l'un de vos articles ou clique pour commander sur WhatsApp, vous êtes alerté(e) en temps réel !
                </p>
              </div>
            )}

            {tourStep === 3 && (
              <div className="space-y-2 py-2">
                <h3 className="text-lg font-serif font-black text-[#8B2D4A]">
                  Paiements Wave & Ventes WhatsApp
                </h3>
                <p className="text-xs sm:text-sm text-[#5A2D3A] leading-relaxed">
                  Recevez directement l'argent sur votre compte Wave ou Orange Money, sans intermédiaire bloquant.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setShowGuidedTour(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  if (tourStep < 3) setTourStep(tourStep + 1);
                  else setShowGuidedTour(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#D46A8A] text-white text-xs font-bold"
              >
                {tourStep === 3 ? 'Terminer' : 'Suivant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Cascade Delete Shop Modal */}
      <ConfirmDeleteShopModal
        isOpen={isConfirmDeleteOpen}
        vendor={currentVendor}
        productCount={vendorProducts.length}
        isDeleting={isDeletingShop}
        onConfirm={handleConfirmDeleteShop}
        onCancel={() => {
          if (!isDeletingShop) {
            setIsConfirmDeleteOpen(false);
          }
        }}
      />
    </div>
  );
};
