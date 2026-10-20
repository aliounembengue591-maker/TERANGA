import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, X, Send, Sparkles, User, Store, ShieldCheck, MapPin } from 'lucide-react';
import { LiveChatMessage } from '../types';

const PRESET_QUICK_MESSAGES = [
  '👋 Bonjour Dakar ! Quels sont les articles disponibles aujourd\'hui ?',
  '✨ Je cherche une belle perruque à Guédiawaye / Parcelles !',
  '👗 Qui a des boubous Bazin riche brodés or en stock ?',
  '🌿 Des recommandations de savon de karité et thiouraye ?',
  '🚚 La livraison se fait en combien de temps sur Dakar ?'
];

export const LiveCommunityChat: React.FC = () => {
  const {
    liveChatMessages,
    sendLiveChatMessage,
    isLiveChatOpen,
    setIsLiveChatOpen,
    currentRole,
    activeVendor,
    userAccount
  } = useApp();

  const [authorName, setAuthorName] = useState<string>(() => {
    if (activeVendor?.name) return activeVendor.name;
    if (userAccount?.name) return userAccount.name;
    try {
      const saved = localStorage.getItem('tb_live_chat_author');
      if (saved) return saved;
    } catch {
      // Ignored
    }
    return '';
  });

  const [authorQuarter, setAuthorQuarter] = useState<string>(() => {
    if (activeVendor?.neighborhood) return activeVendor.neighborhood;
    return 'Dakar';
  });

  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isLiveChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveChatMessages, isLiveChatOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = messageText.trim();
    if (!cleanText) return;

    const resolvedName = authorName.trim() || (activeVendor?.name || (userAccount?.name || 'Visiteur Dakar'));
    
    // Remember name
    try {
      localStorage.setItem('tb_live_chat_author', resolvedName);
    } catch {
      // Ignored
    }

    setIsSending(true);
    try {
      await sendLiveChatMessage({
        authorName: resolvedName,
        text: cleanText,
        authorRole: currentRole === 'admin' ? 'admin' : activeVendor ? 'vendor' : 'visitor',
        authorQuarter: authorQuarter.trim() || 'Dakar'
      });
      setMessageText('');
    } catch (err) {
      console.warn('Live chat send error', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickSend = (text: string) => {
    setMessageText(text);
  };

  return (
    <>
      {/* Floating CTA Button on Desktop & Mobile */}
      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40">
        <button
          onClick={() => setIsLiveChatOpen(!isLiveChatOpen)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-linear-to-r from-[#D46A8A] to-[#8B2D4A] hover:from-[#C0587A] hover:to-[#641E34] text-white shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer border-2 border-white/40"
          aria-label="Ouvrir le Salon Live Dakar"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 fill-white/20" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#8B2D4A] animate-pulse" />
          </div>
          <div className="text-left hidden xs:block">
            <span className="text-xs font-bold block leading-tight">Salon Live Dakar</span>
            <span className="text-[10px] text-white/80 block leading-none">Échanges en direct ({liveChatMessages.length})</span>
          </div>
        </button>
      </div>

      {/* Live Chat Panel Modal / Drawer */}
      {isLiveChatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsLiveChatOpen(false)}
        >
          <div
            className="relative bg-white w-full sm:max-w-md h-[88vh] sm:h-[640px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#F8D7E3] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 bg-[#FFF9FB] border-b border-[#F8D7E3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-[#D46A8A] to-[#8B2D4A] text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-serif font-black text-[#8B2D4A]">
                      Salon Teranga Live
                    </h3>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>En direct</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5A2D3A]/80">
                    Discutez entre clientes & créatrices à Dakar
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLiveChatOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author Identity / Nickname bar */}
            <div className="px-4 py-2 bg-[#FCE8EF]/70 border-b border-[#F8D7E3] flex items-center justify-between text-[11px] gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <User className="w-3.5 h-3.5 text-[#D46A8A] shrink-0" />
                <span className="text-[#8B2D4A] font-bold shrink-0">Votre pseudo :</span>
                <input
                  type="text"
                  placeholder="Ex: Aïcha, Client HLM..."
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="px-2 py-0.5 rounded-lg bg-white border border-[#F8D7E3] text-[#3D232A] font-bold text-xs flex-1 min-w-0 focus:outline-none focus:border-[#D46A8A]"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0 text-[#8B2D4A]">
                <MapPin className="w-3 h-3 text-[#D46A8A]" />
                <input
                  type="text"
                  placeholder="Quartier..."
                  value={authorQuarter}
                  onChange={(e) => setAuthorQuarter(e.target.value)}
                  className="w-20 px-1.5 py-0.5 rounded-lg bg-white border border-[#F8D7E3] text-[10px] text-[#3D232A] font-semibold focus:outline-none focus:border-[#D46A8A]"
                />
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-3 py-2 bg-white border-b border-[#F8D7E3]/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-bold text-[#8B2D4A]/70 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D46A8A]" />
                <span>Idées :</span>
              </span>
              {PRESET_QUICK_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickSend(preset)}
                  className="px-2.5 py-1 rounded-full bg-[#FFF9FB] hover:bg-[#FCE8EF] text-[#8B2D4A] text-[10px] font-medium border border-[#F8D7E3] shrink-0 transition-colors cursor-pointer"
                >
                  {preset.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFF9FB]/50">
              {liveChatMessages.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#FCE8EF] text-[#D46A8A] flex items-center justify-center mx-auto shadow-xs">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-[#8B2D4A]">Soyez le premier à lancer la discussion !</h4>
                  <p className="text-[11px] text-[#5A2D3A] max-w-xs mx-auto">
                    Demandez des avis, cherchez un article ou discutez en direct avec la communauté TERANGA BEAUTY.
                  </p>
                </div>
              ) : (
                liveChatMessages.map((msg) => {
                  const isVendor = msg.authorRole === 'vendor';
                  const isAdmin = msg.authorRole === 'admin';

                  return (
                    <div key={msg.id} className="space-y-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          {isVendor && <Store className="w-3 h-3 text-[#D46A8A]" />}
                          {isAdmin && <ShieldCheck className="w-3 h-3 text-amber-500" />}
                          <span>{msg.authorName}</span>
                        </span>

                        {msg.authorQuarter && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#FCE8EF] text-[#8B2D4A] font-semibold text-[9px] border border-[#F8D7E3]">
                            {msg.authorQuarter}
                          </span>
                        )}

                        <span className="text-slate-400 tabular-nums ml-auto">{msg.timestamp}</span>
                      </div>

                      <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[92%] shadow-2xs ${
                        isVendor
                          ? 'bg-[#FCE8EF] text-[#8B2D4A] border border-[#F8D7E3] rounded-tl-sm'
                          : isAdmin
                          ? 'bg-amber-50 text-amber-950 border border-amber-200 rounded-tl-sm'
                          : 'bg-white text-slate-800 border border-[#F8D7E3] rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#F8D7E3] flex items-center gap-2">
              <input
                type="text"
                placeholder="Écrivez votre message en direct..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#FFF9FB] border border-[#F8D7E3] text-xs text-slate-900 focus:outline-none focus:border-[#D46A8A]"
              />

              <button
                type="submit"
                disabled={isSending || !messageText.trim()}
                className="p-2.5 rounded-2xl bg-[#D46A8A] hover:bg-[#C0587A] text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
