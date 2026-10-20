import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Star, Heart, ShoppingBag, MessageCircle, Truck, ShieldCheck, MapPin, Store, Check, Share2 } from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    toggleFavorite,
    isFavorite,
    openWhatsAppChat,
    addReview,
    setSelectedVendorFilter,
    vendors,
    openShopCatalogue,
    logProductTouch,
    showToast
  } = useApp();

  const [quantity, setQuantity] = useState<number>(1);
  const [activePhoto, setActivePhoto] = useState<string>(selectedProduct?.image || '');
  const [newReviewAuthor, setNewReviewAuthor] = useState<string>('');
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [isAddingReview, setIsAddingReview] = useState<boolean>(false);

  const handleShareProduct = async () => {
    if (!selectedProduct) return;
    const shareUrl = `https://teranga-beauty-luxe.web.app?product=${selectedProduct.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedProduct.name} - TERANGA BEAUTY`,
          text: `Découvrez "${selectedProduct.name}" chez ${selectedProduct.vendorName} sur TERANGA BEAUTY :`,
          url: shareUrl,
        });
      } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast({
        title: 'Article partagé',
        message: `Lien copié : ${shareUrl}`,
        type: 'success'
      });
    }
  };

  if (!selectedProduct) return null;

  const currentDisplayPhoto = activePhoto || selectedProduct.image;
  const productPhotos = selectedProduct.photos && selectedProduct.photos.length > 0
    ? selectedProduct.photos
    : [selectedProduct.image];

  const favorited = isFavorite(selectedProduct.id);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    addReview(selectedProduct.id, {
      userName: newReviewAuthor.trim() || 'Client Dakar',
      rating: newReviewRating,
      comment: newReviewComment.trim()
    });

    setNewReviewAuthor('');
    setNewReviewComment('');
    setIsAddingReview(false);
  };

  const handleGoToShop = () => {
    const parentVendor = vendors.find((v) => v.id === selectedProduct.vendorId);
    setSelectedProduct(null);
    if (parentVendor) {
      openShopCatalogue(parentVendor);
    } else {
      setSelectedVendorFilter(selectedProduct.vendorId);
      const el = document.getElementById('boutiques-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setSelectedProduct(null)}
    >
      <div
        className="relative bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-[#F8D7E3] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute top-3 right-3 z-10 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-full bg-white/95 text-[#8B2D4A] hover:bg-[#FCE8EF] shadow-xs transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image */}
        <div className="md:w-1/2 bg-[#FFF9FB] relative flex flex-col justify-between overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-[#F8D7E3]">
          <div className="relative aspect-4/3 md:aspect-auto md:flex-1 overflow-hidden flex items-center justify-center">
            <img
              src={currentDisplayPhoto}
              alt={selectedProduct.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {selectedProduct.isBoosted && (
              <div className="absolute top-4 left-4 bg-[#8B2D4A] text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                ★ En Vedette
              </div>
            )}
            {selectedProduct.promoPrice && (
              <div className="absolute top-4 right-14 bg-[#D46A8A] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                PROMO
              </div>
            )}
          </div>

          {/* Photo Thumbnails */}
          {productPhotos.length > 1 && (
            <div className="p-3 bg-white/90 border-t border-[#F8D7E3] flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-semibold text-[#8B2D4A]/70 uppercase tracking-wider mr-1">
                Photos ({productPhotos.length}) :
              </span>
              {productPhotos.map((photo, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setActivePhoto(photo)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    currentDisplayPhoto === photo
                      ? 'border-[#D46A8A] ring-2 ring-[#F8D7E3] scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Vue ${pIdx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Direct Actions */}
        <div className="md:w-1/2 flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Vendor Bar avec lien "Voir la boutique" */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F8D7E3] gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedProduct.vendorAvatar}
                  alt={selectedProduct.vendorName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-[#F8D7E3]"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {selectedProduct.vendorName}
                  </h4>
                  <p className="text-[11px] text-[#5A2D3A]/70 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#D46A8A]" />
                    <span>Dakar · {selectedProduct.neighborhood || 'Centre'}</span>
                  </p>
                </div>
              </div>

              {/* Bouton rose "Voir la boutique" */}
              <button
                onClick={handleGoToShop}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] text-xs font-bold transition-colors cursor-pointer shrink-0 border border-[#F8D7E3]"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Voir la boutique</span>
              </button>
            </div>

            {/* Title & Price in bordeaux */}
            <div className="mt-4">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {selectedProduct.name}
              </h1>

              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-[#8B2D4A] tabular-nums">
                  {(selectedProduct.promoPrice || selectedProduct.price).toLocaleString('fr-FR')} FCFA
                </span>
                {selectedProduct.promoPrice && selectedProduct.originalPrice && (
                  <span className="text-sm text-[#8B2D4A]/50 line-through tabular-nums">
                    {selectedProduct.originalPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  En stock ({selectedProduct.stock})
                </span>
              </div>
            </div>

            {/* DIRECT CONTACT ACTION BUTTONS (WhatsApp + Appel direct) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  logProductTouch(selectedProduct.id, 'whatsapp_click');
                  openWhatsAppChat(
                    selectedProduct.whatsappVendeuse || selectedProduct.vendorWhatsApp,
                    selectedProduct.vendorName,
                    selectedProduct.name,
                    selectedProduct.promoPrice || selectedProduct.price
                  );
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-4.5 h-4.5 fill-white" />
                <span>WhatsApp Vendeuse</span>
              </button>

              <a
                href={`tel:${(selectedProduct.whatsappVendeuse || selectedProduct.vendorWhatsApp).replace(/\s/g, '')}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] border border-[#F8D7E3] text-xs sm:text-sm font-bold transition-all active:scale-98"
              >
                <span>📞 Appeler la vendeuse</span>
              </a>
            </div>

            {/* Description */}
            <p className="mt-3.5 text-xs sm:text-sm text-[#5A2D3A] leading-relaxed">
              {selectedProduct.description}
            </p>

            {/* Trust highlights */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-[#3D232A]">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FFF9FB] border border-[#F8D7E3]">
                <Truck className="w-4 h-4 text-[#D46A8A] shrink-0" />
                <span>Livraison 24h à Dakar</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FFF9FB] border border-[#F8D7E3]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paiement Wave & OM direct</span>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-5 pt-4 border-t border-[#F8D7E3]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B2D4A]">
                  Avis Clients ({selectedProduct.reviews?.length || 0})
                </h4>
                <button
                  onClick={() => setIsAddingReview(!isAddingReview)}
                  className="text-xs text-[#D46A8A] font-bold hover:underline cursor-pointer"
                >
                  {isAddingReview ? 'Annuler' : '+ Laisser un avis'}
                </button>
              </div>

              {/* Add review form */}
              {isAddingReview && (
                <form onSubmit={handleReviewSubmit} className="mb-4 p-3.5 bg-[#FFF9FB] rounded-xl border border-[#F8D7E3] text-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Votre nom"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-[#F8D7E3] rounded-lg text-xs"
                      required
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewReviewRating(s)}
                          className="text-amber-400 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${s <= newReviewRating ? 'fill-current' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Votre avis sur l'article..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#F8D7E3] rounded-lg text-xs mb-2"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#D46A8A] hover:bg-[#C0587A] text-white font-semibold text-xs cursor-pointer"
                  >
                    Publier l'avis
                  </button>
                </form>
              )}

              {/* Reviews list */}
              <div className="space-y-2">
                {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                  selectedProduct.reviews.map((rev) => (
                    <div key={rev.id} className="p-2.5 bg-[#FFF9FB] rounded-xl text-xs border border-[#F8D7E3]/60">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rev.userName}</span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="font-semibold tabular-nums">{rev.rating}</span>
                        </div>
                      </div>
                      <p className="text-[#5A2D3A] mt-1 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8B2D4A]/50 italic">Aucun avis pour l'instant. Soyez le premier à commander et témoigner !</p>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="mt-5 pt-3.5 border-t border-[#F8D7E3] flex items-center gap-2.5">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-[#F8D7E3] rounded-xl bg-[#FFF9FB] p-0.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center text-[#8B2D4A] hover:bg-white rounded-lg font-bold text-sm cursor-pointer"
                aria-label="Diminuer"
              >
                -
              </button>
              <span className="px-2.5 text-xs font-bold text-slate-900 tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center text-[#8B2D4A] hover:bg-white rounded-lg font-bold text-sm cursor-pointer"
                aria-label="Augmenter"
              >
                +
              </button>
            </div>

            {/* Favorite toggle */}
            <button
              onClick={() => toggleFavorite(selectedProduct.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#F8D7E3] text-[#D46A8A] hover:bg-[#FCE8EF] transition-colors cursor-pointer"
              aria-label="Favoris"
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-[#D46A8A] text-[#D46A8A]' : ''}`} />
            </button>

            {/* Share product */}
            <button
              onClick={handleShareProduct}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#DEA83A]/60 bg-[#FFF9EB] text-[#B88029] hover:bg-[#FDF0D5] transition-colors cursor-pointer"
              title="Partager cet article"
              aria-label="Partager cet article"
            >
              <Share2 className="w-4.5 h-4.5 stroke-[2]" />
            </button>

            {/* Add to Cart CTA in #D46A8A */}
            <button
              onClick={() => {
                addToCart(selectedProduct, quantity);
                setSelectedProduct(null);
              }}
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#D46A8A] hover:bg-[#C0587A] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ajouter au panier · {((selectedProduct.promoPrice || selectedProduct.price) * quantity).toLocaleString('fr-FR')} FCFA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
