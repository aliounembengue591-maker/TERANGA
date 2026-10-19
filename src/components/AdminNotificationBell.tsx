import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  db,
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
  ExternalLink,
  MessageCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Phone
} from 'lucide-react';

export const AdminNotificationBell: React.FC = () => {
  const {
    isInitiatorAuthenticated,
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

        // Play sound if new notification arrives
        if (items.length > prevCountRef.current && prevCountRef.current !== 0) {
          setHasNewPulse(true);
          try {
            const audio = new Audio('/notif.mp3');
            audio.play().catch(() => {
              // Browser audio policy fallback
            });
          } catch {}
          setTimeout(() => setHasNewPulse(false), 5000);
        }
        prevCountRef.current = items.length;
        setNotifications(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admin_notifications');
      }
    );

    return () => unsubscribe();
  }, []);

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

  // 1. Approve / Validate
  const handleValidate = async (notif: AdminNotification) => {
    setIsProcessing(true);
    try {
      if (notif.type === 'new_shop') {
        approveVendor(notif.shopId);
      } else if (notif.type === 'new_product') {
        const targetProd = products.find(
          (p) => p.name === notif.productName && p.vendorId === notif.shopId
        );
        if (targetProd) {
          await updateDoc(doc(db, 'products', targetProd.id), {
            status: 'approved',
            approvedAt: serverTimestamp()
          }).catch(console.warn);
        }
      }

      // Mark notification as approved
      await updateDoc(doc(db, 'admin_notifications', notif.id), {
        status: 'approved',
        read: true,
        approvedAt: serverTimestamp()
      }).catch(console.warn);

      showToast({
        title: 'Maison validée avec succès !',
        message: `${notif.shopName} est maintenant visible sur la page d'accueil de TERANGA BEAUTY.`,
        type: 'success'
      });

      // Auto-open WhatsApp
      const rawPhone = (notif.ownerPhone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.startsWith('221') ? rawPhone : (rawPhone.length === 9 ? `221${rawPhone}` : rawPhone);
      const owner = notif.ownerName || notif.shopName;
      const text = `✨ Félicitations ${owner} !\n\nTa Maison "${notif.shopName}" est validée et visible sur TERANGA BEAUTY en page d'accueil luxe ⭐\n\n🔗 Découvre ta boutique en ligne : https://teranga-beauty-luxe.web.app/boutique/${notif.shopId}\n\nBienvenue dans les Maisons Sélectionnées de Dakar ! 💛\n- L'équipe Supervision TERANGA BEAUTY`;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Erreur validation:', err);
      showToast({
        title: 'Erreur validation',
        message: 'Impossible de valider sur Firestore. Vérifiez la connexion.',
        type: 'warning'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Reject / Refuse
  const handleConfirmReject = async () => {
    if (!rejectingNotif) return;
    setIsProcessing(true);
    const notif = rejectingNotif;
    const reason = rejectionReason.trim() || 'Informations ou photos non conformes aux critères de sélection luxe.';

    try {
      if (notif.type === 'new_shop') {
        // Delete shop + products
        await deleteShop(notif.shopId);
      }

      // Update notif status to rejected
      await updateDoc(doc(db, 'admin_notifications', notif.id), {
        status: 'rejected',
        read: true,
        rejectionReason: reason,
        rejectedAt: serverTimestamp()
      }).catch(console.warn);

      showToast({
        title: 'Boutique refusée',
        message: `${notif.shopName} a été supprimée de la plateforme.`,
        type: 'info'
      });

      // Send WhatsApp refusal message
      const rawPhone = (notif.ownerPhone || '').replace(/\D/g, '');
      const cleanPhone = rawPhone.startsWith('221') ? rawPhone : (rawPhone.length === 9 ? `221${rawPhone}` : rawPhone);
      const owner = notif.ownerName || notif.shopName;
      const text = `Bonjour ${owner},\n\nNous vous remercions pour votre intérêt pour TERANGA BEAUTY.\n\nAprès examen de votre demande pour la boutique "${notif.shopName}", nous ne pouvons malheureusement pas la valider pour le moment.\n\n📌 Motif : ${reason}\n\nVous êtes invité(e) à ajuster vos visuels et coordonnées afin de soumettre à nouveau votre maison.\n\nCordialement,\n- L'équipe Supervision TERANGA BEAUTY`;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');

      setRejectingNotif(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Erreur refus:', err);
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
            ? 'text-[#8B2D4A] bg-[#FCE8EF] hover:bg-[#F8D7E3] ring-1 ring-[#D46A8A]'
            : 'text-stone-600 hover:text-[#8B2D4A] hover:bg-[#FCE8EF]'
        } ${hasNewPulse ? 'animate-bounce' : ''}`}
        title={`Supervision Live (${pendingCount} en attente)`}
        aria-label="Supervision Live Teranga"
      >
        <Bell className="w-5 h-5 stroke-[2]" />

        {/* Red Badge with live count */}
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-black text-white bg-red-600 rounded-full shadow-md ring-2 ring-white animate-pulse">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Full-Height Right Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md h-full bg-[#FFF9FB] shadow-2xl flex flex-col border-l border-[#F8D7E3] animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#681427] to-[#480A17] text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-[#F7D87E]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-serif font-black tracking-wide text-[#FFF6CC]">
                    SUPERVISION LIVE - TERANGA
                  </h2>
                  <p className="text-[10px] text-[#F7D87E] flex items-center gap-1 font-sans">
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
              <span className="font-bold text-[#8B2D4A]">
                Demandes de validation : <span className="tabular-nums text-red-600">{pendingCount}</span>
              </span>
              <span className="text-[10px] text-[#8B2D4A]/70 uppercase tracking-wider font-semibold">
                Admin Unique
              </span>
            </div>

            {/* Notifications Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {pendingCount > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 bg-white rounded-2xl border border-[#F8D7E3] shadow-xs space-y-3 transition-all hover:shadow-md hover:border-[#D46A8A]"
                  >
                    {/* Top Row: Type & Date */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                        {notif.type === 'new_shop' ? (
                          <>
                            <Store className="w-3 h-3 text-amber-700" />
                            <span>Nouvelle Boutique</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 text-amber-700" />
                            <span>Nouvel Article</span>
                          </>
                        )}
                      </span>

                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                      </span>
                    </div>

                    {/* Middle: Shop / Product Card Content */}
                    <div className="flex items-start gap-3">
                      {/* Shop Logo / Product Photo */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FCE8EF] border border-[#F8D7E3] shrink-0">
                        {notif.type === 'new_shop' ? (
                          notif.shopLogo ? (
                            <img
                              src={notif.shopLogo}
                              alt={notif.shopName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-serif font-black text-[#8B2D4A] text-lg">
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
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {notif.type === 'new_shop' ? notif.shopName : notif.productName}
                        </h4>
                        {notif.type === 'new_product' && (
                          <p className="text-[11px] text-[#8B2D4A] font-medium">
                            Boutique : {notif.shopName} · {Number(notif.price || 0).toLocaleString('fr-FR')} FCFA
                          </p>
                        )}
                        <p className="text-[11px] text-stone-600">
                          Gérant(e) : <strong>{notif.ownerName || 'Vendeuse'}</strong>
                        </p>
                        {notif.ownerPhone && (
                          <p className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#D46A8A]" />
                            <span>{notif.ownerPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                      {/* Refuse */}
                      <button
                        onClick={() => {
                          setRejectingNotif(notif);
                          setRejectionReason('');
                        }}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Refuser</span>
                      </button>

                      {/* Validate - Maison Sélectionnée */}
                      <button
                        onClick={() => handleValidate(notif)}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valider ⭐</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#FCE8EF] text-[#8B2D4A] flex items-center justify-center mx-auto border border-[#F8D7E3]">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-[#8B2D4A]">
                    Toutes les demandes sont traitées
                  </h3>
                  <p className="text-xs text-[#5A2D3A]/70 max-w-xs mx-auto">
                    Dès qu'une vendeuse crée une boutique ou met un produit en ligne, l'alerte apparaîtra ici en temps réel sans rechargement.
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
                Refuser la demande : {rejectingNotif.shopName}
              </h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              La boutique et ses produits associés seront supprimés de Firestore. Un message explicatif sera envoyé directement sur WhatsApp à <strong>{rejectingNotif.ownerName || rejectingNotif.shopName}</strong> ({rejectingNotif.ownerPhone}).
            </p>

            {/* Quick reason suggestions */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                Motif du refus :
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Photos non conformes à l'exigence de qualité luxe, numéro de paiement Wave introuvable, coordonnées incomplètes..."
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
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
