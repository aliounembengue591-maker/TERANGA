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
  Crown,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  MessageSquareQuote,
  CheckCircle2,
  Diamond
} from 'lucide-react';
import { uploadOrCompressProductImage } from '../services/imageUpload';

export interface GlobalChatMessage {
  id: string;
  userId: string;
  userName: string;
  shopName?: string;
  avatar?: string;
  role: 'admin' | 'vendeuse' | 'cliente';
  message: string;
  imageUrl?: string;
  replyToId?: string;
  replyToAuthor?: string;
  replyToMessage?: string;
  createdAt: any;
  likes?: string[] | number;
}

interface GlobalChatMarketProps {
  onBackToHome?: () => void;
}

export const GlobalChatMarket: React.FC<GlobalChatMarketProps> = ({ onBackToHome }) => {
  const {
    currentRole,
    activeVendor,
    userAccount,
    isInitiatorAuthenticated,
    vendors,
    openShopCatalogue,
    showToast
  } = useApp();

  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<GlobalChatMessage | null>(null);
  const [selectedMessageAction, setSelectedMessageAction] = useState<GlobalChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<any>(null);

  // Quick Luxury Chips
  const LUXURY_QUICK_CHIPS = [
    '✨ Disponible aujourd\'hui ?',
    '💎 Prix Maison ?',
    '👑 Édition Limitée ?',
    '🌸 Livraison Express Dakar ?'
  ];

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
        userName: 'Direction Teranga Luxe',
        role: 'admin' as const,
        avatar: '/logo.png',
        shopName: undefined
      };
    }
    if (currentRole === 'vendor' && activeVendor) {
      return {
        userId: activeVendor.id || myUserId,
        userName: activeVendor.ownerName || activeVendor.name,
        role: 'vendeuse' as const,
        avatar: activeVendor.avatar || '',
        shopName: activeVendor.name
      };
    }
    return {
      userId: myUserId,
      userName: userAccount?.name || 'Cliente Teranga',
      role: 'cliente' as const,
      avatar: '',
      shopName: undefined
    };
  };

  const currentProfile = getSenderProfile();

  // 1. Presence Heartbeat (count users active within last 2 minutes)
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
      } catch {
        // Presence silent fail
      }
    };

    updatePresence();
    const heartbeatInterval = setInterval(updatePresence, 45000);

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

  // 2. Typing indicator listener
  useEffect(() => {
    const unsubscribeTyping = onSnapshot(
      collection(db, 'typing_status'),
      (snapshot) => {
        const now = Date.now();
        const activeTypers: string[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.userId !== myUserId && data.isTyping) {
            const updatedMs = data.updatedAt?.seconds
              ? data.updatedAt.seconds * 1000
              : new Date(data.updatedAt || 0).getTime();
            if (now - updatedMs < 6000) {
              activeTypers.push(data.userName || 'Une Maison');
            }
          }
        });
        setTypingUsers(activeTypers);
      },
      () => {}
    );

    return () => unsubscribeTyping();
  }, [myUserId]);

  // 3. Real-time onSnapshot: global_chat ordered by createdAt asc limit 150
  useEffect(() => {
    const chatQuery = query(
      collection(db, 'global_chat'),
      orderBy('createdAt', 'asc'),
      limit(150)
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
            userName: d.userName || 'Membre Teranga',
            shopName: d.shopName,
            avatar: d.avatar,
            role: d.role || 'cliente',
            message: d.message || '',
            imageUrl: d.imageUrl,
            replyToId: d.replyToId,
            replyToAuthor: d.replyToAuthor,
            replyToMessage: d.replyToMessage,
            createdAt: d.createdAt,
            likes: Array.isArray(d.likes) ? d.likes : (typeof d.likes === 'number' ? d.likes : [])
          });
        });

        // Audio chime and vibration for new incoming messages
        if (!isInitialLoadRef.current && items.length > messages.length) {
          const latest = items[items.length - 1];
          if (latest && latest.userId !== myUserId) {
            try {
              const audio = new Audio('/notif.mp3');
              audio.play().catch(() => {});
            } catch {}
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(150);
            }
          }
        }

        isInitialLoadRef.current = false;
        setMessages(items);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'global_chat');
      }
    );

    return () => unsubscribe();
  }, [myUserId]);

  // Handle typing status broadcast with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    setDoc(
      doc(db, 'typing_status', myUserId),
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
        doc(db, 'typing_status', myUserId),
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

  // Image Upload handler via Camera or File
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
      console.warn('Chat image compress error:', err);
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
      doc(db, 'typing_status', myUserId),
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
        likes: []
      };

      if (currentProfile.shopName) {
        payload.shopName = currentProfile.shopName;
      }
      if (currentProfile.avatar) {
        payload.avatar = currentProfile.avatar;
      }
      if (selectedImage) {
        payload.imageUrl = selectedImage;
      }
      if (replyingTo) {
        payload.replyToId = replyingTo.id;
        payload.replyToAuthor = replyingTo.userName;
        payload.replyToMessage = replyingTo.message.slice(0, 80);
      }

      await addDoc(collection(db, 'global_chat'), payload);

      setInputText('');
      setSelectedImage('');
      setReplyingTo(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'global_chat');
      showToast({
        title: 'Envoi impossible',
        message: 'Une erreur est survenue lors de l\'envoi de votre message.',
        type: 'warning'
      });
    } finally {
      setIsSending(false);
    }
  };

  // Toggle Like on a message
  const handleToggleLike = async (msg: GlobalChatMessage) => {
    try {
      const currentLikes = Array.isArray(msg.likes) ? msg.likes : [];
      let updatedLikes: string[];

      if (currentLikes.includes(myUserId)) {
        updatedLikes = currentLikes.filter((id) => id !== myUserId);
      } else {
        updatedLikes = [...currentLikes, myUserId];
      }

      await updateDoc(doc(db, 'global_chat', msg.id), {
        likes: updatedLikes
      });
    } catch (err) {
      console.warn('Erreur like:', err);
    }
  };

  // Delete message (Admin can delete all, author can delete own)
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
      console.error('Erreur suppression message:', err);
    }
  };

  // Long press detection for mobile
  const handleTouchStart = (msg: GlobalChatMessage) => {
    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageAction(msg);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Quick chip click handler
  const handleChipClick = (chipText: string) => {
    setInputText((prev) => (prev ? `${prev} ${chipText}` : chipText));
    inputRef.current?.focus();
  };

  // Helper to extract a price from text if present
  const extractPriceTag = (text: string): string | null => {
    const match = text.match(/(\d+[\s.]*\d*)\s*(?:FCFA|F\b|CFA)/i);
    if (match) return match[0];
    return null;
  };

  // Open shop catalogue for a given shop name
  const handleOpenBoutique = (shopName?: string) => {
    if (!shopName) return;
    const clean = shopName.trim().toLowerCase();
    const found = vendors.find(
      (v) =>
        v.name.toLowerCase().includes(clean) ||
        clean.includes(v.name.toLowerCase())
    );
    if (found) {
      openShopCatalogue(found);
    } else if (onBackToHome) {
      showToast({
        title: `Maison ${shopName}`,
        message: 'Ouverture du catalogue de la maison...',
        type: 'info'
      });
      onBackToHome();
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/50 bg-[#FFFBF5] relative font-['Montserrat',sans-serif] tracking-[0.5px]">
      
      {/* 1. Header - Maison de Luxe */}
      {/* Background #4A0E16 (bordeaux très foncé) with subtle gold pattern, Playfair Display title, subtitle, pulsing gold dot, gold border bottom 2px #D4AF37 */}
      <header
        className="relative px-4 py-3.5 sm:px-6 sm:py-4 bg-[#4A0E16] text-[#FFFBF5] flex items-center justify-between border-b-2 border-[#D4AF37] shadow-xl shrink-0 z-20 overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% -20%, rgba(212, 175, 55, 0.25) 0%, transparent 70%), linear-gradient(180deg, #4A0E16 0%, #36080F 100%)`
        }}
      >
        {/* Subtle gold watermark / damask motif behind header */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 0l6 12h12l-9.5 8 3.5 12-12-7-12 7 3.5-12L6 12h12z' fill='%23D4AF37' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '36px 36px'
          }}
        />

        <div className="relative flex items-center gap-3 z-10">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#D4AF37] border border-[#D4AF37]/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Retour aux vitrines"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Monogram crest gold / bordeaux */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#F7D87E] via-[#D4AF37] to-[#99771F] p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#4A0E16] flex items-center justify-center relative overflow-hidden">
              <span className="font-serif font-bold text-[#F7D87E] text-lg tracking-wider">
                TB
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#D4AF37]/10 to-transparent pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-base sm:text-lg tracking-[0.2em] text-[#D4AF37] drop-shadow-sm uppercase">
                TERANGA BEAUTY
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F7D87E] text-[10px] font-semibold tracking-wider uppercase">
                <Crown className="w-2.5 h-2.5 text-[#F7D87E]" />
                <span>Haute Beauté</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.16em] uppercase text-[#E5C368] drop-shadow-xs flex items-center gap-1.5 mt-0.5">
              <span>Salon Privé des Maisons Sélectionnées</span>
            </p>
          </div>
        </div>

        {/* Right Side: Online Counter with Pulsing Gold Dot */}
        <div className="relative flex items-center gap-2 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-[#D4AF37]/60 shadow-inner backdrop-blur-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]"></span>
            </span>
            <span className="text-[11px] font-bold text-[#F7D87E] tracking-wider uppercase whitespace-nowrap">
              {onlineCount} {onlineCount > 1 ? 'Maisons en ligne' : 'Maison en ligne'}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Chat Background: #FFFBF5 (beige crème luxe) with very light gold damask pattern watermark and thin gold boutique borders */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FFFBF5] relative border-l border-r border-[#D4AF37]/30 sm:border-l-2 sm:border-r-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D4AF37' fill-opacity='0.038' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        {/* Salon Welcome Ribbon */}
        <div className="text-center py-2.5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#D4AF37]/40 shadow-xs text-[#4A0E16] text-[11px] font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Salon d'échanges exclusif réservé aux Maisons de Beauté et à leurs clientes</span>
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
        </div>

        {/* Empty State: Luxury Boutique Lounge */}
        {messages.length === 0 && (
          <div className="py-16 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#FFF2CF] via-[#FFFBF5] to-[#F7D87E] border-2 border-[#D4AF37] p-4 shadow-xl flex items-center justify-center">
              <Store className="w-10 h-10 text-[#4A0E16]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-[#4A0E16]">
                Le Salon Privé s'ouvre
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                Soyez la première Maison à prendre la parole dans cet espace d'exception.
              </p>
            </div>
            <button
              onClick={() => {
                setInputText('Bonjour à toutes les Maisons d\'exception de Dakar ! ✨');
                inputRef.current?.focus();
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Prendre la parole</span>
            </button>
          </div>
        )}

        {/* Messages Feed */}
        {messages.map((msg) => {
          const isMe = msg.userId === myUserId || (msg.role === 'admin' && isAdmin);
          const likesList = Array.isArray(msg.likes) ? msg.likes : [];
          const likesCount = likesList.length;
          const hasLiked = likesList.includes(myUserId);
          const extractedPrice = extractPriceTag(msg.message);

          return (
            <div
              key={msg.id}
              className={`flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                isMe ? 'items-end' : 'items-start'
              }`}
              onTouchStart={() => handleTouchStart(msg)}
              onTouchEnd={handleTouchEnd}
            >
              {/* Sender info line */}
              <div className="flex items-center gap-2 px-2 mb-1.5 text-[11px]">
                {/* Avatar with luxury ring */}
                {msg.role === 'admin' ? (
                  <div className="w-5 h-5 rounded-full bg-[#4A0E16] ring-2 ring-[#D4AF37] flex items-center justify-center shadow-xs">
                    <Crown className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#4A0E16] ring-2 ring-[#D4AF37] ring-offset-1 ring-offset-emerald-500 overflow-hidden flex items-center justify-center text-[10px] text-[#F7D87E] font-bold shadow-xs">
                    {msg.avatar ? (
                      <img src={msg.avatar} alt={msg.userName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{msg.userName.charAt(0)}</span>
                    )}
                  </div>
                )}

                {/* Role badge */}
                {msg.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#4A0E16] font-extrabold text-[9px] uppercase tracking-wider shadow-2xs font-serif">
                    <Crown className="w-2.5 h-2.5 text-[#4A0E16]" />
                    <span>Équipe Teranga Luxe</span>
                  </span>
                )}

                {msg.role === 'vendeuse' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#4A0E16] text-[#F7D87E] font-bold text-[9px] uppercase tracking-wider shadow-2xs">
                    <Diamond className="w-2.5 h-2.5 text-[#D4AF37]" />
                    <span>Maison Sélectionnée</span>
                  </span>
                )}

                {/* Author Name */}
                <span className="font-bold text-[#4A0E16]">
                  {msg.userName}
                </span>

                {/* Shop Name in Gold Cursive / Serif */}
                {msg.shopName && (
                  <span className="font-serif italic font-bold text-[#B8941F] text-[11px] tracking-wide">
                    · {msg.shopName}
                  </span>
                )}

                {/* Timestamp in Gold */}
                <span className="text-[10px] text-[#B8941F]/80 font-medium tracking-wide">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {/* Message Bubble:
                  - Admin: linear-gradient gold #D4AF37 to #B8941F, text burgundy #4A0E16, font Playfair Display, small crown icon
                  - Vendeuse: white, border 1px solid #D4AF37, left gold vertical bar 4px, shadow soft
                  - Cliente: #F9F1E8, border none, discreet
              */}
              <div
                className={`relative max-w-[88%] sm:max-w-lg rounded-2xl px-4 py-3 transition-all ${
                  msg.role === 'admin'
                    ? 'bg-gradient-to-br from-[#D4AF37] via-[#C99E28] to-[#B8941F] text-[#4A0E16] font-serif border border-[#FFF3B0] shadow-lg shadow-[#D4AF37]/25 ring-1 ring-[#D4AF37]/30'
                    : msg.role === 'vendeuse'
                    ? 'bg-white border border-[#D4AF37] border-l-4 border-l-[#D4AF37] text-[#2B2B2B] shadow-md shadow-stone-200/60 ring-1 ring-[#D4AF37]/20'
                    : 'bg-[#F9F1E8] text-[#2B2B2B] shadow-xs'
                }`}
              >
                {/* Quoted Reply if present */}
                {msg.replyToId && (
                  <div className="mb-2.5 p-2 rounded-xl bg-black/5 border-l-2 border-[#D4AF37] text-[10.5px] text-stone-700 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-[#4A0E16]">
                      <MessageSquareQuote className="w-3 h-3 text-[#D4AF37]" />
                      <span>En réponse à {msg.replyToAuthor || 'un message'} :</span>
                    </div>
                    <div className="line-clamp-1 italic text-stone-600">
                      "{msg.replyToMessage}"
                    </div>
                  </div>
                )}

                {/* Attached Boutique Image Card */}
                {msg.imageUrl && (
                  <div className="mb-3 rounded-2xl p-1 bg-gradient-to-br from-[#D4AF37] via-[#FFF2CF] to-[#B8941F] shadow-md">
                    <div className="bg-[#4A0E16] rounded-xl overflow-hidden p-1">
                      <div className="relative overflow-hidden rounded-lg max-h-64 bg-stone-900">
                        <img
                          src={msg.imageUrl}
                          alt="Création Maison"
                          className="w-full h-auto object-cover max-h-64 rounded-lg cursor-pointer hover:scale-102 transition-transform duration-300"
                          onClick={() => window.open(msg.imageUrl, '_blank')}
                        />
                        {/* Price Badge on photo if available */}
                        {extractedPrice && (
                          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-[#4A0E16]/90 border border-[#D4AF37] backdrop-blur-xs text-[#F7D87E] font-serif font-black text-xs shadow-md">
                            {extractedPrice}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Shop & Voir en boutique button */}
                      <div className="px-2 py-2 flex items-center justify-between gap-2 text-white">
                        <div className="truncate">
                          <div className="text-[10px] uppercase tracking-wider text-[#F7D87E] font-medium">
                            {msg.shopName ? `Maison ${msg.shopName}` : 'Création Exclusive'}
                          </div>
                          {extractedPrice && (
                            <div className="font-serif font-bold text-xs text-[#FFFBF5]">
                              {extractedPrice}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenBoutique(msg.shopName)}
                          className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#B8941F] text-[#4A0E16] font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                        >
                          <Store className="w-3 h-3 text-[#4A0E16]" />
                          <span>Voir en boutique</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words font-normal">
                  {msg.message}
                </p>

                {/* Bubble Footer: Likes & Action triggers */}
                <div
                  className={`flex items-center justify-between gap-3 mt-2 pt-1.5 border-t ${
                    msg.role === 'admin' ? 'border-[#4A0E16]/15' : 'border-black/5'
                  }`}
                >
                  {/* Like Button */}
                  <button
                    onClick={() => handleToggleLike(msg)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition-transform active:scale-125 ${
                      hasLiked
                        ? 'text-red-600'
                        : msg.role === 'admin'
                        ? 'text-[#4A0E16]/80 hover:text-red-700'
                        : 'text-stone-500 hover:text-red-500'
                    }`}
                    title="Aimer ce message"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        hasLiked ? 'fill-red-600 stroke-red-600' : 'stroke-[1.8]'
                      }`}
                    />
                    {likesCount > 0 && (
                      <span className="tabular-nums text-[10px] font-semibold">{likesCount}</span>
                    )}
                  </button>

                  {/* Reply and Delete */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setReplyingTo(msg);
                        inputRef.current?.focus();
                      }}
                      className="p-1 rounded-md hover:bg-black/10 text-stone-700 cursor-pointer transition-colors"
                      title="Répondre à cette Maison"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {(isAdmin || msg.userId === myUserId) && (
                      <button
                        onClick={() => handleDeleteMessage(msg)}
                        className="p-1 rounded-md hover:bg-red-50 text-stone-500 hover:text-red-600 cursor-pointer transition-colors"
                        title="Supprimer mon message"
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

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Typing Indicator: "Une Maison écrit..." with Gold Dots */}
      {typingUsers.length > 0 && (
        <div className="px-5 py-2 bg-[#FFFBF5] border-t border-[#D4AF37]/30 text-[11px] text-[#4A0E16] font-medium flex items-center gap-2.5 shrink-0 shadow-inner">
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
          <span className="italic font-serif">
            {typingUsers.length === 1 ? `${typingUsers[0]} écrit...` : 'Une Maison écrit...'}
          </span>
        </div>
      )}

      {/* 4. Reply / Image Preview Bar before sending */}
      {(replyingTo || selectedImage) && (
        <div className="px-4 py-2.5 bg-[#FFFBF5] border-t border-[#D4AF37]/50 flex items-center justify-between gap-3 shrink-0">
          {replyingTo && (
            <div className="flex items-center gap-2 text-xs text-[#4A0E16] min-w-0">
              <Reply className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div className="truncate">
                <span className="font-bold text-[#4A0E16]">
                  Répondre à {replyingTo.userName} :
                </span>{' '}
                <span className="italic opacity-80 font-serif">"{replyingTo.message}"</span>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#D4AF37] relative shadow-xs">
                <img
                  src={selectedImage}
                  alt="Aperçu création"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-[#4A0E16]">
                Photo de création prête
              </span>
            </div>
          )}

          <button
            onClick={() => {
              setReplyingTo(null);
              setSelectedImage('');
            }}
            className="p-1 rounded-full text-stone-400 hover:text-[#4A0E16] cursor-pointer transition-colors"
            title="Annuler"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. Input Bar - Comptoir de Luxe
          Fixed/sticky bottom, background rgba(255,255,255,0.95) backdrop-blur, top border gold #D4AF37
          Quick luxury chips above input: ["✨ Disponible aujourd'hui?", "💎 Prix Maison?", "👑 Édition Limitée?"]
          Input field: rounded-full border gold #D4AF37 bg #FFFBF5 placeholder "Écrivez un message aux Maisons..." in italic
          Send button: round gold gradient with white arrow
          Camera button: gold outline
      */}
      <div className="bg-white/95 backdrop-blur-md border-t-2 border-[#D4AF37] p-3 sm:p-4 shrink-0 shadow-lg space-y-2.5">
        {/* Quick Luxury Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {LUXURY_QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="px-3 py-1 rounded-full bg-[#FFFBF5] hover:bg-[#FFF2CF] border border-[#D4AF37]/60 text-[#4A0E16] text-[10.5px] font-medium tracking-wide whitespace-nowrap shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Form controls */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
            id="luxe-market-photo"
          />

          {/* Camera Button: Gold Outline */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressingImage || isSending}
            className="w-11 h-11 rounded-full border border-[#D4AF37] bg-[#FFFBF5] text-[#9B781E] hover:bg-[#FDF6E2] active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
            title="Partager une photo de création haute couture"
          >
            <Camera className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* Input field: rounded-full border gold #D4AF37 bg #FFFBF5 */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Écrivez un message aux Maisons..."
            className="flex-1 px-5 py-2.5 text-xs sm:text-sm bg-[#FFFBF5] border border-[#D4AF37] rounded-full placeholder:italic placeholder:text-stone-400 text-[#2B2B2B] focus:outline-none focus:border-[#4A0E16] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all font-light"
          />

          {/* Send Button: Round gold gradient with white arrow */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isSending}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C99E28] to-[#B8941F] hover:brightness-105 active:scale-95 text-white shadow-md flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Envoyer au Salon Privé"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* Mobile Long Press Context Menu */}
      {selectedMessageAction && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedMessageAction(null)}
        >
          <div
            className="w-full max-w-xs bg-[#FFFBF5] rounded-3xl p-5 shadow-2xl border-2 border-[#D4AF37] space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 pb-2 border-b border-[#D4AF37]/30">
              <span className="font-serif font-bold text-xs text-[#4A0E16]">
                Message de {selectedMessageAction.userName}
              </span>
            </div>

            {/* Action 1: Reply */}
            <button
              onClick={() => {
                setReplyingTo(selectedMessageAction);
                setSelectedMessageAction(null);
                inputRef.current?.focus();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FFF2CF] text-[#4A0E16] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Reply className="w-4 h-4 text-[#D4AF37]" />
              <span>Répondre à ce message</span>
            </button>

            {/* Action 2: Like */}
            <button
              onClick={() => {
                handleToggleLike(selectedMessageAction);
                setSelectedMessageAction(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FFF2CF] text-[#4A0E16] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Heart className="w-4 h-4 text-red-500" />
              <span>Aimer le message</span>
            </button>

            {/* Action 3: Voir en boutique if shopName */}
            {selectedMessageAction.shopName && (
              <button
                onClick={() => {
                  const shop = selectedMessageAction.shopName;
                  setSelectedMessageAction(null);
                  handleOpenBoutique(shop);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FFF2CF] text-[#4A0E16] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Store className="w-4 h-4 text-[#D4AF37]" />
                <span>Visiter la Maison {selectedMessageAction.shopName}</span>
              </button>
            )}

            {/* Action 4: Delete */}
            {(isAdmin || selectedMessageAction.userId === myUserId) && (
              <button
                onClick={() => handleDeleteMessage(selectedMessageAction)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Supprimer le message</span>
              </button>
            )}

            <button
              onClick={() => setSelectedMessageAction(null)}
              className="w-full py-2 text-center text-xs font-medium text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
