import React from 'react';
import { useApp } from '../context/AppContext';
import { X, MapPin, MessageCircle, Star, CheckCircle2, ShoppingBag, ArrowLeft, Store, Heart, Share2 } from 'lucide-react';
import { ProductCard } from './ProductCard';

export const ShopCatalogueModal: React.FC = () => {
  const {
    catalogueVendor,
    setCatalogueVendor,
    products,
    openWhatsAppChat,
    logProductTouch,
    showToast
  } = useApp();

  if (!catalogueVendor) return null;

  // Products belonging to this shop
  const vendorProducts = products.filter(
    (p) => p.vendorId === catalogueVendor.id && (p.status === 'approved' || !p.status)
  );

  const handleWhatsAppContact = () => {
    openWhatsAppChat(catalogueVendor.phone, catalogueVendor.name);
  };

  const handleShareBoutique = async () => {
    const shopUrl = `https://teranga-beauty-luxe.web.app?boutique=${catalogueVendor.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${catalogueVendor.name} - TERANGA BEAUTY`,
          text: `Découvrez la boutique "${catalogueVendor.name}" sur TERANGA BEAUTY Dakar :`,
          url: shopUrl,
        });
      } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shopUrl);
      showToast({
        title: 'Boutique partagée',
        message: `Lien copié : ${shopUrl}`,
        type: 'success'
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setCatalogueVendor(null)}
    >
      <div
        className="relative bg-[#FFF9FB] w-full max-w-4xl max-h-[94vh] rounded-3xl shadow-2xl border border-[#F8D7E3] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-[#F8D7E3] flex items-center justify-between">
          <button
            onClick={() => setCatalogueVendor(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#FCE8EF] text-[#8B2D4A] text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Toutes les boutiques</span>
          </button>

          <span className="text-xs font-bold text-[#8B2D4A] uppercase tracking-wider">
            Catalogue Boutique
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareBoutique}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF9EB] hover:bg-[#FDF0D5] text-[#B88029] border border-[#DEA83A]/40 text-xs font-bold transition-colors cursor-pointer"
              title="Partager cette boutique (https://teranga-beauty-luxe.web.app)"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Partager</span>
            </button>

            <button
              onClick={() => setCatalogueVendor(null)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Boutique Hero Header Card */}
          <div className="bg-white rounded-3xl border border-[#F8D7E3] p-5 sm:p-7 shadow-xs relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#FCE8EF] to-transparent rounded-full pointer-events-none -mr-16 -mt-16" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                {/* Large Boutique Avatar */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#D46A8A] bg-[#FCE8EF] shrink-0 shadow-xs">
                  <img
                    src={catalogueVendor.avatar}
                    alt={catalogueVendor.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#D46A8A] fill-[#D46A8A]/10" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-[10px] font-bold uppercase tracking-wider border border-[#F8D7E3]">
                    <span>{catalogueVendor.creatorTag || 'Boutique Partenaire'}</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-serif font-black text-[#8B2D4A] leading-tight">
                    {catalogueVendor.name}
                  </h1>

                  <p className="text-xs text-[#5A2D3A] font-medium">
                    Gérant(e) : <strong>{catalogueVendor.ownerName || catalogueVendor.name}</strong>
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[#5A2D3A]/70 pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D46A8A]" />
                      <span>Dakar · {catalogueVendor.neighborhood}</span>
                    </span>

                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{catalogueVendor.rating || 4.9} ({catalogueVendor.reviewCount || 24} avis)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Call to Action */}
              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
                <button
                  onClick={handleWhatsAppContact}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4.5 h-4.5 fill-white" />
                  <span>Discuter sur WhatsApp ({catalogueVendor.phone})</span>
                </button>

                <div className="text-center text-[11px] text-[#5A2D3A]/70">
                  <span>Paiements Wave & Orange Money acceptés</span>
                </div>
              </div>
            </div>

            {/* Boutique Bio */}
            {catalogueVendor.bio && (
              <div className="mt-4 pt-4 border-t border-[#F8D7E3]/60 text-xs sm:text-sm text-[#5A2D3A] leading-relaxed">
                <p>{catalogueVendor.bio}</p>
              </div>
            )}
          </div>

          {/* Catalog Section Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-lg font-serif font-black text-[#8B2D4A]">
                Articles de la boutique ({vendorProducts.length})
              </h2>
              <p className="text-xs text-[#5A2D3A]/70">
                Chaque commande est directement transmise à {catalogueVendor.name}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          {vendorProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {vendorProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-white rounded-3xl border border-[#F8D7E3] space-y-2">
              <ShoppingBag className="w-10 h-10 text-[#D46A8A]/40 mx-auto" />
              <h3 className="text-base font-bold text-[#8B2D4A]">
                Catalogue en cours de mise en ligne
              </h3>
              <p className="text-xs text-[#5A2D3A] max-w-md mx-auto">
                {catalogueVendor.name} prépare ses créations. Vous pouvez la contacter directement sur WhatsApp pour toute demande sur-mesure.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleWhatsAppContact}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D46A8A] text-white text-xs font-bold hover:bg-[#C0587A] cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contacter la boutique sur WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
