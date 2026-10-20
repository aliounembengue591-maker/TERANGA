import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, MessageCircle, AlertCircle, X, ExternalLink } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-[#1A1A1A] text-white p-4 rounded-xl shadow-xl border border-[#C8A165]/30 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {toast.type === 'whatsapp' ? (
              <div className="w-8 h-8 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
            ) : toast.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#C8A165]/20 text-[#C8A165] flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-white leading-tight">{toast.title}</h4>
              <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={hideToast}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {toast.actionUrl && (
          <div className="mt-1 pt-2 border-t border-white/10 flex justify-end">
            <a
              href={toast.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-medium transition-colors"
            >
              <span>{toast.actionLabel || 'Ouvrir'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
