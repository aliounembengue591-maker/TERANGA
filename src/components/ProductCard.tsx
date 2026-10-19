import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingBag, Store, MessageCircle } from 'lucide-react';
import { trackProductView } from '../services/analytics';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    setSelectedProduct,
    addToCart,
    toggleFavorite,
    isFavorite,
    openWhatsAppChat,
    logProductTouch
  } = useApp();

  const favorited = isFavorite(product.id);

  const handleCardClick = () => {
    logProductTouch(product.id, 'product_touch');
    trackProductView(product.id, product.name, product.promoPrice || product.price, product.vendorName);
    setSelectedProduct(product);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    logProductTouch(product.id, 'whatsapp_click');
    trackProductView(product.id, product.name, product.promoPrice || product.price, product.vendorName);
    openWhatsAppChat(
      product.whatsappVendeuse || product.vendorWhatsApp,
      product.vendorName,
      product.name,
      product.promoPrice || product.price
    );
  };

  return (
    <article
      onClick={handleCardClick}
      className="group bg-white rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between border border-[#F8D7E3] shadow-2xs hover:shadow-md hover:border-[#D46A8A]"
    >
      {/* Product Image Slot */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FFF9FB] flex items-center justify-center border border-[#F8D7E3]/60">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Favorite Heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center text-[#D46A8A] hover:bg-[#FCE8EF] transition-colors shadow-2xs cursor-pointer"
          aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            className={`w-4 h-4 ${
              favorited ? 'fill-[#D46A8A] text-[#D46A8A]' : 'text-[#D46A8A]/60'
            }`}
          />
        </button>

        {/* Quick Add To Cart Button in #D46A8A */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1);
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#D46A8A] hover:bg-[#C0587A] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xs hover:scale-105 cursor-pointer"
          title="Ajouter au panier"
          aria-label="Ajouter au panier"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
        </button>

        {/* WhatsApp Direct Quick Button */}
        <button
          onClick={handleWhatsAppClick}
          className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xs hover:scale-105 cursor-pointer"
          title="Commander directement sur WhatsApp"
          aria-label="WhatsApp direct"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
        </button>

        {/* Promo tag */}
        {product.promoPrice && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B2D4A] text-white shadow-2xs">
            Promo
          </span>
        )}
      </div>

      {/* Info Slot */}
      <div className="mt-2.5 text-left">
        <div className="flex items-center gap-1 text-[11px] text-[#5A2D3A] font-semibold mb-0.5 truncate">
          <Store className="w-3 h-3 shrink-0 text-[#D46A8A]" />
          <span className="truncate">{product.vendorName}</span>
        </div>

        <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 leading-snug">
          {product.name}
        </h3>

        {/* Price row in bordeaux #8B2D4A */}
        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-extrabold text-[#8B2D4A] tabular-nums">
            {(product.promoPrice || product.price).toLocaleString('fr-FR')} FCFA
          </span>
          {product.promoPrice && product.originalPrice && (
            <span className="text-[10px] text-[#8B2D4A]/50 line-through tabular-nums">
              {product.originalPrice.toLocaleString('fr-FR')} F
            </span>
          )}
        </div>

        {/* Bouton direct: Contacter la vendeuse */}
        <button
          onClick={handleWhatsAppClick}
          className="mt-2 w-full py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-[#25D366] text-emerald-800 hover:text-white border border-emerald-200 text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Contacter directement la vendeuse sur WhatsApp"
        >
          <MessageCircle className="w-3 h-3 fill-current" />
          <span>Contacter la vendeuse</span>
        </button>
      </div>
    </article>
  );
};
