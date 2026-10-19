import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  db,
  auth,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { useApp } from '../context/AppContext';
import {
  Send,
  Camera,
  Heart,
  Reply,
  Trash2,
  X,
  Store,
  Sparkles,
  ArrowLeft,
  Crown,
  Star,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Flag
} from 'lucide-react';
import { uploadOrCompressProductImage } from '../services/imageUpload';

export interface GlobalChatMessage {
  id: string;
  userId: string;
  userName: string;
  shopName?: string;
  userAvatar?: string;
  avatar?: string;
  role: 'admin' | 'vendeuse' | 'cliente';
  message: string;
  imageUrl?: string;
  price?: number | string;
  productName?: string;
  replyToId?: string;
  replyToName?: string;
  replyToAuthor?: string;
  replyToMessage?: string;
  createdAt: any;
  likes?: string[] | number;
}

interface GlobalChatRoomProps {
  onBackToHome?: () => void;
}

const LUXURY_QUICK_CHIPS = [
  "✨ Disponible aujourd'hui?",
  "💎 Prix Maison?",
  "👑 Édition Limitée?",
  "J'ai ça en stock!",
  "Je t'écris en privé"
];

export const GlobalChatRoom: React.FC<GlobalChatRoomProps> = ({ onBackToHome }) => {
  const {
    currentRole,
    activeVendor,
    userAccount,
    isInitiatorAuthenticated,
    showToast,
    marketChatDraft,
    setMarketChatDraft,
    openShopCatalogue,
    vendors
  } = useApp();

  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>(() => marketChatDraft || '');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<GlobalChatMessage | null>(null);
  const [selectedMessageAction, setSelectedMessageAction] = useState<GlobalChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<any>(null);

  // Sync external draft into input if set (e.g. from ProductCard "Demander dans le Marché Live")
  useEffect(() => {
    if (marketChatDraft) {
      setInputText(marketChatDraft);
      inputFieldRef.current?.focus();
      setMarketChatDraft('');
    }
  }, [marketChatDraft, setMarketChatDraft]);

  // Persistent user identity
  const [myUserId] = useState<string>(() => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    try {
      const stored = localStorage.getItem('tb_market_user_id');
      if (stored) return stored;
      const newId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      localStorage.setItem('tb_market_user_id', newId);
      return newId;
    } catch {
      return `usr_${Date.now()}`;
    }
  });

  // Check admin rights
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'elhadjialiounembengue0@gmail.com';
  const isAdmin = Boolean(
    (auth.currentUser && (
      auth.currentUser.email === adminEmail ||
      auth.currentUser.uid === 'admin'
    )) ||
    isInitiatorAuthenticated ||
    currentRole === 'admin'
  );

  // Resolve sender profile based on current context
  const getSenderProfile = () => {
    if (isAdmin) {
      return {
        userId: myUserId,
        userName: 'Direction TERANGA BEAUTY',
        role: 'admin' as const,
        userAvatar: '/logo.png',
        shopName: 'Maison de Haute Beauté'
      };
    }
    if (currentRole === 'vendor' && activeVendor) {
      return {
        userId: activeVendor.id || myUserId,
        userName: activeVendor.ownerName || activeVendor.name,
        role: 'vendeuse' as const,
        userAvatar: activeVendor.avatar || '',
        shopName: activeVendor.name
      };
    }
    return {
      userId: myUserId,
      userName: userAccount?.name || 'Cliente Privilège',
      role: 'cliente' as const,
      userAvatar: '',
      shopName: undefined
    };
  };

  const currentProfile = getSenderProfile();

  // 1. Presence Heartbeat (update lastSeen, count users where lastSeen > 2 minutes)
  useEffect(() => {
    const updatePresence = async () => {
      try {
        await setDoc(
          doc(db, 'user_presence', myUserId),
          {
            userId: myUserId,
            userName: currentProfile.userName,
            lastSeen: serverTimestamp()
          },
          { merge: true }
        );
      } catch (err) {
        // Fallback
      }
    };

    updatePresence();
    const heartbeatInterval = setInterval(updatePresence, 40000);

    const unsubscribePresence = onSnapshot(
      collection(db, 'user_presence'),
      (snapshot) => {
        const now = Date.now();
        let count = 0;
        snapshot.forEach((d) => {
          const data = d.data();
          const lastSeenMs = data.lastSeen?.seconds
            ? data.lastSeen.seconds * 1000
            : new Date(data.lastSeen || 0).getTime();
          if (now - lastSeenMs < 120000) {
            count++;
          }
        });
        setOnlineCount(Math.max(count, 1));
      },
      () => {}
    );

    return () => {
      clearInterval(heartbeatInterval);
      unsubscribePresence();
    };
  }, [myUserId, currentProfile.userName]);

  // 2. Typing indicator (typing_indicators & typing_status collections)
  useEffect(() => {
    const unsubscribeTyping = onSnapshot(
      collection(db, 'typing_indicators'),
      (snapshot) => {
        const now = Date.now();
        const typers: string[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.userId !== myUserId && data.isTyping) {
            const updatedMs = data.updatedAt?.seconds
              ? data.updatedAt.seconds * 1000
              : new Date(data.updatedAt || 0).getTime();
            if (now - updatedMs < 6000) {
              typers.push(data.userName || 'Une Maison');
            }
          }
        });
        setTypingUsers(typers);
      },
      () => {}
    );

    return () => unsubscribeTyping();
  }, [myUserId]);

  // 3. Real-time onSnapshot: global_chat ordered by createdAt asc limit 100
  useEffect(() => {
    const chatQuery = query(
      collection(db, 'global_chat'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      chatQuery,
      (snapshot) => {
        const items: GlobalChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            userId: d.userId || '',
            userName: d.userName || 'Maison Teranga',
            shopName: d.shopName,
            userAvatar: d.userAvatar || d.avatar,
            role: d.role || 'cliente',
            message: d.message || '',
            imageUrl: d.imageUrl,
            price: d.price,
            productName: d.productName,
            replyToId: d.replyToId,
            replyToName: d.replyToName || d.replyToAuthor,
            replyToAuthor: d.replyToName || d.replyToAuthor,
            replyToMessage: d.replyToMessage,
            createdAt: d.createdAt,
            likes: Array.isArray(d.likes) ? d.likes : (typeof d.likes === 'number' ? d.likes : 0)
          });
        });

        // Sound on new incoming message
        if (!isInitialLoadRef.current && items.length > messages.length) {
          const latest = items[items.length - 1];
          if (latest && latest.userId !== myUserId) {
            try {
              const audio = new Audio('/notif.mp3');
              audio.play().catch(() => {});
            } catch {}
          }
        }

        isInitialLoadRef.current = false;
        setMessages(items);

        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'global_chat');
      }
    );

    return () => unsubscribe();
  }, [myUserId]);

  // Handle typing broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Broadcast to typing_indicators
    setDoc(
      doc(db, 'typing_indicators', myUserId),
      {
        userId: myUserId,
        userName: currentProfile.userName,
        isTyping: true,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    ).catch(() => {});

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setDoc(
        doc(db, 'typing_indicators', myUserId),
        {
          userId: myUserId,
          userName: currentProfile.userName,
          isTyping: false,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      ).catch(() => {});
    }, 2500);
  };

  // Image Upload handler via Camera
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    const instantPreview = URL.createObjectURL(file);
    setSelectedImage(instantPreview);

    try {
      const base64 = await uploadOrCompressProductImage(file);
      if (base64) {
        setSelectedImage(base64);
      }
    } catch (err) {
      console.warn('Image compress fallback:', err);
    } finally {
      setIsCompressingImage(false);
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText && !selectedImage) return;

    setIsSending(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setDoc(
      doc(db, 'typing_indicators', myUserId),
      { isTyping: false, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});

    try {
      const payload: Record<string, any> = {
        userId: currentProfile.userId,
        userName: currentProfile.userName,
        role: currentProfile.role,
        message: cleanText,
        createdAt: serverTimestamp(),
        likes: 0
      };

      if (currentProfile.shopName) {
        payload.shopName = currentProfile.shopName;
      }
      if (currentProfile.userAvatar) {
        payload.userAvatar = currentProfile.userAvatar;
        payload.avatar = currentProfile.userAvatar;
      }
      if (selectedImage) {
        payload.imageUrl = selectedImage;
      }
      if (replyingTo) {
        payload.replyToId = replyingTo.id;
        payload.replyToName = replyingTo.userName;
        payload.replyToMessage = replyingTo.message.slice(0, 80);
      }

      await addDoc(collection(db, 'global_chat'), payload);

      setInputText('');
      setSelectedImage('');
      setReplyingTo(null);

      try {
        const audio = new Audio('/notif.mp3');
        audio.play().catch(() => {});
      } catch {}
    } catch (err) {
      console.error('Erreur envoi salon:', err);
      showToast({
        title: 'Erreur',
        message: 'Impossible de transmettre le message au Salon Privé.',
        type: 'warning'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Quick chip click
  const handleChipClick = (chip: string) => {
    setInputText((prev) => (prev ? `${prev} ${chip}` : chip));
    inputFieldRef.current?.focus();
  };

  // Like Toggle
  const handleToggleLike = async (msg: GlobalChatMessage) => {
    try {
      if (Array.isArray(msg.likes)) {
        let updated: string[];
        if (msg.likes.includes(myUserId)) {
          updated = msg.likes.filter((u) => u !== myUserId);
        } else {
          updated = [...msg.likes, myUserId];
        }
        await updateDoc(doc(db, 'global_chat', msg.id), { likes: updated });
      } else {
        const currentCount = typeof msg.likes === 'number' ? msg.likes : 0;
        await updateDoc(doc(db, 'global_chat', msg.id), { likes: currentCount + 1 });
      }
    } catch (err) {
      console.warn('Erreur like salon:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msg: GlobalChatMessage) => {
    try {
      await deleteDoc(doc(db, 'global_chat', msg.id));
      setSelectedMessageAction(null);
      showToast({
        title: 'Message retiré',
        message: 'Le message a été supprimé du salon.',
        type: 'info'
      });
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleTouchStart = (msg: GlobalChatMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageAction(msg);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 400);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const formatMessageTime = (createdAt: any): string => {
    if (!createdAt) return 'À l\'instant';
    let date: Date;
    if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Look up shop by name for "Voir en boutique" action
  const handleViewShop = (shopName?: string) => {
    if (!shopName) return;
    const targetShop = vendors.find(
      (v) => v.name.toLowerCase() === shopName.toLowerCase()
    );
    if (targetShop) {
      openShopCatalogue(targetShop);
    } else {
      showToast({
        title: shopName,
        message: 'Maison Sélectionnée disponible sur le catalogue.',
        type: 'info'
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] min-h-[620px] max-w-4xl mx-auto rounded-[32px] overflow-hidden shadow-2xl border-x-2 border-b-2 border-[#D4AF37]/50 bg-[#FFFBF5] relative animate-in fade-in duration-300">
      {/* 1. Header - Maison de Luxe (#4A0E16 + gold serif + gold bottom border 2px) */}
      <header className="px-5 py-4 bg-[#4A0E16] text-white flex items-center justify-between border-b-2 border-[#D4AF37] shadow-lg shrink-0 relative overflow-hidden">
        {/* Subtle luxury watermark glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/15 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#D4AF37] border border-[#D4AF37]/40 transition-colors cursor-pointer"
              title="Retour à l'accueil"
              aria-label="Retour accueil"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Luxury Crown Monogram */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#F7D87E] via-[#D4AF37] to-[#996515] p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#4A0E16] flex items-center justify-center">
              <Crown className="w-5 h-5 text-[#F7D87E] drop-shadow-xs" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-base sm:text-lg tracking-[0.14em] text-[#D4AF37] uppercase drop-shadow-xs">
                TERANGA BEAUTY
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F7D87E] text-[9.5px] font-bold border border-[#D4AF37]/40 uppercase tracking-widest">
                <Star className="w-2.5 h-2.5 text-[#F7D87E] fill-[#F7D87E]" />
                <span>Haute Beauté</span>
              </span>
            </div>
            <p className="font-serif italic text-[11px] sm:text-xs text-[#F7D87E]/90 tracking-[0.2em] uppercase mt-0.5">
              Salon Privé des Maisons Sélectionnées
            </p>
          </div>
        </div>

        {/* Right side: 1 Maison en ligne with pulsing gold dot */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2E070C] border border-[#D4AF37]/60 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] ring-2 ring-[#D4AF37]/40 animate-pulse inline-block" />
            <span className="text-[11px] sm:text-xs font-bold text-[#F7D87E] tracking-wide">
              {onlineCount} {onlineCount > 1 ? 'Maisons en ligne' : 'Maison en ligne'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Chat Background: #FFFBF5 (beige crème luxe) with light watermark + vitrine border */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 space-y-4 bg-[#FFFBF5] bg-[radial-gradient(#D4AF37_0.65px,transparent_0.65px)] [background-size:24px_24px]">
        {/* Salon Welcome Crest */}
        <div className="text-center py-2 max-w-md mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#D4AF37]/50 shadow-xs text-[#4A0E16] text-[11px] font-serif font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Salon Privé d'échange direct entre Créatrices, Clientes & Direction</span>
          </div>
        </div>

        {/* Messages Loop */}
        {messages.map((msg) => {
          const isMe = msg.userId === myUserId || (msg.role === 'admin' && isAdmin);
          const likesList = Array.isArray(msg.likes) ? msg.likes : [];
          const likesCount = Array.isArray(msg.likes) ? msg.likes.length : (typeof msg.likes === 'number' ? msg.likes : 0);
          const hasLiked = Array.isArray(msg.likes) ? msg.likes.includes(myUserId) : false;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group transition-all duration-300 ${
                isMe ? 'items-end' : 'items-start'
              }`}
              onTouchStart={() => handleTouchStart(msg)}
              onTouchEnd={handleTouchEnd}
            >
              {/* Sender Details Above Bubble */}
              <div className="flex items-center gap-2 px-2 mb-1.5 text-[11px]">
                {msg.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#996515] text-[#4A0E16] font-black text-[9.5px] uppercase tracking-wider shadow-xs">
                    <Crown className="w-3 h-3 text-[#4A0E16]" />
                    <span>Équipe Teranga Luxe</span>
                  </span>
                ) : msg.role === 'vendeuse' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#4A0E16] text-xs">
                      {msg.userName}
                    </span>
                    {msg.shopName && (
                      <span className="font-serif italic font-bold text-[#B8860B] text-xs">
                        "{msg.shopName}"
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-[#FFF8E7] text-[#B8860B] border border-[#D4AF37]/40 text-[9px] font-bold">
                      <Star className="w-2.5 h-2.5 fill-[#D4AF37] text-[#D4AF37]" />
                      <span>Maison Sélectionnée</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <span className="font-semibold text-stone-800 text-xs">
                      {msg.userName}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      (Cliente Privilège)
                    </span>
                  </div>
                )}

                <span className="text-[10px] text-[#B8860B]/80 font-medium">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {/* Message Bubble Structure */}
              <div
                className={`relative max-w-[90%] sm:max-w-lg rounded-2xl p-4 transition-all duration-200 ${
                  msg.role === 'admin'
                    ? 'bg-gradient-to-br from-[#D4AF37] via-[#E5C158] to-[#B8941F] text-[#4A0E16] border border-[#FFF6CC] shadow-xl ring-2 ring-[#D4AF37]/40'
                    : msg.role === 'vendeuse'
                    ? 'bg-white border border-[#D4AF37] border-l-4 border-l-[#D4AF37] text-[#2B2B2B] shadow-md'
                    : 'bg-[#F9F1E8] border-none text-[#2B2B2B] shadow-xs'
                }`}
              >
                {/* Reply Snippet if Present */}
                {msg.replyToId && (
                  <div className="mb-2.5 p-2 rounded-xl bg-black/5 border-l-2 border-[#D4AF37] text-[10.5px] space-y-0.5">
                    <span className="font-bold text-[#4A0E16]">
                      En réponse à @{msg.replyToName || msg.replyToAuthor || 'un message'} :
                    </span>
                    <p className="italic text-stone-600 line-clamp-1">
                      "{msg.replyToMessage}"
                    </p>
                  </div>
                )}

                {/* Attached Boutique Card when image sent */}
                {msg.imageUrl && (
                  <div className="mb-3 rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-white p-2 shadow-md space-y-2">
                    <div className="relative overflow-hidden rounded-xl bg-stone-50 max-h-64">
                      <img
                        src={msg.imageUrl}
                        alt="Création Maison"
                        className="w-full h-auto object-cover max-h-64 rounded-xl cursor-pointer hover:scale-102 transition-transform duration-300"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                      <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-[#4A0E16]/90 text-[#F7D87E] text-[10px] font-bold border border-[#D4AF37]">
                        Maison Dakar
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                          Création d'exception
                        </span>
                        <span className="text-xs sm:text-sm font-black text-[#B8860B] tabular-nums">
                          {msg.price ? `${Number(msg.price).toLocaleString('fr-FR')} FCFA` : 'Prix sur demande'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleViewShop(msg.shopName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A0E16] hover:bg-[#641E34] text-[#F7D87E] text-xs font-bold border border-[#D4AF37]/50 shadow-xs cursor-pointer transition-transform active:scale-95"
                      >
                        <Store className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Voir en boutique</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Text Message Content */}
                <p
                  className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'admin'
                      ? 'font-serif font-semibold text-[#4A0E16]'
                      : 'text-[#2B2B2B]'
                  }`}
                >
                  {msg.message}
                </p>

                {/* Bubble Footer: Like, Reply & Action Menu */}
                <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-black/5">
                  {/* Heart / Like Button */}
                  <button
                    onClick={() => handleToggleLike(msg)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-transform active:scale-125 ${
                      hasLiked ? 'text-red-600' : 'text-stone-400 hover:text-red-500'
                    }`}
                    title="Aimer cette création"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        hasLiked ? 'fill-red-600 text-red-600' : 'stroke-[1.8]'
                      }`}
                    />
                    {likesCount > 0 && (
                      <span className="text-[10px] tabular-nums">{likesCount}</span>
                    )}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setReplyingTo(msg);
                        inputFieldRef.current?.focus();
                      }}
                      className="p-1 rounded-md text-stone-500 hover:text-[#4A0E16] hover:bg-black/5 cursor-pointer"
                      title="Répondre"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {(isAdmin || msg.userId === myUserId) && (
                      <button
                        onClick={() => handleDeleteMessage(msg)}
                        className="p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Supprimer le message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state: Private luxury salon opening invitation */}
        {messages.length === 0 && (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-[#4A0E16] text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center mx-auto shadow-xl">
              <Crown className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-black text-[#4A0E16]">
                Le Salon Privé s'ouvre
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Soyez la première Maison à prendre la parole dans cet espace d'exception réservé à l'artisanat et à la beauté sénégalaise.
              </p>
            </div>

            <button
              onClick={() => {
                setInputText("Salam à toutes les Maisons de Beauté ! ✨");
                inputFieldRef.current?.focus();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#4A0E16] font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-105 transition-transform active:scale-95 cursor-pointer border border-[#FFF6CC]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Prendre la parole</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Typing Indicator: "Une Maison écrit..." with bouncing gold dots */}
      {typingUsers.length > 0 && (
        <div className="px-5 py-1.5 bg-[#FFF8E7] border-t border-[#D4AF37]/30 text-[11px] text-[#B8860B] font-serif italic flex items-center gap-2 animate-pulse shrink-0">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span>
            {typingUsers.length === 1 && typingUsers[0] === 'Direction TERANGA BEAUTY'
              ? "L'Équipe Teranga Luxe écrit..."
              : `${typingUsers.join(', ')} écrit...`}
          </span>
        </div>
      )}

      {/* 4. Reply / Image Preview Bar before sending */}
      {(replyingTo || selectedImage) && (
        <div className="px-5 py-2.5 bg-white border-t border-[#D4AF37]/40 flex items-center justify-between gap-3 shrink-0">
          {replyingTo && (
            <div className="flex items-center gap-2.5 text-xs text-stone-700 min-w-0">
              <Reply className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div className="truncate">
                <span className="font-bold text-[#4A0E16]">
                  Répondre à {replyingTo.userName} :
                </span>{' '}
                <span className="italic opacity-80 line-clamp-1">{replyingTo.message}</span>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-[#D4AF37] shadow-xs">
                <img
                  src={selectedImage}
                  alt="Aperçu article"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-[#4A0E16]">
                Photo prête à l'envoi
              </span>
            </div>
          )}

          <button
            onClick={() => {
              setReplyingTo(null);
              setSelectedImage('');
            }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
            title="Annuler"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. Input Bar - Comptoir de Luxe (Fixed bottom, backdrop-blur, top border gold #D4AF37) */}
      <div className="bg-white/95 backdrop-blur-md border-t-2 border-[#D4AF37] p-3 sm:p-4 shrink-0 space-y-2">
        {/* Luxury Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {LUXURY_QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="px-3 py-1 rounded-full bg-[#FFFBF5] hover:bg-[#FDF4E3] text-[#4A0E16] text-[10.5px] font-bold border border-[#D4AF37]/50 whitespace-nowrap shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Row */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
            id="chat-salon-photo-input"
          />

          {/* Camera Button (Gold outline) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressingImage || isSending}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[#D4AF37] bg-[#FFFBF5] hover:bg-[#FDF4E3] text-[#B8860B] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
            title="Partager une photo de création"
          >
            <Camera className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Luxury Rounded-Full Input */}
          <input
            ref={inputFieldRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Écrivez un message aux Maisons... ex: Qui a des perruques bouclées aujourd'hui?"
            className="flex-1 px-5 py-3 text-xs sm:text-sm bg-[#FFFBF5] border border-[#D4AF37] rounded-full placeholder:italic placeholder:text-stone-400 text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 shadow-inner"
          />

          {/* Send Button (Round gold gradient with white arrow) */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isSending}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#E6C25A] via-[#D4AF37] to-[#B8941F] text-white flex items-center justify-center shadow-md hover:brightness-105 active:scale-95 transition-transform cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Envoyer au Salon Privé"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* Long Press / Options Modal */}
      {selectedMessageAction && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedMessageAction(null)}
        >
          <div
            className="w-full max-w-xs bg-[#FFFBF5] rounded-3xl p-5 shadow-2xl border-2 border-[#D4AF37] space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-1 pb-2 border-b border-[#D4AF37]/30">
              <span className="font-serif font-black text-xs text-[#4A0E16]">
                Message de {selectedMessageAction.userName}
              </span>
            </div>

            {/* Action 1: Reply */}
            <button
              onClick={() => {
                setReplyingTo(selectedMessageAction);
                setSelectedMessageAction(null);
                inputFieldRef.current?.focus();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white text-stone-800 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-[#D4AF37]/40"
            >
              <Reply className="w-4 h-4 text-[#D4AF37]" />
              <span>Répondre au message</span>
            </button>

            {/* Action 2: Like */}
            <button
              onClick={() => {
                handleToggleLike(selectedMessageAction);
                setSelectedMessageAction(null);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white text-stone-800 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-[#D4AF37]/40"
            >
              <Heart className="w-4 h-4 text-red-500" />
              <span>Aimer le message</span>
            </button>

            {/* Action 3: Signaler */}
            <button
              onClick={() => {
                showToast({
                  title: 'Signalement transmis',
                  message: 'Ce message a été signalé à la modération Teranga Luxe.',
                  type: 'info'
                });
                setSelectedMessageAction(null);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white text-stone-700 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-[#D4AF37]/40"
            >
              <Flag className="w-4 h-4 text-amber-600" />
              <span>Signaler le message</span>
            </button>

            {/* Action 4: Delete */}
            {(isAdmin || selectedMessageAction.userId === myUserId) && (
              <button
                onClick={() => handleDeleteMessage(selectedMessageAction)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-red-50 text-red-700 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-red-200"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Supprimer le message</span>
              </button>
            )}

            <button
              onClick={() => setSelectedMessageAction(null)}
              className="w-full py-2 text-center text-xs font-medium text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
