import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, ExternalLink, CheckCheck, Phone, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'vendor';
  text: string;
  time: string;
}

export const WhatsAppChatModal: React.FC = () => {
  const { whatsAppModal, closeWhatsAppChat } = useApp();

  if (!whatsAppModal || !whatsAppModal.isOpen) return null;

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      text: whatsAppModal.initialMessage,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'm2',
      sender: 'vendor',
      text: `Bonjour et bienvenue chez ${whatsAppModal.vendorName} ! Oui, cet article est disponible en stock dans notre atelier à Dakar. Nous pouvons vous livrer aujourd'hui même avec paiement Wave ou à la livraison.`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const cleanPhone = whatsAppModal.vendorPhone.replace(/\D/g, '');
  const realWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    whatsAppModal.initialMessage
  )}`;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Simulated vendor quick response after 1.2s
    setTimeout(() => {
      const vendorReplies = [
        "Parfait, c'est bien noté ! Pouvez-vous nous confirmer votre quartier à Dakar pour le livreur ?",
        "Absolument, la qualité est garantie et nous faisons des essayages si besoin.",
        "Nous vous préparons le colis dès maintenant. Merci de votre confiance avec TERANGA BEAUTY !"
      ];
      const randomReply = vendorReplies[Math.floor(Math.random() * vendorReplies.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'vendor',
          text: randomReply,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeWhatsAppChat}
    >
      <div
        className="relative bg-[#EFEAE2] w-full max-w-md h-[540px] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp Brand Header */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-white uppercase text-sm border border-white/30">
                {whatsAppModal.vendorName.slice(0, 2)}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border-2 border-[#075E54]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                <span>{whatsAppModal.vendorName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#C8A165]" />
              </h3>
              <p className="text-[11px] text-white/80">En ligne · {whatsAppModal.vendorPhone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={realWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Ouvrir sur le vrai WhatsApp"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={closeWhatsAppChat}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-[#128C7E]/10 border-b border-[#128C7E]/20 px-3 py-1.5 text-[11px] text-stone-700 flex items-center justify-between">
          <span>Conversation directe sécurisée TERANGA BEAUTY</span>
          <a
            href={realWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#075E54] font-semibold hover:underline flex items-center gap-1"
          >
            <span>App WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Chat message feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#E7FFDB] text-stone-900 rounded-tr-none'
                    : 'bg-white text-stone-900 rounded-tl-none border border-stone-200'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-stone-400">
                  <span>{msg.time}</span>
                  {msg.sender === 'user' && (
                    <CheckCheck className="w-3 h-3 text-[#34B7F1]" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="bg-[#F0F2F5] p-2.5 border-t border-stone-300 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 px-3 py-2 text-xs bg-white rounded-full border border-stone-300 focus:outline-none focus:border-[#075E54]"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-full bg-[#075E54] hover:bg-[#128C7E] text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
            aria-label="Envoyer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
