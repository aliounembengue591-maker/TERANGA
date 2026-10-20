import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { POPULAR_DAKAR_AREAS } from '../data/mockData';
import { PaymentMethod } from '../types';
import { X, CheckCircle2, ShieldCheck, QrCode, PhoneCall, Truck, AlertCircle, ArrowLeft } from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    deliveryFee,
    cartTotal,
    placeOrder
  } = useApp();

  const [customerName, setCustomerName] = useState<string>('Aminata Diallo');
  const [customerPhone, setCustomerPhone] = useState<string>('77 450 12 34');
  const [customerCity, setCustomerCity] = useState<string>('Dakar Plateau');
  const [customerAddress, setCustomerAddress] = useState<string>('Rue Joseph Gomis, Immeuble La Rotonde 3e étage');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');

  // Simulation steps: 'form' | 'processing' | 'success'
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);

  if (!isCheckoutOpen) return null;

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) return;

    if (paymentMethod === 'cod') {
      // Direct COD confirmation
      const order = placeOrder({
        customerName,
        customerPhone: `+221 ${customerPhone}`,
        customerAddress,
        customerCity,
        paymentMethod: 'cod'
      });
      setConfirmedOrderId(order.id);
      setStep('success');
    } else {
      // Wave or Orange Money simulation screen
      setStep('processing');
    }
  };

  const handleSimulatePaymentApproval = () => {
    const txId =
      paymentMethod === 'wave'
        ? `WAVE-SN-${Math.floor(100000 + Math.random() * 900000)}`
        : `OM-SN-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = placeOrder({
      customerName,
      customerPhone: `+221 ${customerPhone}`,
      customerAddress,
      customerCity,
      paymentMethod,
      transactionId: txId
    });

    setConfirmedOrderId(order.id);
    setStep('success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setIsCheckoutOpen(false)}
    >
      <div
        className="relative bg-white w-full max-w-xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#C8A165]/30 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-[#FDF6EC]">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A1A]">
              {step === 'form'
                ? 'Finaliser votre commande'
                : step === 'processing'
                ? `Paiement ${paymentMethod === 'wave' ? 'Wave Sénégal' : 'Orange Money'}`
                : 'Commande Confirmée !'}
            </h2>
            <p className="text-xs text-stone-500">
              {step === 'form'
                ? 'Livraison rapide et sécurisée à Dakar'
                : step === 'processing'
                ? 'Validation en temps réel'
                : 'Votre reçu d’achat officiel'}
            </p>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-500 hover:text-black rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {step === 'form' && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              {/* Order summary mini strip */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900">{cart.length} article(s)</span>
                  <span className="text-stone-400 mx-1">·</span>
                  <span className="text-stone-600">Total :</span>
                </div>
                <div className="text-sm font-bold text-[#C4704A] tabular-nums">
                  {cartTotal.toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {/* Customer Contact details */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                  1. Vos Coordonnées de Livraison
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Aminata Diallo"
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:border-[#C4704A] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Numéro WhatsApp Sénégal *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2.5 bg-stone-100 border border-r-0 border-stone-300 rounded-l-xl text-xs text-stone-600">
                        +221
                      </span>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="77 123 45 67"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-stone-300 rounded-r-xl focus:border-[#C4704A] focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Zone / Quartier de Dakar *
                    </label>
                    <select
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:border-[#C4704A] focus:outline-none"
                    >
                      {POPULAR_DAKAR_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Adresse précise / Repère *
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Ex: Rue 10 x Corniche, Villa 42"
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:border-[#C4704A] focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2.5 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                  2. Mode de Paiement
                </h3>

                {/* Wave Option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'wave'
                      ? 'border-[#00b2e3] bg-[#00b2e3]/5 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="wave"
                    checked={paymentMethod === 'wave'}
                    onChange={() => setPaymentMethod('wave')}
                    className="mt-0.5 text-[#00b2e3] focus:ring-[#00b2e3]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1dc4e9] text-white flex items-center justify-center font-bold text-[10px]">
                          W
                        </span>
                        <span className="text-xs font-bold text-stone-900">Wave Sénégal</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#00b2e3]">0% de frais</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Paiement instantané par QR Code ou notification push sur votre numéro Wave.
                    </p>
                  </div>
                </label>

                {/* Orange Money Option */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'orange_money'
                      ? 'border-[#ff7900] bg-[#ff7900]/5 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="orange_money"
                    checked={paymentMethod === 'orange_money'}
                    onChange={() => setPaymentMethod('orange_money')}
                    className="mt-0.5 text-[#ff7900] focus:ring-[#ff7900]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#ff7900] text-white flex items-center justify-center font-bold text-[10px]">
                          OM
                        </span>
                        <span className="text-xs font-bold text-stone-900">Orange Money Sénégal</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#ff7900]">Code USSD #144#</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Débit direct de votre compte Orange Money avec code secret ou OTP.
                    </p>
                  </div>
                </label>

                {/* Cash on delivery */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#C4704A] bg-[#C4704A]/5 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-0.5 text-[#C4704A] focus:ring-[#C4704A]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#C4704A]" />
                        <span className="text-xs font-bold text-stone-900">Paiement à la livraison</span>
                      </div>
                      <span className="text-[11px] text-stone-500">Espèces à réception</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Payez directement au livreur à l’arrivée de votre colis à Dakar.
                    </p>
                  </div>
                </label>
              </div>

              {/* Commission disclosure (Monétisation DIGITaline) */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-stone-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-900">Transparence marketplace :</span> Une commission de 10% ({Math.round(cartSubtotal * 0.1).toLocaleString('fr-FR')} FCFA) est reversée à DIGITaline pour la maintenance et la garantie tiers de confiance. La vendeuse recevra 90% net ({Math.round(cartSubtotal * 0.9).toLocaleString('fr-FR')} FCFA).
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-xl bg-[#C4704A] hover:bg-[#A85A36] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                  <span>Procéder au paiement ({cartTotal.toLocaleString('fr-FR')} FCFA)</span>
                </button>
              </div>
            </form>
          )}

          {/* Step: Processing Wave or Orange Money Simulation */}
          {step === 'processing' && (
            <div className="space-y-5 text-center py-4">
              {paymentMethod === 'wave' ? (
                <div className="max-w-xs mx-auto p-5 rounded-2xl bg-[#00b2e3]/10 border border-[#00b2e3]/30">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1dc4e9] text-white flex items-center justify-center font-bold text-2xl shadow-md mb-3">
                    W
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Paiement Wave Sénégal</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Montant : <span className="font-bold text-stone-900 tabular-nums">{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                  </p>

                  {/* Simulated QR Code */}
                  <div className="my-4 p-4 bg-white rounded-xl shadow-xs border border-stone-200 inline-block">
                    <QrCode className="w-32 h-32 text-stone-900" />
                  </div>

                  <p className="text-[11px] text-stone-500 leading-snug">
                    Ouvrez l’application <strong className="text-stone-800">Wave</strong> sur votre smartphone pour scanner ce code ou attendez la notification push sur le <strong className="text-stone-800">+221 {customerPhone}</strong>.
                  </p>
                </div>
              ) : (
                <div className="max-w-xs mx-auto p-5 rounded-2xl bg-[#ff7900]/10 border border-[#ff7900]/30">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ff7900] text-white flex items-center justify-center font-bold text-2xl shadow-md mb-3">
                    OM
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Orange Money Sénégal</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Montant : <span className="font-bold text-stone-900 tabular-nums">{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                  </p>

                  <div className="my-4 p-3 bg-white rounded-xl border border-stone-200 text-xs font-mono font-bold text-[#ff7900]">
                    #144#391*{cartTotal}#
                  </div>

                  <p className="text-[11px] text-stone-500 leading-snug">
                    Tapez ce code sur votre téléphone Orange pour générer le code d’autorisation ou validez la demande sur l’app Orange Money.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setStep('form')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors w-full sm:w-auto justify-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Changer de mode</span>
                </button>

                <button
                  onClick={handleSimulatePaymentApproval}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-xs font-semibold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 ${
                    paymentMethod === 'wave'
                      ? 'bg-[#00b2e3] hover:bg-[#009bc5]'
                      : 'bg-[#ff7900] hover:bg-[#e06b00]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simuler le débit validé</span>
                </button>
              </div>
            </div>
          )}

          {/* Step: Success screen */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#1A1A1A]">
                  Félicitations pour votre achat !
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Commande enregistrée avec succès sous la référence{' '}
                  <strong className="text-stone-900 font-mono">#{confirmedOrderId}</strong>
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-stone-500">Destinataire :</span>
                  <span className="font-semibold text-stone-900">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Téléphone :</span>
                  <span className="font-semibold text-stone-900">+221 {customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Adresse de livraison :</span>
                  <span className="font-semibold text-stone-900 text-right">{customerCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Mode de règlement :</span>
                  <span className="font-semibold text-stone-900 uppercase">{paymentMethod}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                  <span>Total payé :</span>
                  <span className="text-[#C4704A] tabular-nums">{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 max-w-sm mx-auto">
                <p>
                  🔔 La vendeuse a été notifiée automatiquement sur son WhatsApp pour emballer et expédier votre colis dès aujourd’hui !
                </p>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-medium shadow-sm transition-all"
                >
                  Continuer mes achats sur TERANGA BEAUTY
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
