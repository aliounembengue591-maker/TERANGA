import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    deliveryFee,
    cartTotal,
    setIsCheckoutOpen
  } = useApp();

  if (!isCartOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setIsCartOpen(false)}
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-[#FDF6EC]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C4704A]" />
              <h2 className="text-base font-semibold text-[#1A1A1A]">Votre Panier</h2>
              <span className="text-xs text-stone-500 tabular-nums">
                ({cart.reduce((sum, item) => sum + item.quantity, 0)} articles)
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-500 hover:text-black rounded-lg transition-colors"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery progress bar */}
          <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#C4704A]" />
              <span>
                {cartSubtotal >= 30000
                  ? 'Livraison offerte sur Dakar !'
                  : `Plus que ${(30000 - cartSubtotal).toLocaleString('fr-FR')} FCFA pour la livraison offerte`}
              </span>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3.5 p-3 rounded-xl border border-stone-100 bg-white hover:border-[#C8A165]/30 transition-colors"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-18 h-18 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#1A1A1A] line-clamp-2">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-stone-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Supprimer l'article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Boutique : {item.product.vendorName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-[#1A1A1A] tabular-nums">
                        {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                      </span>

                      {/* Stepper */}
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-stone-600 hover:text-black"
                          aria-label="Moins"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-stone-600 hover:text-black"
                          aria-label="Plus"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <h3 className="text-sm font-semibold text-stone-800">Votre panier est vide</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Découvrez nos créations exclusives de mode et cosmétiques sénégalaises.
                </p>
              </div>
            )}
          </div>

          {/* Drawer Footer & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-[#FDF6EC]/60 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Sous-total articles</span>
                  <span className="tabular-nums font-medium">
                    {cartSubtotal.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Livraison Dakar</span>
                  <span className="tabular-nums font-medium">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-semibold">Gratuit</span>
                    ) : (
                      `${deliveryFee.toLocaleString('fr-FR')} FCFA`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-[#5A2D2A]">
                  <span>Total à payer</span>
                  <span className="tabular-nums text-base text-[#C17A5A]">
                    {cartTotal.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full min-h-[44px] py-3 rounded-xl bg-gradient-to-r from-[#C17A5A] to-[#D46A8A] hover:opacity-95 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <span>Commander maintenant</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C8A165]" />
                <span>Paiements Wave & Orange Money 100% sécurisés</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
