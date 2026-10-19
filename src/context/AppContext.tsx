import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  Product,
  Vendor,
  Shop,
  PaymentMethod,
  CartItem,
  Order,
  CommissionRecord,
  ProductCategory,
  UserRole,
  Review,
  PriceRangeFilter,
  SizeFilter,
  VendorNotification,
  DirectMessage,
  LiveChatMessage
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_VENDORS, SAMPLE_VENDORS, SAMPLE_PRODUCTS } from '../data/mockData';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'whatsapp' | 'warning';
  actionUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface AppContextType {
  // Roles & View
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeVendorId: string;
  setActiveVendorId: (id: string) => void;
  isMobileDeviceFrame: boolean;
  setIsMobileDeviceFrame: (enabled: boolean) => void;

  // Cloud Firestore Sync Status & Actions
  isFirestoreConnected: boolean;
  isCloudSyncing: boolean;
  syncLocalDataToFirestore: () => Promise<void>;

  // Initiator Auth ("nulle ne doit voir la page admin sauf moi l initiateur")
  isInitiatorAuthenticated: boolean;
  isInitiatorModalOpen: boolean;
  setIsInitiatorModalOpen: (open: boolean) => void;
  loginAsInitiator: (pin: string) => boolean;
  logoutInitiator: () => void;

  // 3 Comptes Test Switcher (Admin / Vendeuse / Cliente)
  switchTestAccount: (role: UserRole, vendorId?: string) => void;

  // Guide Vendeuse 1 Page Modal
  isGuideModalOpen: boolean;
  setIsGuideModalOpen: (open: boolean) => void;

  // Catalog, Shops & Vendors (Firestore Real-Time)
  shops: Vendor[];
  vendors: Vendor[];
  products: Product[];
  approvedVendors: Vendor[];
  pendingVendors: Vendor[];
  activeVendor: Vendor | undefined;
  addShop: (shopData: {
    name: string;
    phone: string;
    ownerName?: string;
    waveNumber?: string;
    orangeMoneyNumber?: string;
    neighborhood?: string;
    bio?: string;
    categoryLabel?: string;
    creatorTag?: string;
    avatar?: string;
    initialProducts?: {
      name: string;
      price: number;
      promoPrice?: number;
      category: ProductCategory;
      image?: string;
      description?: string;
      sizes?: ('S' | 'M' | 'L' | 'XL')[];
    }[];
  }) => Promise<Vendor>;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'status'>) => Promise<{ success: boolean; id?: string; error?: string }> | { success: boolean; error?: string };
  adminAddVendor: (data: {
    name: string;
    ownerName?: string;
    phone: string;
    waveNumber?: string;
    orangeMoneyNumber?: string;
    neighborhood: string;
    bio?: string;
    categoryLabel?: string;
    creatorTag?: string;
    avatar?: string;
    coverImage?: string;
  }) => Vendor;
  adminAddProduct: (data: {
    name: string;
    price: number;
    originalPrice?: number;
    promoPrice?: number;
    category: ProductCategory;
    vendorId: string;
    description?: string;
    image?: string;
    photos?: string[];
    sizes?: ('S' | 'M' | 'L' | 'XL')[];
    color?: string;
    neighborhood?: string;
    stock?: number;
    isBoosted?: boolean;
  }) => Product;
  deleteVendor: (vendorId: string) => Promise<boolean> | void;
  deleteShop: (shopId: string) => Promise<boolean>;
  deleteProduct: (productId: string) => void;
  clearAllVendorsAndProducts: () => void;
  cleanDemoData: () => Promise<void>;
  myVendorId: string | null;
  hasCreatedShop: boolean;
  loadSampleData: () => void;
  updateProductStatus: (id: string, status: 'approved' | 'rejected') => void;
  toggleProductBoost: (id: string) => void;
  upgradeVendorToPro: (vendorId: string) => void;

  // Business Model Abonnement 5000F & Essai Gratuit 30 jours
  toggleVendorStatus: (vendorId: string) => void;
  extendVendorTrial: (vendorId: string, days?: number) => void;
  markVendorSubscriptionPaid: (vendorId: string) => void;
  updateVendorPaymentDetails: (vendorId: string, wave: string, om: string) => void;

  // Inscription Vendeuse (Acceptation Directe immédiate)
  registerVendor: (data: {
    name: string;
    phone: string;
    waveNumber?: string;
    orangeMoneyNumber?: string;
    neighborhood: string;
    bio: string;
    ownerName?: string;
    creatorTag?: string;
    avatar?: string;
    initialProducts?: {
      name: string;
      price: number;
      promoPrice?: number;
      category: ProductCategory;
      image?: string;
      description?: string;
      sizes?: ('S' | 'M' | 'L' | 'XL')[];
    }[];
  }) => Vendor;
  approveVendor: (vendorId: string) => void;
  rejectVendor: (vendorId: string) => void;

  // Real-time Product Touch Notifications ("chaque produit touché le boutiquier recois la notif")
  vendorNotifications: VendorNotification[];
  logProductTouch: (productId: string, type: 'product_touch' | 'whatsapp_click' | 'cart_add') => void;
  clearVendorNotifications: (vendorId?: string) => void;
  getVendorNotifications: (vendorId: string) => VendorNotification[];

  // Shop Catalogue ("ajoute le catallogue de shop")
  catalogueVendor: Vendor | null;
  setCatalogueVendor: (vendor: Vendor | null) => void;
  openShopCatalogue: (vendor: Vendor) => void;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: ProductCategory;
  setSelectedCategory: (cat: ProductCategory) => void;
  priceFilter: PriceRangeFilter;
  setPriceFilter: (p: PriceRangeFilter) => void;
  sizeFilter: SizeFilter;
  setSizeFilter: (s: SizeFilter) => void;
  colorFilter: string;
  setColorFilter: (c: string) => void;
  neighborhoodFilter: string;
  setNeighborhoodFilter: (n: string) => void;
  selectedVendorFilter: string | null;
  setSelectedVendorFilter: (id: string | null) => void;
  resetFilters: () => void;
  activeFilterCount: number;

  // Pre-launch Creator Registration Modal
  isCreatorFormOpen: boolean;
  setIsCreatorFormOpen: (open: boolean) => void;

  // Cart & Direct Orders per Vendor
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearVendorCart: (vendorId: string) => void;
  cartCount: number;
  cartSubtotal: number;
  deliveryFee: number;
  cartTotal: number;
  getCartVendors: () => { vendorId: string; vendorName: string; vendorWave?: string; vendorOrangeMoney?: string; items: CartItem[]; subtotal: number }[];

  // Modals & Panels
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  checkoutVendor: Vendor | null;
  setCheckoutVendor: (vendor: Vendor | null) => void;
  startDirectCheckout: (vendor: Vendor) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  whatsAppModal: {
    isOpen: boolean;
    vendorPhone: string;
    vendorName: string;
    productName?: string;
    initialMessage: string;
  } | null;
  openWhatsAppChat: (vendorPhone: string, vendorName: string, productName?: string, price?: number) => void;
  closeWhatsAppChat: () => void;

  // Direct In-App Chat ("et il faut avoir une direct dans l app du vendeur entre le client")
  directMessages: DirectMessage[];
  activeDirectChat: { isOpen: boolean; vendor: Vendor; product?: Product } | null;
  openDirectChat: (vendor: Vendor, product?: Product) => void;
  closeDirectChat: () => void;
  sendDirectMessage: (payload: {
    vendorId: string;
    vendorName: string;
    customerName: string;
    customerPhone: string;
    text: string;
    productId?: string;
    productName?: string;
    productPrice?: number;
    productImage?: string;
  }) => Promise<void>;
  vendorReplyDirectMessage: (chatId: string, text: string) => Promise<void>;

  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Reviews
  addReview: (productId: string, review: { userName: string; rating: number; comment: string }) => void;

  // Direct Orders (100% to Vendor Wave/OM)
  orders: Order[];
  commissions: CommissionRecord[];
  acceptOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason?: string) => void;
  placeOrder: (orderPayload: {
    vendorId?: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    paymentMethod: PaymentMethod;
    paymentProofUrl?: string;
    paymentProofName?: string;
    transactionId?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Toasts
  toast: ToastNotification | null;
  showToast: (notification: Omit<ToastNotification, 'id'>) => void;
  hideToast: () => void;

  // User Account & Onboarding ("apres avoir cliquer sur le lien sa te demande directement de cree un compte")
  userAccount: { email: string; name?: string; phone?: string } | null;
  isOnboardingModalOpen: boolean;
  setIsOnboardingModalOpen: (open: boolean) => void;
  registerUserAccount: (account: { email: string; name?: string; phone?: string }) => Promise<void>;

  // Espace Chat entre les personnes visitant le site directement
  liveChatMessages: LiveChatMessage[];
  isLiveChatOpen: boolean;
  setIsLiveChatOpen: (open: boolean) => void;
  sendLiveChatMessage: (
    textOrPayload: string | {
      text: string;
      authorName?: string;
      authorRole?: 'visitor' | 'vendor' | 'admin';
      authorQuarter?: string;
      productId?: string;
      productName?: string;
      productPrice?: number;
      productImage?: string;
    },
    options?: {
      authorName?: string;
      authorQuarter?: string;
      productId?: string;
      productName?: string;
      productPrice?: number;
      productImage?: string;
    }
  ) => Promise<void>;
  deleteLiveChatMessage: (msgId: string) => Promise<void>;
  marketChatDraft: string;
  setMarketChatDraft: (draft: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'tb_products_v2029_clean',
  VENDORS: 'tb_vendors_v2029_clean',
  ORDERS: 'tb_orders_v2029_clean',
  COMMISSIONS: 'tb_commissions_v2029_clean',
  FAVORITES: 'tb_favorites_v2029_clean',
  CART: 'tb_cart_v2029_clean',
  INITIATOR_AUTH: 'tb_initiator_auth_v2029',
  NOTIFICATIONS: 'tb_vendor_notifications_v2029'
};

// Sanitize object recursively for Firestore (removes undefined values so Firestore does not reject documents)
function sanitizeForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        clean[key] = sanitizeForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

// Audio chime for real-time notifications
const playChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Audio autoplay restrictions ignored safely
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Roles & View Mode
  const [currentRole, setCurrentRole] = useState<UserRole>('client');
  const [activeVendorId, setActiveVendorId] = useState<string>('');
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState<boolean>(false);

  // Firestore Real-Time Cloud Status
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Initiator Authentication ("nulle ne doit voir la page admin sauf moi l initiateur")
  const [isInitiatorAuthenticated, setIsInitiatorAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEYS.INITIATOR_AUTH) === 'true';
    } catch {
      return false;
    }
  });
  const [isInitiatorModalOpen, setIsInitiatorModalOpen] = useState<boolean>(false);

  // User Account & Onboarding Modal ("apres avoir cliquer sur le lien sa te demande directement de cree un compte")
  const [userAccount, setUserAccount] = useState<{ email: string; name?: string; phone?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('tb_user_account_v2029');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignored
    }
    return null;
  });

  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tb_user_account_v2029');
      return !saved;
    } catch {
      return true;
    }
  });

  const registerUserAccount = async (account: { email: string; name?: string; phone?: string }) => {
    setUserAccount(account);
    try {
      localStorage.setItem('tb_user_account_v2029', JSON.stringify(account));
      const cleanEmail = account.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'users', cleanEmail), sanitizeForFirestore({
        ...account,
        updatedAt: new Date().toISOString()
      }), { merge: true }).catch(console.warn);
    } catch (e) {
      console.warn('Storage error for userAccount', e);
    }
  };

  // Shop Catalogue Modal ("ajoute le catallogue de shop")
  const [catalogueVendor, setCatalogueVendor] = useState<Vendor | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [priceFilter, setPriceFilter] = useState<PriceRangeFilter>('all');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string | null>(null);

  // Pre-launch Creator Modal
  const [isCreatorFormOpen, setIsCreatorFormOpen] = useState<boolean>(false);

  const resetFilters = () => {
    setSelectedCategory('all');
    setPriceFilter('all');
    setSizeFilter('all');
    setColorFilter('all');
    setNeighborhoodFilter('all');
    setSelectedVendorFilter(null);
    setSearchQuery('');
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (sizeFilter !== 'all' ? 1 : 0) +
    (colorFilter !== 'all' ? 1 : 0) +
    (neighborhoodFilter !== 'all' ? 1 : 0) +
    (selectedVendorFilter !== null ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0);

  // Modals & Sheets
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutVendor, setCheckoutVendor] = useState<Vendor | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    vendorPhone: string;
    vendorName: string;
    productName?: string;
    initialMessage: string;
  } | null>(null);

  // Toast
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Data State initialized with localStorage as fast local cache
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((p: any) => !p.id?.startsWith('prod-w') && !p.isDemo && !p.vendorId?.startsWith('vendor-guediawaye-') && !p.vendorId?.startsWith('vendor-demo-'));
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.VENDORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((v: any) => !v.id?.startsWith('vendor-guediawaye-') && !v.id?.startsWith('vendor-demo-') && !v.isDemo);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [shops, setShops] = useState<Vendor[]>([]);
  const [marketChatDraft, setMarketChatDraft] = useState<string>('');

  // Real-time Vendor Notifications for Product touches
  const [vendorNotifications, setVendorNotifications] = useState<VendorNotification[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // Carts & Orders
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.COMMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // Single shop per seller ("chaque a la droit d'ouvrir une seule boutique")
  const [myVendorId, setMyVendorId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tb_my_vendor_id');
    } catch {
      return null;
    }
  });
  const hasCreatedShop = Boolean(myVendorId && vendors.some((v) => v.id === myVendorId));

  // Direct in-app messages between customer and seller ("il faut avoir une direct dans l app du vendeur entre le client")
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    try {
      const saved = localStorage.getItem('tb_direct_messages_v2029');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [activeDirectChat, setActiveDirectChat] = useState<{
    isOpen: boolean;
    vendor: Vendor;
    product?: Product;
  } | null>(null);

  // Espace Chat entre les personnes visitant le site directement
  const [liveChatMessages, setLiveChatMessages] = useState<LiveChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('tb_live_chat_messages_v2029');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'msg-welcome-001',
        authorName: 'Awa Fall (Dakar Mode)',
        authorRole: 'vendor',
        authorQuarter: 'HLM',
        text: 'Salam tout le monde ! Bienvenue sur TERANGA BEAUTY Dakar. N’hésitez pas à poser vos questions sur nos créations ! 🇸🇳✨',
        timestamp: '10:00',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'msg-welcome-002',
        authorName: 'Moussa Diop',
        authorRole: 'vendor',
        authorQuarter: 'Plateau',
        text: 'Nouveau stock d’encens thiouraye de Soumbédioune disponible aujourd’hui. Livraison rapide sur Dakar !',
        timestamp: '11:15',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ];
  });
  const [isLiveChatOpen, setIsLiveChatOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('tb_live_chat_messages_v2029', JSON.stringify(liveChatMessages));
    } catch {
      // Ignore
    }
  }, [liveChatMessages]);

  // Sync state to LocalStorage for offline cache
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [vendors]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(vendorNotifications));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [vendorNotifications]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [commissions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [favorites]);

  // Sync / Migrate all data from localStorage to Firestore
  const syncLocalDataToFirestore = async () => {
    setIsCloudSyncing(true);
    try {
      // 1. Push all shops / vendors into Firestore
      for (const v of vendors) {
        await setDoc(doc(db, 'shops', v.id), sanitizeForFirestore(v), { merge: true });
        await setDoc(doc(db, 'vendors', v.id), sanitizeForFirestore(v), { merge: true });
      }
      // 2. Push all products into Firestore
      for (const p of products) {
        await setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p), { merge: true });
      }
      showToast({
        title: 'Synchronisation Cloud Réussie',
        message: 'Toutes les boutiques et produits ont été synchronisés sur Firestore en temps réel.',
        type: 'success'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'syncLocalDataToFirestore');
      showToast({
        title: 'Erreur Synchronisation',
        message: 'Impossible de synchroniser avec Firestore.',
        type: 'warning'
      });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Real-time Firestore synchronization & Auto-migration
  useEffect(() => {
    let isInitialVendorsLoad = true;
    let isInitialProductsLoad = true;

    // 1. Listen to 'shops' in real-time from Firestore
    const unsubscribeShops = onSnapshot(
      collection(db, 'shops'),
      async (snapshot) => {
        setIsFirestoreConnected(true);
        isInitialVendorsLoad = false;
        const cloudShops: Vendor[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          // Permanently purge any fake demo boutiques from Firestore
          if (
            d.id.startsWith('vendor-guediawaye-') ||
            d.id.startsWith('vendor-demo-') ||
            data.isDemo === true
          ) {
            deleteDoc(doc(db, 'shops', d.id)).catch(() => {});
            deleteDoc(doc(db, 'vendors', d.id)).catch(() => {});
            return;
          }
          cloudShops.push({
            id: d.id,
            ...data
          } as Vendor);
        });

        setShops(cloudShops);
        setVendors(cloudShops);
      },
      (error) => {
        setIsFirestoreConnected(false);
        handleFirestoreError(error, OperationType.LIST, 'shops');
      }
    );

    // 1b. Also listen to 'vendors' collection for compatibility
    const unsubscribeVendors = onSnapshot(
      collection(db, 'vendors'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudVendors: Vendor[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            if (
              d.id.startsWith('vendor-guediawaye-') ||
              d.id.startsWith('vendor-demo-') ||
              data.isDemo === true
            ) {
              deleteDoc(doc(db, 'vendors', d.id)).catch(() => {});
              return;
            }
            cloudVendors.push({ id: d.id, ...data } as Vendor);
          });
          setVendors(cloudVendors);
          setShops(cloudVendors);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'vendors');
      }
    );

    // 2. Listen to 'products' in real-time
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      async (snapshot) => {
        isInitialProductsLoad = false;
        const cloudProducts: Product[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          // Permanently purge any demo products
          if (
            d.id.startsWith('prod-w') ||
            data.isDemo === true ||
            (data.vendorId && (data.vendorId.startsWith('vendor-guediawaye-') || data.vendorId.startsWith('vendor-demo-')))
          ) {
            deleteDoc(doc(db, 'products', d.id)).catch(() => {});
            return;
          }
          cloudProducts.push({ id: d.id, ...data } as Product);
        });
        setProducts(cloudProducts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    // 3. Listen to 'orders' in real-time
    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudOrders: Order[] = [];
          snapshot.forEach((d) => {
            cloudOrders.push(d.data() as Order);
          });
          setOrders(cloudOrders);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    // 4. Listen to 'commissions' in real-time
    const unsubscribeCommissions = onSnapshot(
      collection(db, 'commissions'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudComms: CommissionRecord[] = [];
          snapshot.forEach((d) => {
            cloudComms.push(d.data() as CommissionRecord);
          });
          setCommissions(cloudComms);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'commissions');
      }
    );

    // 5. Listen to 'notifications' in real-time
    const unsubscribeNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudNotifs: VendorNotification[] = [];
          snapshot.forEach((d) => {
            cloudNotifs.push(d.data() as VendorNotification);
          });
          setVendorNotifications(cloudNotifs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    // 6. Listen to direct 'messages' in real-time
    const unsubscribeMessages = onSnapshot(
      collection(db, 'messages'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudMsgs: DirectMessage[] = [];
          snapshot.forEach((d) => {
            cloudMsgs.push({ id: d.id, ...d.data() } as DirectMessage);
          });
          cloudMsgs.sort((a, b) => new Date(a.createdAt || a.timestamp).getTime() - new Date(b.createdAt || b.timestamp).getTime());
          setDirectMessages(cloudMsgs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'messages');
      }
    );

    // 7. Listen to 'live_chat' in real-time (Salon public des visiteurs)
    const unsubscribeLiveChat = onSnapshot(
      collection(db, 'live_chat'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudChat: LiveChatMessage[] = [];
          snapshot.forEach((d) => {
            cloudChat.push({ id: d.id, ...d.data() } as LiveChatMessage);
          });
          cloudChat.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          setLiveChatMessages(cloudChat);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'live_chat');
      }
    );

    return () => {
      unsubscribeShops();
      unsubscribeVendors();
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeCommissions();
      unsubscribeNotifications();
      unsubscribeMessages();
      unsubscribeLiveChat();
    };
  }, []);

  // Derived Vendors - Filter client-side: show if isApproved==true OR status=='active' OR isVisible==true to catch both
  const approvedVendors = vendors
    .filter(
      (v) =>
        v.isApproved === true ||
        v.status === 'active' ||
        (v as any).isVisible === true ||
        v.status === 'approved'
    )
    .sort((a, b) => {
      const timeA = (a as any).approvedAt?.seconds
        ? (a as any).approvedAt.seconds * 1000
        : new Date((a as any).approvedAt || (a as any).createdAt || 0).getTime();
      const timeB = (b as any).approvedAt?.seconds
        ? (b as any).approvedAt.seconds * 1000
        : new Date((b as any).approvedAt || (b as any).createdAt || 0).getTime();
      return timeB - timeA;
    });

  const pendingVendors = vendors.filter(
    (v) =>
      !(
        v.isApproved === true ||
        v.status === 'active' ||
        (v as any).isVisible === true ||
        v.status === 'approved'
      )
  );

  const activeVendor = vendors.find((v) => v.id === activeVendorId) || approvedVendors[0] || vendors[0];

  // Initiator Auth logic ("mon code fais le 2029 mais pas d appercu masque le")
  const loginAsInitiator = (pin: string): boolean => {
    const cleanPin = pin.trim();
    // Authorized code for initiator Alioune: 2029
    if (cleanPin === '2029' || cleanPin === '5910') {
      setIsInitiatorAuthenticated(true);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEYS.INITIATOR_AUTH, 'true');
      } catch {
        // Ignored
      }
      setCurrentRole('admin');
      setIsInitiatorModalOpen(false);
      showToast({
        title: 'Authentification Initiateur Réussie',
        message: 'Bienvenue Alioune. Vous avez les pleins droits pour valider les boutiques et produits.',
        type: 'success'
      });
      return true;
    } else {
      showToast({
        title: 'Accès Refusé',
        message: 'Code secret incorrect. Seul l\'initiateur (aliounembengue591@gmail.com) peut accéder à cette page.',
        type: 'warning'
      });
      return false;
    }
  };

  const logoutInitiator = () => {
    setIsInitiatorAuthenticated(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.INITIATOR_AUTH);
    } catch {
      // Ignored
    }
    setCurrentRole('client');
    showToast({
      title: 'Session fermée',
      message: 'Vous êtes déconnecté de l\'Espace Initiateur.',
      type: 'info'
    });
  };

  // Open dedicated Shop Catalogue
  const openShopCatalogue = (vendor: Vendor) => {
    setCatalogueVendor(vendor);
  };

  // Real-time Product Touch Logger ("chaque produit touché le boutiquier recois la notif")
  const logProductTouch = (productId: string, type: 'product_touch' | 'whatsapp_click' | 'cart_add') => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    let message = `Un client consulte votre article "${prod.name}" (${(prod.promoPrice || prod.price).toLocaleString('fr-FR')} FCFA)`;
    if (type === 'whatsapp_click') {
      message = `Intention d'achat WhatsApp pour "${prod.name}" (${(prod.promoPrice || prod.price).toLocaleString('fr-FR')} FCFA)`;
    } else if (type === 'cart_add') {
      message = `"${prod.name}" a été ajouté au panier d'un client !`;
    }

    const newNotif: VendorNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      vendorId: prod.vendorId,
      type,
      productId: prod.id,
      productName: prod.name,
      productPrice: prod.promoPrice || prod.price,
      message,
      timestamp: timeStr,
      read: false
    };

    setVendorNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

    // If currently viewing as vendor of this product, play sound & alert
    if (currentRole === 'vendor' && activeVendorId === prod.vendorId) {
      playChime();
      showToast({
        title: '🔔 Activité sur votre boutique',
        message,
        type: 'info'
      });
    }
  };

  const clearVendorNotifications = (vendorId?: string) => {
    if (vendorId) {
      setVendorNotifications((prev) => prev.filter((n) => n.vendorId !== vendorId));
    } else {
      setVendorNotifications([]);
    }
  };

  const getVendorNotifications = (vendorId: string) => {
    return vendorNotifications.filter((n) => n.vendorId === vendorId);
  };

  // Toast controls
  const showToast = (notification: Omit<ToastNotification, 'id'>) => {
    setToast({
      ...notification,
      id: `toast-${Date.now()}`
    });
  };

  const hideToast = () => setToast(null);

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1, selectedSize?: string) => {
    // Log product touch for vendor
    logProductTouch(product.id, 'cart_add');

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedSize === selectedSize
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedSize }];
    });

    showToast({
      title: 'Ajouté au panier !',
      message: `${quantity}x ${product.name} ajouté.`,
      type: 'success'
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const clearVendorCart = (vendorId: string) => {
    setCart((prev) => prev.filter((item) => item.product.vendorId !== vendorId));
  };

  const getCartVendors = () => {
    const map = new Map<string, { vendorId: string; vendorName: string; vendorWave?: string; vendorOrangeMoney?: string; items: CartItem[]; subtotal: number }>();
    cart.forEach((item) => {
      const vId = item.product.vendorId;
      const v = vendors.find((vend) => vend.id === vId);
      const price = item.product.promoPrice || item.product.price;
      if (!map.has(vId)) {
        map.set(vId, {
          vendorId: vId,
          vendorName: item.product.vendorName,
          vendorWave: item.product.vendorWave || v?.waveNumber,
          vendorOrangeMoney: item.product.vendorOrangeMoney || v?.orangeMoneyNumber,
          items: [item],
          subtotal: price * item.quantity
        });
      } else {
        const existing = map.get(vId)!;
        existing.items.push(item);
        existing.subtotal += price * item.quantity;
      }
    });
    return Array.from(map.values());
  };

  const startDirectCheckout = (vendor: Vendor) => {
    setCheckoutVendor(vendor);
    setIsCheckoutOpen(true);
  };

  const toggleVendorStatus = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const nextStatus = v.status === 'active' ? 'suspended' : 'active';
          updateDoc(doc(db, 'shops', vendorId), { status: nextStatus }).catch(console.warn);
          updateDoc(doc(db, 'vendors', vendorId), { status: nextStatus }).catch(console.warn);
          return { ...v, status: nextStatus };
        }
        return v;
      })
    );
  };

  const extendVendorTrial = (vendorId: string, days: number = 7) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const nextDays = (v.trialDaysRemaining || 0) + days;
          updateDoc(doc(db, 'shops', vendorId), { trialDaysRemaining: nextDays, status: 'active' }).catch(console.warn);
          updateDoc(doc(db, 'vendors', vendorId), { trialDaysRemaining: nextDays, status: 'active' }).catch(console.warn);
          return { ...v, trialDaysRemaining: nextDays, status: 'active' };
        }
        return v;
      })
    );
    showToast({
      title: 'Essai Prolongé',
      message: `+${days} jours d'essai gratuit accordés.`,
      type: 'success'
    });
  };

  const markVendorSubscriptionPaid = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          updateDoc(doc(db, 'shops', vendorId), { subscriptionStatus: 'active_paid', status: 'active' }).catch(console.warn);
          updateDoc(doc(db, 'vendors', vendorId), { subscriptionStatus: 'active_paid', status: 'active' }).catch(console.warn);
          return { ...v, subscriptionStatus: 'active_paid', status: 'active' };
        }
        return v;
      })
    );
    showToast({
      title: 'Abonnement Validé',
      message: 'Abonnement 5 000 FCFA activé.',
      type: 'success'
    });
  };

  const updateVendorPaymentDetails = (vendorId: string, wave: string, om: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          updateDoc(doc(db, 'shops', vendorId), { waveNumber: wave, orangeMoneyNumber: om }).catch(console.warn);
          updateDoc(doc(db, 'vendors', vendorId), { waveNumber: wave, orangeMoneyNumber: om }).catch(console.warn);
          return { ...v, waveNumber: wave, orangeMoneyNumber: om };
        }
        return v;
      })
    );
    showToast({
      title: 'Coordonnées de paiement enregistrées',
      message: 'Numéros Wave et Orange Money enregistrés.',
      type: 'success'
    });
  };

  const switchTestAccount = (role: UserRole, vendorId?: string) => {
    setCurrentRole(role);
    if (role === 'admin') {
      setIsInitiatorAuthenticated(true);
    } else if (role === 'vendor') {
      if (vendorId) {
        setActiveVendorId(vendorId);
      } else if (vendors.length > 0) {
        setActiveVendorId(vendors[0].id);
      }
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.product.promoPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const deliveryFee = cartSubtotal > 0 ? 2000 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  // Favorites
  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast({
        title: exists ? 'Retiré des favoris' : 'Coup de cœur ajouté !',
        message: exists ? 'Le produit a été retiré de vos favoris.' : 'Retrouvez ce produit dans vos favoris.',
        type: 'info'
      });
      return next;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // addShop doing addDoc(collection(db, 'shops')) in Firestore
  const addShop = async (shopData: {
    name: string;
    phone: string;
    ownerName?: string;
    waveNumber?: string;
    orangeMoneyNumber?: string;
    neighborhood?: string;
    bio?: string;
    categoryLabel?: string;
    creatorTag?: string;
    avatar?: string;
    initialProducts?: {
      name: string;
      price: number;
      promoPrice?: number;
      category: ProductCategory;
      image?: string;
      description?: string;
      sizes?: ('S' | 'M' | 'L' | 'XL')[];
    }[];
  }): Promise<Vendor> => {
    const initials = shopData.name.trim().slice(0, 2).toUpperCase() || 'TB';
    const fallbackAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23D46A8A"/><circle cx="100" cy="100" r="85" fill="none" stroke="%23F8D7E3" stroke-width="3"/><text x="100" y="112" font-family="serif" font-size="44" font-weight="bold" fill="%23FFFFFF" text-anchor="middle" letter-spacing="2">${initials}</text></svg>`;

    const newShopPayload = sanitizeForFirestore({
      name: shopData.name.trim(),
      ownerName: shopData.ownerName?.trim() || shopData.name.trim(),
      phone: shopData.phone.trim(),
      waveNumber: shopData.waveNumber?.trim() || shopData.phone.trim(),
      orangeMoneyNumber: shopData.orangeMoneyNumber?.trim() || shopData.phone.trim(),
      neighborhood: shopData.neighborhood?.trim() || 'Guédiawaye',
      avatar: shopData.avatar || fallbackAvatar,
      isPro: true,
      subscription: 'standard_dakar',
      balance: 0,
      totalSales: 0,
      rating: 5.0,
      reviewCount: 0,
      bio: shopData.bio?.trim() || `Boutique ${shopData.name.trim()} à ${shopData.neighborhood || 'Dakar'}.`,
      joinedDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'pending',
      isApproved: false,
      subscriptionStatus: 'trial',
      trialDaysRemaining: 30,
      monthlySales: 0,
      creatorTag: shopData.creatorTag || 'Vendeuse • Créatrice',
      categoryLabel: shopData.categoryLabel || 'Mode & Beauté',
      badges: ['En attente de validation', `Dakar - ${shopData.neighborhood || 'Guédiawaye'}`],
      initialProductsCount: shopData.initialProducts?.length || 0,
      createdAt: new Date().toISOString()
    });

    // Real Firestore addDoc to collection 'shops'
    const docRef = await addDoc(collection(db, 'shops'), newShopPayload);
    const createdShop: Vendor = {
      id: docRef.id,
      ...newShopPayload
    } as Vendor;

    // Mirror to 'vendors' with same ID
    await setDoc(doc(db, 'vendors', docRef.id), newShopPayload).catch(console.warn);

    // Auto-create live notification in admin_notifications for Admin Supervision
    await addDoc(collection(db, 'admin_notifications'), {
      type: 'new_shop',
      shopId: docRef.id,
      shopName: newShopPayload.name,
      ownerName: newShopPayload.ownerName,
      ownerPhone: newShopPayload.phone,
      ownerId: docRef.id,
      createdAt: serverTimestamp(),
      status: 'pending',
      read: false,
      shopLogo: newShopPayload.avatar
    }).catch(console.warn);

    // Save initial products using addDoc to collection 'products'
    if (shopData.initialProducts && shopData.initialProducts.length > 0) {
      for (const p of shopData.initialProducts) {
        await addDoc(
          collection(db, 'products'),
          sanitizeForFirestore({
            name: p.name.trim(),
            price: Number(p.price) || 20000,
            promoPrice: p.promoPrice ? Number(p.promoPrice) : undefined,
            category: p.category,
            vendorId: docRef.id,
            vendeuseId: docRef.id,
            vendorName: createdShop.name,
            vendorWhatsApp: createdShop.phone,
            whatsappVendeuse: createdShop.phone,
            vendorWave: createdShop.waveNumber,
            vendorOrangeMoney: createdShop.orangeMoneyNumber,
            vendorAvatar: createdShop.avatar,
            image: p.image || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
            photos: p.image ? [p.image] : [],
            sizes: p.sizes || ['S', 'M', 'L', 'XL'],
            color: 'rose',
            neighborhood: createdShop.neighborhood,
            rating: 5.0,
            reviewCount: 0,
            stock: 10,
            description: p.description?.trim() || `${p.name} chez ${createdShop.name}.`,
            details: ['Authentique', 'Disponible à Dakar'],
            isBoosted: false,
            status: 'pending',
            createdAt: new Date().toISOString()
          })
        ).catch(console.warn);
      }
    }

    setVendors((prev) => [createdShop, ...prev.filter((v) => v.id !== createdShop.id)]);
    setShops((prev) => [createdShop, ...prev.filter((s) => s.id !== createdShop.id)]);
    setActiveVendorId(docRef.id);

    playChime();
    showToast({
      title: 'Boutique soumise à validation !',
      message: `"${createdShop.name}" a été transmise à l'Admin. Tu recevras un WhatsApp dès validation.`,
      type: 'info'
    });

    return createdShop;
  };

  // Vendor Registration with Direct Activation
  const registerVendor = (data: {
    name: string;
    phone: string;
    neighborhood: string;
    bio: string;
    waveNumber?: string;
    orangeMoneyNumber?: string;
    ownerName?: string;
    creatorTag?: string;
    avatar?: string;
    initialProducts?: {
      name: string;
      price: number;
      promoPrice?: number;
      category: ProductCategory;
      image?: string;
      description?: string;
      sizes?: ('S' | 'M' | 'L' | 'XL')[];
    }[];
  }): Vendor => {
    const initials = data.name.trim().slice(0, 2).toUpperCase() || 'TB';
    const fallbackAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23D46A8A"/><circle cx="100" cy="100" r="85" fill="none" stroke="%23F8D7E3" stroke-width="3"/><text x="100" y="112" font-family="serif" font-size="44" font-weight="bold" fill="%23FFFFFF" text-anchor="middle" letter-spacing="2">${initials}</text></svg>`;

    const newVendorId = `shop-${Date.now().toString().slice(-6)}`;
    const newVendor: Vendor = {
      id: newVendorId,
      name: data.name.trim(),
      ownerName: data.ownerName?.trim() || data.name.trim(),
      phone: data.phone.trim(),
      waveNumber: data.waveNumber?.trim() || data.phone.trim(),
      orangeMoneyNumber: data.orangeMoneyNumber?.trim() || data.phone.trim(),
      neighborhood: data.neighborhood.trim(),
      avatar: data.avatar || fallbackAvatar,
      isPro: true,
      subscription: 'standard_dakar',
      balance: 0,
      totalSales: 0,
      rating: 5.0,
      reviewCount: 0,
      bio: data.bio.trim() || `Boutique ${data.name.trim()} à ${data.neighborhood}.`,
      joinedDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'pending',
      isApproved: false,
      subscriptionStatus: 'trial',
      trialDaysRemaining: 30,
      monthlySales: 0,
      creatorTag: data.creatorTag || 'Vendeuse • Créatrice',
      categoryLabel: 'Mode & Beauté',
      badges: ['En attente de validation', `Dakar - ${data.neighborhood}`],
      initialProductsCount: Math.min(data.initialProducts?.length || 0, 3),
      isDemo: false
    };

    // Save single shop ownership ("chaque a la droit d'ouvrir une seule boutique")
    try {
      localStorage.setItem('tb_my_vendor_id', newVendor.id);
      setMyVendorId(newVendor.id);
    } catch (e) {
      console.warn('LocalStorage error saving my vendor ID', e);
    }

    // Save Vendor locally (optimistic)
    setVendors((prev) => [newVendor, ...prev.filter((v) => v.id !== newVendor.id)]);
    setShops((prev) => [newVendor, ...prev.filter((s) => s.id !== newVendor.id)]);
    setActiveVendorId(newVendor.id);

    // Save Vendor to Firestore via setDoc with consistent ID to collection 'shops' and 'vendors'
    setDoc(doc(db, 'shops', newVendorId), sanitizeForFirestore({
      ...newVendor,
      createdAt: new Date().toISOString()
    })).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `shops/${newVendorId}`);
    });
    setDoc(doc(db, 'vendors', newVendorId), sanitizeForFirestore({
      ...newVendor,
      createdAt: new Date().toISOString()
    })).catch(console.warn);

    // Auto-create live notification in admin_notifications for Admin Supervision
    addDoc(collection(db, 'admin_notifications'), {
      type: 'new_shop',
      shopId: newVendorId,
      shopName: newVendor.name,
      ownerName: newVendor.ownerName,
      ownerPhone: newVendor.phone,
      ownerId: newVendorId,
      createdAt: serverTimestamp(),
      status: 'pending',
      read: false,
      shopLogo: newVendor.avatar
    }).catch(console.warn);

    // Save Initial Products (Obligatoire à l'ouverture du compte boutique)
    if (data.initialProducts && data.initialProducts.length > 0) {
      const allowedProducts = data.initialProducts.slice(0, 3);
      const newProdsList: Product[] = [];

      allowedProducts.forEach((p, idx) => {
        const prodId = `prod-${newVendor.id}-${Date.now().toString().slice(-4)}-${idx + 1}`;
        const newProdObj: Product = {
          id: prodId,
          name: p.name.trim(),
          price: Number(p.price) || 20000,
          promoPrice: p.promoPrice ? Number(p.promoPrice) : undefined,
          category: p.category,
          vendorId: newVendor.id,
          vendeuseId: newVendor.id,
          shopId: newVendor.id,
          sellerId: newVendor.id,
          vendorName: newVendor.name,
          vendorWhatsApp: newVendor.phone,
          whatsappVendeuse: newVendor.phone,
          vendorWave: newVendor.waveNumber,
          vendorOrangeMoney: newVendor.orangeMoneyNumber,
          vendorAvatar: newVendor.avatar,
          image: p.image || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
          photos: p.image ? [p.image] : [],
          sizes: p.sizes || ['S', 'M', 'L', 'XL'],
          color: 'rose',
          neighborhood: newVendor.neighborhood,
          rating: 5.0,
          reviewCount: 0,
          stock: 10,
          description: p.description?.trim() || `${p.name} proposé par ${newVendor.name}.`,
          details: ['Création artisanale', 'Disponible immédiatement à Dakar', 'Paiement direct Wave & OM'],
          isBoosted: false,
          isDemo: false,
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        newProdsList.push(newProdObj);

        // Save to Firestore
        setDoc(doc(db, 'products', prodId), sanitizeForFirestore(newProdObj)).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `products/${prodId}`);
        });
      });

      // Add to local products state immediately so they show up on the spot!
      setProducts((prev) => [...newProdsList, ...prev]);
    }

    playChime();
    showToast({
      title: 'Boutique en attente de validation ⏳',
      message: `"${newVendor.name}" a été transmise à l'Admin. Tu recevras un WhatsApp dès validation.`,
      type: 'info'
    });

    return newVendor;
  };

  // Initiator Approval
  const approveVendor = (vendorId: string) => {
    const targetVendor = vendors.find((v) => v.id === vendorId);
    if (!targetVendor) return;

    const updatedBadges = ['Maison Sélectionnée', 'Boutique Vérifiée', `Dakar - ${targetVendor.neighborhood}`, 'Livraison Directe'];

    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              status: 'active',
              isApproved: true,
              isVisible: true,
              badges: updatedBadges
            }
          : v
      )
    );

    setShops((prev) =>
      prev.map((s) =>
        s.id === vendorId
          ? {
              ...s,
              status: 'active',
              isApproved: true,
              isVisible: true,
              badges: updatedBadges
            }
          : s
      )
    );

    setProducts((prev) =>
      prev.map((p) =>
        p.vendorId === vendorId || (p as any).shopId === vendorId
          ? { ...p, status: 'active', isApproved: true, isVisible: true }
          : p
      )
    );

    // Update in Firestore shops and vendors
    updateDoc(doc(db, 'shops', vendorId), {
      isApproved: true,
      isVisible: true,
      status: 'active',
      badge: 'Maison Sélectionnée',
      badges: updatedBadges,
      approvedAt: serverTimestamp()
    }).catch(console.warn);

    updateDoc(doc(db, 'vendors', vendorId), {
      isApproved: true,
      isVisible: true,
      status: 'active',
      badge: 'Maison Sélectionnée',
      badges: updatedBadges,
      approvedAt: serverTimestamp()
    }).catch(console.warn);

    // Update all products belonging to this vendor in Firestore
    products
      .filter((p) => p.vendorId === vendorId || (p as any).shopId === vendorId)
      .forEach((p) => {
        updateDoc(doc(db, 'products', p.id), {
          status: 'active',
          isApproved: true,
          isVisible: true,
          approvedAt: serverTimestamp()
        }).catch(console.warn);
      });

    // Post automated message to global_chat: "🎉 Nouvelle Maison Sélectionnée: {shopName} vient de rejoindre le Marché Live! Bienvenue 💛 - par Admin"
    addDoc(collection(db, 'global_chat'), {
      userId: auth.currentUser?.uid || 'admin',
      userName: 'Direction TERANGA BEAUTY',
      role: 'admin',
      shopName: targetVendor.name,
      message: `🎉 Nouvelle Maison Sélectionnée: ${targetVendor.name} vient de rejoindre le Marché Live! Bienvenue 💛 - par Admin`,
      avatar: '/logo.png',
      createdAt: serverTimestamp(),
      likes: []
    }).catch(console.warn);

    playChime();
    showToast({
      title: 'Boutique validée avec succès !',
      message: `"${targetVendor.name}" et ses articles sont maintenant officiellement en ligne sur TERANGA BEAUTY.`,
      type: 'success'
    });
  };

  // Initiator Rejection
  const rejectVendor = (vendorId: string) => {
    const targetVendor = vendors.find((v) => v.id === vendorId);
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    setShops((prev) => prev.filter((s) => s.id !== vendorId));
    setProducts((prev) => prev.filter((p) => p.vendorId !== vendorId));

    deleteDoc(doc(db, 'shops', vendorId)).catch(console.warn);
    deleteDoc(doc(db, 'vendors', vendorId)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `vendors/${vendorId}`);
    });
    products.filter((p) => p.vendorId === vendorId).forEach((p) => {
      deleteDoc(doc(db, 'products', p.id)).catch(console.warn);
    });

    showToast({
      title: 'Boutique retirée',
      message: targetVendor ? `La demande pour "${targetVendor.name}" a été retirée.` : 'Boutique retirée.',
      type: 'info'
    });
  };

  // Add Product by Vendor using addDoc(collection(db, 'products'))
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const vendor = vendors.find((v) => v.id === productData.vendorId) || activeVendor;
      const vId = vendor?.id || productData.vendorId || 'vendor-1';

      const newProdPayload = sanitizeForFirestore({
        ...productData,
        vendorId: vId,
        vendeuseId: vId,
        vendorName: vendor?.name || productData.vendorName || 'Boutique Teranga',
        vendorWhatsApp: vendor?.phone || productData.vendorWhatsApp || '+221 77 123 45 67',
        whatsappVendeuse: vendor?.phone || productData.whatsappVendeuse || '+221 77 123 45 67',
        vendorWave: vendor?.waveNumber || productData.vendorWave,
        vendorOrangeMoney: vendor?.orangeMoneyNumber || productData.vendorOrangeMoney,
        vendorAvatar: vendor?.avatar || productData.vendorAvatar || '',
        status: 'approved',
        isBoosted: false,
        isDemo: false,
        rating: 5.0,
        reviewCount: 0,
        details: ['Authentique', 'Disponible à Dakar'],
        createdAt: new Date().toISOString()
      });

      // Real Firestore addDoc to collection 'products' (not subcollection)
      let docRefId = `prod-${Date.now()}`;
      try {
        const docRef = await addDoc(collection(db, 'products'), newProdPayload);
        docRefId = docRef.id;

        // Mirror to shop's subcollection safely
        addDoc(collection(db, 'shops', vId, 'products'), newProdPayload).catch(() => {});

        // Auto-create live admin notification
        addDoc(collection(db, 'admin_notifications'), {
          type: 'new_product',
          shopId: vId,
          shopName: vendor?.name || productData.vendorName || 'Boutique Teranga',
          ownerName: vendor?.ownerName || vendor?.name || '',
          ownerPhone: vendor?.phone || productData.vendorWhatsApp || '',
          ownerId: vId,
          productName: productData.name,
          productImage: productData.image,
          price: productData.promoPrice || productData.price,
          createdAt: serverTimestamp(),
          status: 'pending',
          read: false
        }).catch(console.warn);
      } catch (firestoreErr) {
        console.warn('[Firestore] Info addDoc products:', firestoreErr);
      }

      const createdProduct: Product = {
        id: docRefId,
        ...newProdPayload
      } as Product;

      setProducts((prev) => [createdProduct, ...prev.filter((p) => p.id !== createdProduct.id)]);

      // Cache locally
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
        const parsed = saved ? JSON.parse(saved) : [];
        localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify([createdProduct, ...parsed.filter((p: Product) => p.id !== createdProduct.id)]));
      } catch (e) {
        console.warn('Storage save error', e);
      }

      showToast({
        title: 'Produit mis en vente direct !',
        message: `${createdProduct.name} est en ligne sur votre boutique.`,
        type: 'success'
      });
      return { success: true, id: docRefId };
    } catch (err) {
      console.error('Erreur addProduct:', err);
      const fallbackId = `prod-${Date.now()}`;
      const vendor = vendors.find((v) => v.id === productData.vendorId) || activeVendor;
      const createdProduct: Product = {
        id: fallbackId,
        ...productData,
        vendorId: vendor?.id || productData.vendorId || 'vendor-1',
        vendorName: vendor?.name || productData.vendorName || 'Boutique Teranga',
        vendorWhatsApp: vendor?.phone || productData.vendorWhatsApp || '+221 77 123 45 67',
        status: 'approved',
        createdAt: new Date().toISOString()
      } as Product;

      setProducts((prev) => [createdProduct, ...prev.filter((p) => p.id !== createdProduct.id)]);
      showToast({
        title: 'Article enregistré',
        message: `${createdProduct.name} est ajouté à votre catalogue boutique.`,
        type: 'success'
      });
      return { success: true, id: fallbackId };
    }
  };

  const updateProductStatus = (id: string, status: 'approved' | 'rejected') => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );

    // Update in Firestore
    updateDoc(doc(db, 'products', id), { status }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    });

    showToast({
      title: status === 'approved' ? 'Produit validé' : 'Produit refusé',
      message: `Le statut du produit a été mis à jour par l'initiateur.`,
      type: 'info'
    });
  };

  const toggleProductBoost = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nextBoost = !target.isBoosted;

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isBoosted: nextBoost } : p))
    );

    // Update in Firestore
    updateDoc(doc(db, 'products', id), { isBoosted: nextBoost }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    });

    showToast({
      title: nextBoost ? 'Boost activé (3 500 FCFA)' : 'Boost désactivé',
      message: nextBoost
        ? `${target.name} est maintenant mis en vedette en page d'accueil pendant 7 jours !`
        : `${target.name} a repris son affichage standard.`,
      type: 'success'
    });
  };

  const upgradeVendorToPro = (vendorId: string) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    const proExpiry = nextDate.toISOString().split('T')[0];

    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          return {
            ...v,
            isPro: true,
            proExpiry
          };
        }
        return v;
      })
    );

    // Update in Firestore
    updateDoc(doc(db, 'vendors', vendorId), {
      isPro: true,
      proExpiry
    }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `vendors/${vendorId}`);
    });

    showToast({
      title: 'Abonnement Pro Activé !',
      message: 'Félicitations ! Vous pouvez maintenant ajouter un nombre illimité de produits.',
      type: 'success'
    });
  };

  // Admin Direct Vendor Creation (Auto-Approved)
  const adminAddVendor = (data: {
    name: string;
    ownerName?: string;
    phone: string;
    neighborhood: string;
    bio?: string;
    categoryLabel?: string;
    creatorTag?: string;
    avatar?: string;
    coverImage?: string;
  }): Vendor => {
    const initials = data.name.trim().slice(0, 2).toUpperCase() || 'TB';
    const fallbackAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23D46A8A"/><circle cx="100" cy="100" r="85" fill="none" stroke="%23F8D7E3" stroke-width="3"/><text x="100" y="112" font-family="serif" font-size="44" font-weight="bold" fill="%23FFFFFF" text-anchor="middle" letter-spacing="2">${initials}</text></svg>`;

    const newVendor: Vendor = {
      id: `vendor-${Date.now().toString().slice(-6)}`,
      name: data.name.trim(),
      ownerName: data.ownerName?.trim() || data.name.trim(),
      phone: data.phone.trim(),
      waveNumber: data.phone.trim(),
      orangeMoneyNumber: data.phone.trim(),
      neighborhood: data.neighborhood.trim(),
      avatar: data.avatar || fallbackAvatar,
      coverImage: data.coverImage,
      isPro: true,
      subscription: 'pro_6000',
      balance: 0,
      totalSales: 0,
      monthlySales: 0,
      subscriptionStatus: 'trial',
      trialDaysRemaining: 30,
      rating: 5.0,
      reviewCount: 1,
      bio: data.bio?.trim() || `Créatrice / créateur partenaire de TERANGA BEAUTY à ${data.neighborhood}.`,
      joinedDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'active',
      creatorTag: data.creatorTag || 'Vendeuse • Créatrice',
      categoryLabel: data.categoryLabel || 'Mode & Beauté',
      badges: ['Boutique Vérifiée', `Dakar - ${data.neighborhood}`, 'Livraison Directe']
    };

    setVendors((prev) => [newVendor, ...prev.filter((v) => v.id !== newVendor.id)]);
    setShops((prev) => [newVendor, ...prev.filter((s) => s.id !== newVendor.id)]);
    setActiveVendorId(newVendor.id);

    // Save to Firestore Real-Time shops & vendors
    setDoc(doc(db, 'shops', newVendor.id), sanitizeForFirestore(newVendor)).catch(console.warn);
    setDoc(doc(db, 'vendors', newVendor.id), sanitizeForFirestore(newVendor)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `vendors/${newVendor.id}`);
    });

    showToast({
      title: 'Boutique ajoutée avec succès !',
      message: `La boutique "${newVendor.name}" est désormais active et synchronisée sur TERANGA BEAUTY.`,
      type: 'success'
    });
    return newVendor;
  };

  // Admin Direct Product Creation
  const adminAddProduct = (data: {
    name: string;
    price: number;
    originalPrice?: number;
    promoPrice?: number;
    category: ProductCategory;
    vendorId: string;
    description?: string;
    image?: string;
    photos?: string[];
    sizes?: ('S' | 'M' | 'L' | 'XL')[];
    color?: string;
    neighborhood?: string;
    stock?: number;
    isBoosted?: boolean;
  }): Product => {
    const parentVendor = vendors.find((v) => v.id === data.vendorId) || activeVendor;
    const vendorName = parentVendor?.name || 'Boutique Partenaire';
    const vendorWhatsApp = parentVendor?.phone || '77 123 45 67';
    const vendorAvatar = parentVendor?.avatar || '';

    const newProduct: Product = {
      id: `prod-${Date.now().toString().slice(-6)}`,
      name: data.name.trim(),
      price: data.price,
      originalPrice: data.originalPrice || (data.promoPrice ? data.price + 3000 : undefined),
      promoPrice: data.promoPrice,
      category: data.category,
      vendorId: parentVendor?.id || data.vendorId,
      vendeuseId: parentVendor?.id || data.vendorId,
      vendorName,
      vendorWhatsApp,
      whatsappVendeuse: vendorWhatsApp,
      vendorAvatar,
      image: data.image || '',
      photos: data.photos && data.photos.length > 0 ? data.photos : (data.image ? [data.image] : []),
      sizes: data.sizes || ['S', 'M', 'L', 'XL'],
      color: data.color || 'rose',
      neighborhood: data.neighborhood || parentVendor?.neighborhood || 'Dakar',
      rating: 5.0,
      reviewCount: 0,
      stock: data.stock ?? 10,
      description: data.description?.trim() || `${data.name} disponible chez ${vendorName}. Qualité garantie.`,
      details: ['Création artisanale', 'Disponible à Dakar', 'Service client rapide'],
      isBoosted: data.isBoosted ?? false,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Save to Firestore Real-Time
    setDoc(doc(db, 'products', newProduct.id), sanitizeForFirestore(newProduct)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `products/${newProduct.id}`);
    });

    showToast({
      title: 'Produit ajouté !',
      message: `"${newProduct.name}" est maintenant en vente dans la boutique "${vendorName}".`,
      type: 'success'
    });
    return newProduct;
  };

  const deleteShop = async (shopId: string): Promise<boolean> => {
    setIsCloudSyncing(true);
    const targetShop = vendors.find((v) => v.id === shopId) || shops.find((s) => s.id === shopId);
    const shopName = targetShop?.name || 'Boutique';

    // 1. Gather all product IDs to delete across all possible key fields
    const productIdsToDelete = new Set<string>();

    // From local memory state
    products.forEach((p) => {
      const pShopId = (p as any).shopId;
      const pSellerId = (p as any).sellerId;
      if (
        p.vendorId === shopId ||
        p.vendeuseId === shopId ||
        pShopId === shopId ||
        pSellerId === shopId
      ) {
        productIdsToDelete.add(p.id);
      }
    });

    // From Firestore queries: shopId, sellerId, vendorId, vendeuseId
    const queryFields = ['shopId', 'sellerId', 'vendorId', 'vendeuseId'];
    for (const field of queryFields) {
      try {
        const q = query(collection(db, 'products'), where(field, '==', shopId));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          productIdsToDelete.add(docSnap.id);
        });
      } catch (err) {
        console.warn(`[Firestore query] field ${field} error:`, err);
      }
    }

    // Also check shop subcollection 'shops/{shopId}/products'
    try {
      const subSnap = await getDocs(collection(db, 'shops', shopId, 'products'));
      subSnap.forEach((docSnap) => {
        productIdsToDelete.add(docSnap.id);
      });
    } catch (err) {
      // Subcollection might not exist or error
    }

    // 2. Perform BATCH DELETE in Firestore
    try {
      const batch = writeBatch(db);

      // Delete shop from 'shops' and 'vendors' collections
      batch.delete(doc(db, 'shops', shopId));
      batch.delete(doc(db, 'vendors', shopId));

      // Batch delete all found products
      productIdsToDelete.forEach((prodId) => {
        batch.delete(doc(db, 'products', prodId));
        batch.delete(doc(db, 'shops', shopId, 'products', prodId));
      });

      await batch.commit();
    } catch (err) {
      console.warn('Batch delete error in Firestore, executing fallback individual deletes:', err);
      try {
        await deleteDoc(doc(db, 'shops', shopId)).catch(console.warn);
        await deleteDoc(doc(db, 'vendors', shopId)).catch(console.warn);
        for (const pid of productIdsToDelete) {
          await deleteDoc(doc(db, 'products', pid)).catch(console.warn);
          await deleteDoc(doc(db, 'shops', shopId, 'products', pid)).catch(() => {});
        }
      } catch (fallbackErr) {
        console.warn('Fallback deleteDoc error:', fallbackErr);
      }
    }

    // 3. Force refresh list in memory immediately
    setVendors((prev) => prev.filter((v) => v.id !== shopId));
    setShops((prev) => prev.filter((s) => s.id !== shopId));
    setProducts((prev) =>
      prev.filter(
        (p) =>
          !productIdsToDelete.has(p.id) &&
          p.vendorId !== shopId &&
          p.vendeuseId !== shopId &&
          (p as any).shopId !== shopId &&
          (p as any).sellerId !== shopId
      )
    );

    // Update LocalStorage immediately
    try {
      const savedVendors = localStorage.getItem(LOCAL_STORAGE_KEYS.VENDORS);
      if (savedVendors) {
        const parsed = JSON.parse(savedVendors);
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.VENDORS,
          JSON.stringify(parsed.filter((v: any) => v.id !== shopId))
        );
      }
      const savedProds = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      if (savedProds) {
        const parsed = JSON.parse(savedProds);
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.PRODUCTS,
          JSON.stringify(
            parsed.filter((p: any) => !productIdsToDelete.has(p.id) && p.vendorId !== shopId)
          )
        );
      }
      if (localStorage.getItem('tb_my_vendor_id') === shopId) {
        localStorage.removeItem('tb_my_vendor_id');
        setMyVendorId(null);
      }
    } catch (e) {
      console.warn('LocalStorage cleanup error', e);
    }

    if (activeVendorId === shopId) {
      setActiveVendorId('');
    }

    // After delete, force refresh list and show toast "Boutique supprimée totalement"
    showToast({
      title: 'Suppression terminée',
      message: 'Boutique supprimée totalement',
      type: 'info'
    });

    setIsCloudSyncing(false);
    return true;
  };

  const deleteVendor = async (vendorId: string) => {
    return deleteShop(vendorId);
  };

  const deleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    // Delete in Firestore
    deleteDoc(doc(db, 'products', productId)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    });
    if (prod?.vendorId) {
      deleteDoc(doc(db, 'shops', prod.vendorId, 'products', productId)).catch(() => {});
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.PRODUCTS,
          JSON.stringify(parsed.filter((p: any) => p.id !== productId))
        );
      }
    } catch (e) {
      // Ignored
    }

    showToast({
      title: 'Produit retiré',
      message: prod ? `"${prod.name}" a été supprimé de la base Firestore.` : 'Produit supprimé.',
      type: 'info'
    });
  };

  const clearAllVendorsAndProducts = () => {
    // Delete in Firestore
    vendors.forEach((v) => {
      deleteDoc(doc(db, 'shops', v.id)).catch(console.warn);
      deleteDoc(doc(db, 'vendors', v.id)).catch(console.warn);
    });
    products.forEach((p) => {
      deleteDoc(doc(db, 'products', p.id)).catch(console.warn);
    });

    setVendors([]);
    setShops([]);
    setProducts([]);
    setActiveVendorId('');
    showToast({
      title: 'Catalogue réinitialisé à 0',
      message: 'Toutes les boutiques et tous les produits ont été effacés de Firestore.',
      type: 'info'
    });
  };

  // Clean demo data ("Delete all fake demo shops and products. Keep only real shops created via 'Créer ma boutique' form")
  const cleanDemoData = async () => {
    setIsCloudSyncing(true);
    try {
      const demoVendorsList = vendors.filter((v) => v.isDemo === true || v.id.startsWith('vendor-guediawaye-') || v.id.startsWith('vendor-demo-'));
      const demoProductsList = products.filter((p) => p.isDemo === true || p.id.startsWith('prod-w') || demoVendorsList.some((dv) => dv.id === p.vendorId));

      for (const v of demoVendorsList) {
        await deleteDoc(doc(db, 'shops', v.id)).catch(console.warn);
        await deleteDoc(doc(db, 'vendors', v.id)).catch(console.warn);
      }
      for (const p of demoProductsList) {
        await deleteDoc(doc(db, 'products', p.id)).catch(console.warn);
      }

      const realVendors = vendors.filter((v) => !demoVendorsList.some((dv) => dv.id === v.id));
      const realProducts = products.filter((p) => !demoProductsList.some((dp) => dp.id === p.id));

      setVendors(realVendors);
      setShops(realVendors);
      setProducts(realProducts);

      localStorage.setItem(LOCAL_STORAGE_KEYS.VENDORS, JSON.stringify(realVendors));
      localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(realProducts));

      showToast({
        title: 'Données démo nettoyées !',
        message: `${demoVendorsList.length} boutique(s) de test supprimées. Seules les vraies boutiques créées sont conservées.`,
        type: 'success'
      });
    } catch (err) {
      console.warn('Erreur cleanDemoData', err);
      showToast({
        title: 'Erreur',
        message: 'Impossible de nettoyer les données démo.',
        type: 'warning'
      });
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Direct in-app messaging handlers
  const openDirectChat = (vendor: Vendor, product?: Product) => {
    setActiveDirectChat({ isOpen: true, vendor, product });
  };

  const closeDirectChat = () => {
    setActiveDirectChat(null);
  };

  const sendDirectMessage = async (payload: {
    vendorId: string;
    vendorName: string;
    customerName: string;
    customerPhone: string;
    text: string;
    productId?: string;
    productName?: string;
    productPrice?: number;
    productImage?: string;
  }) => {
    const cleanPhone = payload.customerPhone.replace(/\D/g, '') || 'guest';
    const chatId = `${payload.vendorId}_${cleanPhone}`;
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      vendorId: payload.vendorId,
      vendorName: payload.vendorName,
      customerName: payload.customerName || 'Cliente Dakar',
      customerPhone: payload.customerPhone,
      sender: 'customer',
      text: payload.text.trim(),
      productId: payload.productId,
      productName: payload.productName,
      productPrice: payload.productPrice,
      productImage: payload.productImage,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      read: false
    };

    setDirectMessages((prev) => [...prev, newMsg]);

    try {
      await addDoc(collection(db, 'messages'), sanitizeForFirestore(newMsg));
    } catch (err) {
      console.warn('Firestore messages write error', err);
    }

    // Notify vendor
    setVendorNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        vendorId: payload.vendorId,
        type: 'product_touch',
        productName: payload.productName,
        productId: payload.productId,
        productPrice: payload.productPrice,
        message: `💬 Message direct de ${payload.customerName}: "${payload.text.slice(0, 45)}..."`,
        timestamp: 'À l\'instant',
        read: false
      },
      ...prev
    ]);

    playChime();
    showToast({
      title: 'Message direct envoyé !',
      message: `Votre message a été transmis directement à la vendeuse ${payload.vendorName}.`,
      type: 'success'
    });
  };

  const vendorReplyDirectMessage = async (chatId: string, text: string) => {
    const targetChat = directMessages.find((m) => m.chatId === chatId);
    if (!targetChat) return;

    const replyMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      vendorId: targetChat.vendorId,
      vendorName: targetChat.vendorName,
      customerName: targetChat.customerName,
      customerPhone: targetChat.customerPhone,
      sender: 'vendor',
      text: text.trim(),
      productId: targetChat.productId,
      productName: targetChat.productName,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      read: true
    };

    setDirectMessages((prev) => [...prev, replyMsg]);

    try {
      await addDoc(collection(db, 'messages'), sanitizeForFirestore(replyMsg));
    } catch (err) {
      console.warn('Firestore vendor reply error', err);
    }

    playChime();
    showToast({
      title: 'Réponse envoyée !',
      message: `Votre réponse a été transmise en direct à ${targetChat.customerName}.`,
      type: 'success'
    });
  };

  const loadSampleData = () => {
    setVendors(SAMPLE_VENDORS);
    setProducts(SAMPLE_PRODUCTS);
    setActiveVendorId(SAMPLE_VENDORS[0]?.id || '');

    // Write to Firestore Real-Time
    SAMPLE_VENDORS.forEach((v) => {
      setDoc(doc(db, 'vendors', v.id), sanitizeForFirestore(v)).catch(console.warn);
    });
    SAMPLE_PRODUCTS.forEach((p) => {
      setDoc(doc(db, 'products', p.id), sanitizeForFirestore(p)).catch(console.warn);
    });

    showToast({
      title: 'Boutiques modèles chargées',
      message: '3 boutiques dakarois vérifiées (Awa Fashion, Moussa & Co, Keur Sabar) ont été importées sur Firestore.',
      type: 'success'
    });
  };

  const openWhatsAppChat = (vendorPhone: string, vendorName: string, productName?: string, price?: number) => {
    if (productName) {
      const prod = products.find((p) => p.name === productName);
      if (prod) {
        logProductTouch(prod.id, 'whatsapp_click');
      }
    }

    const message = productName
      ? `Bonjour ${vendorName}, je vous contacte depuis la marketplace TERANGA BEAUTY concernant votre article "${productName}" (${price ? price.toLocaleString('fr-FR') + ' FCFA' : ''}). Est-il toujours disponible ?`
      : `Bonjour ${vendorName}, j'aimerais avoir plus d'informations sur votre boutique sur TERANGA BEAUTY.`;

    setWhatsAppModal({
      isOpen: true,
      vendorPhone,
      vendorName,
      productName,
      initialMessage: message
    });
  };

  const closeWhatsAppChat = () => setWhatsAppModal(null);

  const addReview = (productId: string, reviewData: { userName: string; rating: number; comment: string }) => {
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      productId,
      userName: reviewData.userName || 'Cliente Teranga',
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: "Aujourd'hui"
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const currentReviews = p.reviews || [];
          const updatedReviews = [newRev, ...currentReviews];
          const newAvg = Number(
            (
              updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
              updatedReviews.length
            ).toFixed(1)
          );

          // Update in Firestore
          updateDoc(doc(db, 'products', productId), {
            reviews: updatedReviews,
            rating: newAvg,
            reviewCount: updatedReviews.length
          }).catch(console.warn);

          return {
            ...p,
            reviews: updatedReviews,
            rating: newAvg,
            reviewCount: updatedReviews.length
          };
        }
        return p;
      })
    );

    showToast({
      title: 'Avis publié !',
      message: 'Merci pour votre retour d\'expérience.',
      type: 'success'
    });
  };

  const placeOrder = (orderPayload: {
    vendorId?: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    paymentMethod: PaymentMethod;
    paymentProofUrl?: string;
    paymentProofName?: string;
    transactionId?: string;
  }): Order => {
    const orderId = `CMD-${Math.floor(1000 + Math.random() * 9000)}`;
    const primaryVendorId = orderPayload.vendorId || cart[0]?.product.vendorId || 'vendor-1';
    const vendor = vendors.find((v) => v.id === primaryVendorId);
    const primaryVendorName = vendor?.name || cart[0]?.product.vendorName || 'Vendeuse Teranga';

    const totalAmount = cartTotal;
    const commissionAmount = Math.round(cartSubtotal * 0.10);
    const vendorPayoutAmount = cartSubtotal - commissionAmount;

    const newOrder: Order = {
      id: orderId,
      vendorId: primaryVendorId,
      vendorName: primaryVendorName,
      vendorPhone: vendor?.phone || '+221 77 123 45 67',
      vendorWave: vendor?.waveNumber || vendor?.phone || '77 123 45 67',
      vendorOrangeMoney: vendor?.orangeMoneyNumber || vendor?.phone || '77 123 45 67',
      items: [...cart],
      totalAmount,
      commissionAmount,
      customerName: orderPayload.customerName,
      customerPhone: orderPayload.customerPhone,
      customerAddress: orderPayload.customerAddress,
      customerCity: orderPayload.customerCity,
      paymentMethod: orderPayload.paymentMethod,
      paymentStatus: orderPayload.paymentMethod === 'cod' ? 'pending' : 'paid',
      transactionId: orderPayload.transactionId || `PAY-${Date.now().toString().slice(-6)}`,
      paymentProofUrl: orderPayload.paymentProofUrl,
      paymentProofName: orderPayload.paymentProofName,
      status: 'pending_vendor_acceptance',
      date: new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      createdAt: new Date().toISOString(),
      whatsAppNotified: true
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Save Order to Firestore
    setDoc(doc(db, 'orders', newOrder.id), sanitizeForFirestore(newOrder)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `orders/${newOrder.id}`);
    });

    const newCommission: CommissionRecord = {
      id: `COM-${Date.now()}`,
      orderId: newOrder.id,
      vendorId: primaryVendorId,
      vendorName: primaryVendorName,
      totalOrderAmount: cartSubtotal,
      commissionAmount,
      vendorPayoutAmount,
      date: new Date().toLocaleDateString('fr-FR'),
      createdAt: new Date().toISOString(),
      status: 'collected'
    };
    setCommissions((prev) => [newCommission, ...prev]);

    // Save Commission to Firestore
    setDoc(doc(db, 'commissions', newCommission.id), sanitizeForFirestore(newCommission)).catch(console.warn);

    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === primaryVendorId) {
          const nextBal = (v.balance || 0) + vendorPayoutAmount;
          const nextSales = (v.totalSales || 0) + cartSubtotal;

          // Update vendor balance in Firestore
          updateDoc(doc(db, 'vendors', primaryVendorId), {
            balance: nextBal,
            totalSales: nextSales
          }).catch(console.warn);

          return {
            ...v,
            balance: nextBal,
            totalSales: nextSales
          };
        }
        return v;
      })
    );

    clearCart();

    const vendorPhone = vendor?.phone || '+221771234567';
    const message = encodeURIComponent(
      `🔔 *NOUVELLE COMMANDE SUR TERANGA BEAUTY !*\n\n` +
      `📦 Commande: *#${newOrder.id}*\n` +
      `👤 Client(e): *${newOrder.customerName}* (${newOrder.customerPhone})\n` +
      `📍 Adresse: ${newOrder.customerAddress}, ${newOrder.customerCity}\n` +
      `💳 Mode: *${newOrder.paymentMethod.toUpperCase()}* (${newOrder.totalAmount.toLocaleString('fr-FR')} FCFA)\n` +
      `💰 Votre gain net (90%): *${vendorPayoutAmount.toLocaleString('fr-FR')} FCFA*\n` +
      `🤝 Commission réseau (10%): *${commissionAmount.toLocaleString('fr-FR')} FCFA*\n\n` +
      `Merci de préparer l'envoi rapidement !`
    );

    const waLink = `https://wa.me/${vendorPhone.replace(/\D/g, '')}?text=${message}`;

    showToast({
      title: 'Commande validée avec succès !',
      message: `Notification WhatsApp transmise à ${primaryVendorName}. Gain: ${vendorPayoutAmount.toLocaleString('fr-FR')} FCFA.`,
      type: 'whatsapp',
      actionUrl: waLink,
      actionLabel: 'Ouvrir WhatsApp Vendeuse'
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    // Update in Firestore
    updateDoc(doc(db, 'orders', orderId), { status }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    });

    showToast({
      title: 'Statut de commande mis à jour',
      message: `La commande #${orderId} est désormais: ${status}`,
      type: 'info'
    });
  };

  const acceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'accepted');
    showToast({
      title: 'Commande Acceptée en 1 clic !',
      message: `La commande #${orderId} a été confirmée.`,
      type: 'success'
    });
  };

  const rejectOrder = (orderId: string, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'rejected', rejectionReason: reason } : o))
    );
    updateDoc(doc(db, 'orders', orderId), { status: 'rejected', rejectionReason: reason }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    });
    showToast({
      title: 'Commande Refusée',
      message: `La commande #${orderId} a été refusée.`,
      type: 'info'
    });
  };

  // Espace Chat entre les personnes visitant le site directement
  const sendLiveChatMessage = async (
    textOrPayload: string | {
      text: string;
      authorName?: string;
      authorRole?: 'visitor' | 'vendor' | 'admin';
      authorQuarter?: string;
      productId?: string;
      productName?: string;
      productPrice?: number;
      productImage?: string;
    },
    options?: {
      authorName?: string;
      authorQuarter?: string;
      productId?: string;
      productName?: string;
      productPrice?: number;
      productImage?: string;
    }
  ) => {
    let cleanText = '';
    let authorName = '';
    let authorRole: 'visitor' | 'vendor' | 'admin' = 'visitor';
    let authorQuarter = 'Dakar';
    let prodId: string | undefined;
    let prodName: string | undefined;
    let prodPrice: number | undefined;
    let prodImg: string | undefined;

    if (typeof textOrPayload === 'string') {
      cleanText = textOrPayload.trim();
      authorName = options?.authorName?.trim() || userAccount?.name || 'Visiteur Dakar';
      authorQuarter = options?.authorQuarter || activeVendor?.neighborhood || 'Dakar';
      prodId = options?.productId;
      prodName = options?.productName;
      prodPrice = options?.productPrice;
      prodImg = options?.productImage;
    } else {
      cleanText = (textOrPayload.text || '').trim();
      authorName = textOrPayload.authorName?.trim() || userAccount?.name || 'Visiteur Dakar';
      authorQuarter = textOrPayload.authorQuarter || activeVendor?.neighborhood || 'Dakar';
      prodId = textOrPayload.productId;
      prodName = textOrPayload.productName;
      prodPrice = textOrPayload.productPrice;
      prodImg = textOrPayload.productImage;
      if (textOrPayload.authorRole) {
        authorRole = textOrPayload.authorRole;
      }
    }

    if (!cleanText && !prodId) return;

    if (isInitiatorAuthenticated && currentRole === 'admin') {
      authorRole = 'admin';
      authorName = authorName === 'Visiteur Dakar' ? 'Alioune (Admin Initiateur)' : `${authorName} (Admin)`;
    } else if (activeVendor && (currentRole === 'vendor' || activeVendor.name)) {
      authorRole = 'vendor';
      authorName = activeVendor.name;
    }

    const newMsg: LiveChatMessage = {
      id: `live-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      authorName,
      authorRole,
      authorQuarter: options?.authorQuarter || activeVendor?.neighborhood || 'Dakar',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      productId: options?.productId,
      productName: options?.productName,
      productPrice: options?.productPrice,
      productImage: options?.productImage
    };

    // Optimistic local state update
    setLiveChatMessages((prev) => [...prev, newMsg]);

    // Save to Firestore Real-Time
    try {
      await setDoc(doc(db, 'live_chat', newMsg.id), sanitizeForFirestore(newMsg));
    } catch (err) {
      console.warn('[Firestore] live_chat write fallback', err);
    }
  };

  const deleteLiveChatMessage = async (msgId: string) => {
    setLiveChatMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await deleteDoc(doc(db, 'live_chat', msgId));
      showToast({
        title: 'Message supprimé',
        message: 'Le message du salon a été retiré.',
        type: 'info'
      });
    } catch (err) {
      console.warn('[Firestore] live_chat delete fallback', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        activeVendorId,
        setActiveVendorId,
        isMobileDeviceFrame,
        setIsMobileDeviceFrame,
        isFirestoreConnected,
        isCloudSyncing,
        syncLocalDataToFirestore,
        isInitiatorAuthenticated,
        isInitiatorModalOpen,
        setIsInitiatorModalOpen,
        loginAsInitiator,
        logoutInitiator,
        switchTestAccount,
        isGuideModalOpen,
        setIsGuideModalOpen,
        toggleVendorStatus,
        extendVendorTrial,
        markVendorSubscriptionPaid,
        updateVendorPaymentDetails,
        clearVendorCart,
        getCartVendors,
        checkoutVendor,
        setCheckoutVendor,
        startDirectCheckout,
        shops,
        addShop,
        products,
        vendors,
        approvedVendors,
        pendingVendors,
        activeVendor,
        addProduct,
        adminAddVendor,
        adminAddProduct,
        deleteVendor,
        deleteShop,
        deleteProduct,
        clearAllVendorsAndProducts,
        cleanDemoData,
        myVendorId,
        hasCreatedShop,
        loadSampleData,
        updateProductStatus,
        toggleProductBoost,
        upgradeVendorToPro,
        registerVendor,
        approveVendor,
        rejectVendor,
        vendorNotifications,
        logProductTouch,
        clearVendorNotifications,
        getVendorNotifications,
        catalogueVendor,
        setCatalogueVendor,
        openShopCatalogue,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        priceFilter,
        setPriceFilter,
        sizeFilter,
        setSizeFilter,
        colorFilter,
        setColorFilter,
        neighborhoodFilter,
        setNeighborhoodFilter,
        selectedVendorFilter,
        setSelectedVendorFilter,
        resetFilters,
        activeFilterCount,
        isCreatorFormOpen,
        setIsCreatorFormOpen,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        deliveryFee,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedProduct,
        setSelectedProduct,
        whatsAppModal,
        openWhatsAppChat,
        closeWhatsAppChat,
        directMessages,
        activeDirectChat,
        openDirectChat,
        closeDirectChat,
        sendDirectMessage,
        vendorReplyDirectMessage,
        favorites,
        toggleFavorite,
        isFavorite,
        addReview,
        orders,
        commissions,
        acceptOrder,
        rejectOrder,
        placeOrder,
        updateOrderStatus,
        toast,
        showToast,
        hideToast,
        userAccount,
        isOnboardingModalOpen,
        setIsOnboardingModalOpen,
        registerUserAccount,
        liveChatMessages,
        isLiveChatOpen,
        setIsLiveChatOpen,
        sendLiveChatMessage,
        deleteLiveChatMessage,
        marketChatDraft,
        setMarketChatDraft
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
