import React from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';
import { Vendor } from '../types';

interface ConfirmDeleteShopModalProps {
  isOpen: boolean;
  vendor: Vendor | null;
  productCount: number;
  isDeleting: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export const ConfirmDeleteShopModal: React.FC<ConfirmDeleteShopModalProps> = ({
  isOpen,
  vendor,
  productCount,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !vendor) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-red-200 text-center space-y-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border-4 border-red-50">
          <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-serif font-black text-[#7B1D2A]">
            Confirmation de Suppression
          </h3>

          {/* Exact required warning text */}
          <p className="text-sm sm:text-base font-semibold text-stone-900 leading-relaxed px-2">
            Supprimer définitivement <span className="text-red-700 font-extrabold">{vendor.name}</span> et tous ses <span className="text-red-700 font-extrabold">{productCount}</span> produits ? Cette action est irréversible.
          </p>

          <p className="text-xs text-stone-500 pt-1">
            La boutique sera effacée de la base Firestore ainsi que l'ensemble de ses articles et vitrines associées.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Supprimer définitivement</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
