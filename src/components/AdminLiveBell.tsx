import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  addDoc,
  getDocs,
  serverTimestamp,
  db,
  auth,
  handleFirestoreError,
  OperationType
} from '../firebase';
import { useApp } from '../context/AppContext';
import { AdminNotification } from '../types';
import {
  Bell,
  X,
  CheckCircle2,
  XCircle,
  Store,
  ShoppingBag,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Phone,
  MessageSquare
} from 'lucide-react';

export const AdminLiveBell: React.FC = () => {
  const {
    isInitiatorAuthenticated,
    currentRole,
    setCurrentRole,
    deleteShop,
    showToast,
    approveVendor,
    products
  } = useApp();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasNewPulse, setHasNewPulse] = useState<boolean>(false);
  const [rejectingNotif, setRejectingNotif] = useState<AdminNotification | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const prevCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Check admin rights: VITE_ADMIN_EMAIL, VITE_ADMIN_UID, Firebase auth, or Initiator session
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'elhadjialiounembengue0@gmail.com';
  const adminUid = import.meta.env.VITE_ADMIN_UID || 'admin';

  const currentUser = auth.currentUser;
  const isAdmin = Boolean(
    (currentUser && (
      currentUser.email === adminEmail ||
      currentUser.uid === adminUid ||
      currentUser.uid === 'admin'
    )) ||
    isInitiatorAuthenticated ||
    currentRole === 'admin'
  );

  // Live Firestore onSnapshot listener for pending admin_notifications
  useEffect(() => {
    const notifsQuery = query(
      collection(db, 'admin_notifications'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      notifsQuery,
      (snapshot) => {
        const items: AdminNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            type: data.type || 'new_shop',
            shopId: data.shopId || '',
            shopName: data.shopName || 'Boutique',
            ownerName: data.ownerName || '',
            ownerPhone: data.ownerPhone || '',
            ownerId: data.ownerId || '',
            productName: data.productName,
            productImage: data.productImage,
            price: data.price,
            createdAt: data.createdAt,
            status: data.status || 'pending',
            read: !!data.read,
            shopLogo: data.shopLogo,
            rejectionReason: data.rejectionReason
          });
        });

        // Sort newest first
        items.sort((a, b) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        // Play sound + vibrate if new document arrives (and not initial mount)
        if (!isInitialLoadRef.current && items.length > prevCountRef.current) {
          setHasNewPulse(true);
          try {
            const audio = new Audio('/notif.mp3');
            audio.play().catch(() => {});
          } catch {}

          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(200);
            } catch {}
          }

          setTimeout(() => setHasNewPulse(false), 5000);
        }

        isInitialLoadRef.current = false;
        prevCountRef.current = items.length;
        setNotifications(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admin_notifications');
      }
    );

    return () => unsubscribe();
  }, []);

  // Only render if user has Admin privileges
  if (!isAdmin) {
    return null;
  }

  const pendingCount = notifications.length;

  const formatRelativeTime = (timestamp: any): string => {
    if (!timestamp) return "À l'instant";
    let dateMs = Date.now();
    if (timestamp.seconds) {
      dateMs = timestamp.seconds * 1000;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      dateMs = new Date(timestamp).getTime();
    }
    const diffSec = Math.floor((Date.now() - dateMs) / 1000);
    if (diffSec < 60) return "il y a quelques secondes";
    if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)} h`;
    return `il y a ${Math.floor(diffSec / 86400)} j`;
  };

  // 1. [✅ VALIDER] - Emergency Fix Logic
  const handleValidate = async (notif: AdminNotification) => {
    setIsProcessing(true);
    const shopId = notif.shopId;
    try {
      const shopRef = doc(db, 'shops', shopId);
      await updateDoc(shopRef, {
        isApproved: true,
        isVisible: true,
        status: 'active',
        approvedAt: serverTimestamp(),
        badge: 'Maison Sélectionnée'
      }).catch(async () => {
        await setDoc(
          shopRef,
          {
            id: shopId,
            name: notif.shopName,
            ownerName: notif.ownerName || '',
            phone: notif.ownerPhone || '',
            isApproved: true,
            isVisible: true,
            status: 'active',
            approvedAt: serverTimestamp(),
            badge: 'Maison Sélectionnée'
          },
          { merge: true }
        );
      });

      // Mirror to vendors collection for complete compatibility
      const vendorRef = doc(db, 'vendors', shopId);
      await updateDoc(vendorRef, {
        isApproved: true,
        isVisible: true,
        status: 'active',
        approvedAt: serverTimestamp(),
        badge: 'Maison Sélectionnée'
      }).catch(async () => {
        await setDoc(
          vendorRef,
          {
            id: shopId,
            name: notif.shopName,
            ownerName: notif.ownerName || '',
            phone: notif.ownerPhone || '',
            isApproved: true,
            isVisible: true,
            status: 'active',
            approvedAt: serverTimestamp(),
            badge: 'Maison Sélectionnée'
          },
          { merge: true }
        );
      });

      // Also approve ALL products of this shop
      const qProd = query(collection(db, 'products'), where('shopId', '==', shopId));
      const snapProd = await getDocs(qProd);
      for (const p of snapProd.docs) {
        await updateDoc(doc(db, 'products', p.id), {
          isApproved: true,
          isVisible: true,
          status: 'active'
        }).catch(console.warn);
      }

      // Also check where vendorId == shopId
      const qProd2 = query(collection(db, 'products'), where('vendorId', '==', shopId));
      const snapProd2 = await getDocs(qProd2);
      for (const p of snapProd2.docs) {
        await updateDoc(doc(db, 'products', p.id), {
          isApproved: true,
          isVisible: true,
          status: 'active'
        }).catch(console.warn);
      }

      // Mark admin_notification as approved
      await updateDoc(doc(db, 'admin_notifications', notif.id), {
        status: 'approved',
        read: true,
        approvedAt: serverTimestamp()
      }).catch(console.warn);

      // Create seller_notification for owner
      await addDoc(collection(db, 'seller_notifications'), {
        ownerId: notif.ownerId || notif.shopId,
        shopId: notif.shopId,
        shopName: notif.shopName,
        title: 'Boutique validée !',
        message: `Félicitations, votre boutique "${notif.shopName}" a été validée avec le label Maison Sélectionnée et est désormais active et visible sur TERANGA BEAUTY !`,
        type: 'approval',
        createdAt: serverTimestamp(),
        read: false
      }).catch(console.warn);

      // In-memory optimistic update
      approveVendor(shopId);

      // PART B AUTO MESSAGE to global_chat
      await addDoc(collection(db, 'global_chat'), {
        userId: auth.currentUser?.uid || 'admin',
        userName: 'Direction TERANGA BEAUTY',
        role: 'admin',
        shopName: notif.shopName,
        message: `🎉 Nouvelle Maison Sélectionnée: ${notif.shopName} vient de rejoindre le Marché Live! Bienvenue 💛 - par Admin`,
        avatar: '/logo.png',
        createdAt: serverTimestamp(),
        likes: []
      }).catch(console.warn);

      showToast({
        title: 'Maison validée avec succès !',
        message: `${notif.shopName} est désormais active et visible sur la page d'accueil.`,
        type: 'success'
      });

      // Force refresh homepage after validation: navigate('/') then window.location.reload() after 1 sec
      setCurrentRole('client');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      console.error('Erreur validation AdminLiveBell:', err);
      showToast({
        title: 'Erreur validation',
        message: 'Impossible de valider sur Firestore. Vérifiez la connexion.',
        type: 'warning'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. [❌ REFUSER]
  const handleConfirmReject = async () => {
    if (!rejectingNotif) return;
    setIsProcessing(true);
    const notif = rejectingNotif;
    const reason =
      rejectionReason.trim() ||
      'Photos ou informations non conformes aux critères de la sélection Maison Sélectionnée.';

    try {
      if (notif.type === 'new_shop') {
        // Delete shop doc + products where shopId
        await deleteShop(notif.shopId);
      }

      // Update notif status='rejected'
      await updateDoc(doc(db, 'admin_notifications', notif.id), {
        status: 'rejected',
        read: true,
        rejectionReason: reason,
        rejectedAt: serverTimestamp()
      }).catch(console.warn);

      showToast({
        title: 'Boutique refusée',
        message: `${notif.shopName} a été retirée et la notification mise à jour.`,
        type: 'info'
      });

      // Open WhatsApp refusal
      const rawPhone = (notif.ownerPhone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.startsWith('221')
        ? rawPhone
        : rawPhone.length === 9
        ? `221${rawPhone}`
        : rawPhone;
      const owner = notif.ownerName || notif.shopName;
      const refusalText = `Bonjour ${owner},\n\nNous vous remercions pour l'intérêt porté à TERANGA BEAUTY.\n\nAprès examen de votre inscription pour la boutique "${notif.shopName}", nous ne pouvons malheureusement pas valider votre maison pour le motif suivant :\n\n📌 Motif : ${reason}\n\nVous êtes invité(e) à mettre à jour vos coordonnées ou photos pour une nouvelle soumission.\n\nCordialement,\n- Direction Supervision TERANGA BEAUTY`;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(refusalText)}`;
      window.open(waUrl, '_blank');

      setRejectingNotif(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Erreur refus AdminLiveBell:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Bell Icon in Header */}
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          pendingCount > 0
            ? 'text-[#8B2D4A] bg-[#FCE8EF] hover:bg-[#F8D7E3] ring-2 ring-red-500 shadow-xs'
            : 'text-stone-600 hover:text-[#8B2D4A] hover:bg-[#FCE8EF]'
        } ${hasNewPulse ? 'animate-bounce' : ''}`}
        title={`Supervision Admin Live (${pendingCount} en attente)`}
        aria-label="Supervision Admin Live Teranga"
      >
        <Bell className="w-5 h-5 stroke-[2]" />

        {/* LIVE badge count red with pulse animation */}
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-black text-white bg-red-600 rounded-full shadow-md ring-2 ring-white animate-pulse">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Right Drawer: 90% mobile (w-[90vw] sm:max-w-md) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-[90vw] sm:max-w-md h-full bg-[#FFF9FB] shadow-2xl flex flex-col border-l border-[#F8D7E3] animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header Burgundy & Gold */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7B1D2A] to-[#55101C] text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-[#D4AF37]/40 shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-serif font-black tracking-wide text-[#FFF6CC]">
                    VALIDATION LIVE - ADMIN
                  </h2>
                  <p className="text-[10px] text-[#D4AF37] flex items-center gap-1 font-sans">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>Synchronisé en direct Firestore</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Counter Subheader */}
            <div className="px-5 py-3 bg-[#FCE8EF] border-b border-[#F8D7E3] flex items-center justify-between text-xs">
              <span className="font-bold text-[#8B2D4A] flex items-center gap-1.5">
                <span>En attente de validation :</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[11px] tabular-nums animate-pulse">
                  {pendingCount}
                </span>
              </span>
              <span className="text-[10px] text-[#8B2D4A]/70 uppercase tracking-wider font-bold">
                {adminEmail}
              </span>
            </div>

            {/* Notifications Scrollable List (Newest first LIVE onSnapshot) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {pendingCount > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 bg-white rounded-2xl border-2 border-[#F8D7E3] shadow-xs space-y-3 transition-all hover:shadow-md hover:border-[#D46A8A]"
                  >
                    {/* Top Row: Type & Date */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                        {notif.type === 'new_shop' ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-amber-700" />
                            <span>Nouvelle Boutique Vendeuse</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                            <span>Nouvel Article</span>
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                      </span>
                    </div>

                    {/* Middle: Shop / Product Card Content */}
                    <div className="flex items-start gap-3">
                      {/* Shop Logo / Product Photo */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FCE8EF] border border-[#F8D7E3] shrink-0 shadow-2xs">
                        {notif.type === 'new_shop' ? (
                          notif.shopLogo ? (
                            <img
                              src={notif.shopLogo}
                              alt={notif.shopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-serif font-black text-[#8B2D4A] text-xl">
                              {(notif.shopName || 'TB').slice(0, 2).toUpperCase()}
                            </div>
                          )
                        ) : notif.productImage ? (
                          <img
                            src={notif.productImage}
                            alt={notif.productName || 'Article'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8B2D4A]">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Text info */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {notif.type === 'new_shop' ? notif.shopName : notif.productName}
                        </h4>
                        {notif.type === 'new_product' && (
                          <p className="text-[11px] text-[#8B2D4A] font-semibold">
                            Boutique : {notif.shopName} · {Number(notif.price || 0).toLocaleString('fr-FR')} FCFA
                          </p>
                        )}
                        <p className="text-xs text-stone-600">
                          Propriétaire : <strong>{notif.ownerName || 'Vendeuse Dakar'}</strong>
                        </p>
                        {notif.ownerPhone && (
                          <p className="text-xs text-[#8B2D4A] font-medium flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-[#D46A8A]" />
                            <span>{notif.ownerPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 2 Big Buttons as specifically requested */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-stone-100">
                      {/* [❌ REFUSER] */}
                      <button
                        onClick={() => {
                          setRejectingNotif(notif);
                          setRejectionReason('');
                        }}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>❌ REFUSER</span>
                      </button>

                      {/* [✅ VALIDER & WHATSAPP] */}
                      <button
                        onClick={() => handleValidate(notif)}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>✅ VALIDER</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#FCE8EF] text-[#8B2D4A] flex items-center justify-center mx-auto border border-[#F8D7E3]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-[#8B2D4A]">
                    Toutes les demandes sont traitées
                  </h3>
                  <p className="text-xs text-[#5A2D3A]/70 max-w-xs mx-auto">
                    Dès qu'une vendeuse crée une boutique sur son téléphone, l'alerte apparaîtra instantanément ici sans rechargement.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refusal Reason Modal */}
      {rejectingNotif && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setRejectingNotif(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-red-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-serif font-black text-red-900">
                Refuser la boutique : {rejectingNotif.shopName}
              </h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              La boutique et ses produits associés seront supprimés de la base Firestore. Un message explicatif avec le motif sera ouvert sur WhatsApp pour <strong>{rejectingNotif.ownerName || rejectingNotif.shopName}</strong> ({rejectingNotif.ownerPhone}).
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                Motif du refus :
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Photos floues ou non conformes, coordonnées de paiement Wave introuvables..."
                rows={3}
                className="w-full p-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectingNotif(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                Confirmer le refus & WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
