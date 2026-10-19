export type ProductCategory =
  | 'all'
  | 'perruques'
  | 'cosmetiques'
  | 'boubous'
  | 'soins'
  | 'parfums'
  | 'bijoux'
  | 'maquillage'
  | 'tissages'
  | 'habits'
  | 'mode'
  | 'chaussures'
  | 'sacs'
  | 'electronique';

export type UserRole = 'client' | 'vendor' | 'admin';

export type PaymentMethod = 'wave' | 'orange_money' | 'cod';

export type OrderStatus = 'pending_vendor_acceptance' | 'accepted' | 'rejected' | 'delivered' | 'processing';

export type VendorSubscriptionStatus = 'trial' | 'active_paid' | 'suspended';

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export type PriceRangeFilter = 'all' | '0-10000' | '10000-25000' | '25000+';
export type SizeFilter = 'all' | 'S' | 'M' | 'L' | 'XL';
export type ColorFilter = 'all' | 'terracotta' | 'dore' | 'noir' | 'beige' | 'blanc' | 'rose' | 'bleu';
export type NeighborhoodFilter = string;

export interface Product {
  id: string;
  name: string;
  price: number; // in FCFA (100% direct à la vendeuse)
  originalPrice?: number;
  promoPrice?: number;
  category: ProductCategory;
  vendorId: string;
  vendeuseId?: string;
  shopId?: string;
  sellerId?: string;
  vendorName: string;
  vendorWhatsApp: string;
  whatsappVendeuse?: string;
  vendorWave?: string;
  vendorOrangeMoney?: string;
  vendorAvatar: string;
  image: string;
  photos?: string[];
  sizes?: ('S' | 'M' | 'L' | 'XL')[];
  color?: string;
  neighborhood?: string;
  rating: number;
  reviewCount: number;
  stock: number;
  description: string;
  details?: string[];
  isBoosted?: boolean;
  status: 'approved' | 'active' | 'pending' | 'rejected';
  isApproved?: boolean;
  isVisible?: boolean;
  approvedAt?: any;
  createdAt: string;
  reviews?: Review[];
  isDemo?: boolean;
  whatsappSent?: boolean;
  whatsappSentAt?: string;
}

export type Shop = Vendor;

export interface Vendor {
  id: string;
  name: string; // Boutique: Fatou Perruques Guédiawaye
  shopName?: string;
  ownerName: string; // Nom: Fatou Diop
  phone: string; // WhatsApp: 77 123 45 67
  ownerPhone?: string;
  waveNumber: string; // Numéro Wave perso obligatoire pour recevoir 100% du paiement direct
  orangeMoneyNumber: string; // Numéro OM perso obligatoire
  neighborhood: string; // Guédiawaye (Hamo 4, Sam Notaire, Golf Sud, etc.)
  city?: string; // Dakar / Guédiawaye
  avatar: string;
  coverImage?: string;
  status: 'active' | 'suspended' | 'pending' | 'approved'; // Acceptation DIRECTE ou pending
  isApproved?: boolean;
  whatsappSent?: boolean;
  whatsappSentAt?: string;
  subscriptionStatus: VendorSubscriptionStatus; // 'trial' (30 jours gratuit) | 'active_paid' (5000F) | 'suspended'
  trialDaysRemaining: number; // Compteur: "Il vous reste X jours d'essai gratuit"
  trialStartDate?: string;
  subscriptionExpiry?: string;
  monthlySales: number; // 100% direct chez la vendeuse (l'admin ne touche jamais l'argent)
  rating: number;
  reviewCount: number;
  bio: string;
  joinedDate: string;
  creatorTag?: string; // e.g. "Vendeuse • Perruques VIP"
  categoryLabel?: string;
  badges?: string[];
  initialProductsCount?: number;
  isPro?: boolean;
  balance?: number;
  totalSales?: number;
  subscription?: string;
  proExpiry?: string;
  isDemo?: boolean;
}

export interface VendorNotification {
  id: string;
  vendorId: string;
  type:
    | 'order_received'
    | 'order_accepted'
    | 'order_rejected'
    | 'subscription_alert'
    | 'trial_expiring'
    | 'product_touch'
    | 'whatsapp_click'
    | 'cart_add'
    | 'boutique_approved'
    | 'boutique_pending'
    | 'boutique_registered';
  orderId?: string;
  productName?: string;
  productId?: string;
  productPrice?: number;
  message: string;
  timestamp: string;
  read: boolean;
  whatsappSent?: boolean;
  whatsappSentAt?: string;
}

export interface AdminNotification {
  id: string;
  type: 'new_shop' | 'new_product';
  shopId: string;
  shopName: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerId?: string;
  productName?: string;
  productImage?: string;
  price?: number;
  createdAt: any;
  status: 'pending' | 'approved' | 'rejected';
  read: boolean;
  rejectionReason?: string;
  shopLogo?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface Order {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  vendorWave: string;
  vendorOrangeMoney: string;
  items: CartItem[];
  totalAmount: number; // 100% encaissé directement par la vendeuse (0% commission)
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  paymentMethod: PaymentMethod; // 'wave' | 'orange_money' | 'cod'
  paymentStatus: 'paid_direct' | 'proof_submitted' | 'pending' | 'paid';
  paymentProofUrl?: string; // Capture d'écran Wave / Orange Money
  paymentProofName?: string;
  status: OrderStatus; // 'pending_vendor_acceptance' | 'accepted' | 'rejected' | 'delivered'
  rejectionReason?: string;
  date: string;
  createdAt: string;
  whatsAppNotified: boolean;
  commissionAmount?: number;
  transactionId?: string;
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  vendorId: string;
  vendorName: string;
  totalOrderAmount: number;
  commissionAmount: number;
  vendorPayoutAmount: number;
  date: string;
  createdAt: string;
  status: 'collected' | 'pending_payout' | 'paid';
}

export interface BoostPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  badge: string;
}

export interface ProSubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
}

export interface AdminSubscriptionConfig {
  adminWaveNumber: string;
  adminOrangeMoneyNumber: string;
  monthlyFee: number; // 5000 FCFA
}

export interface DirectMessage {
  id: string;
  chatId: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  customerPhone: string;
  sender: 'customer' | 'vendor';
  text: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  timestamp: string;
  createdAt: string;
  read: boolean;
}

export interface LiveChatMessage {
  id: string;
  authorName: string;
  authorRole: 'visitor' | 'vendor' | 'admin';
  authorQuarter?: string;
  authorAvatar?: string;
  text: string;
  timestamp: string;
  createdAt: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
}

