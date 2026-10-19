// Service de suivi analytique simple pour TERANGA BEAUTY
// Stockage localisé avec la clé standard "teranga_analytics" demandée

export interface BoutiqueViewStat {
  id: string;
  name: string;
  neighborhood?: string;
  views: number;
}

export interface ProductViewStat {
  id: string;
  name: string;
  price?: number;
  vendorName?: string;
  views: number;
}

export interface TerangaAnalytics {
  totalVisits: number;
  visitsToday: number;
  lastVisitDate: string; // Format YYYY-MM-DD
  boutiqueViews: Record<string, BoutiqueViewStat>;
  productViews: Record<string, ProductViewStat>;
}

const STORAGE_KEY = 'teranga_analytics';

const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const getStoredAnalytics = (): TerangaAnalytics => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalVisits: typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 0,
        visitsToday: typeof parsed.visitsToday === 'number' ? parsed.visitsToday : 0,
        lastVisitDate: parsed.lastVisitDate || getTodayString(),
        boutiqueViews: parsed.boutiqueViews || {},
        productViews: parsed.productViews || {}
      };
    }
  } catch (e) {
    console.warn('Erreur lecture analytics:', e);
  }

  return {
    totalVisits: 0,
    visitsToday: 0,
    lastVisitDate: getTodayString(),
    boutiqueViews: {},
    productViews: {}
  };
};

export const saveAnalytics = (data: TerangaAnalytics) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Erreur sauvegarde analytics:', e);
  }
};

/**
 * Fonction appelée au démarrage de l'app pour enregistrer la visite du site
 */
export const trackVisit = (): TerangaAnalytics => {
  const current = getStoredAnalytics();
  const today = getTodayString();

  let nextVisitsToday = current.visitsToday;
  if (current.lastVisitDate === today) {
    nextVisitsToday += 1;
  } else {
    // Nouveau jour : réinitialiser le compteur du jour
    nextVisitsToday = 1;
  }

  const updated: TerangaAnalytics = {
    ...current,
    totalVisits: (current.totalVisits || 0) + 1,
    visitsToday: nextVisitsToday,
    lastVisitDate: today
  };

  saveAnalytics(updated);
  return updated;
};

/**
 * Enregistre la consultation d'une boutique
 */
export const trackBoutiqueView = (boutiqueId: string, boutiqueName: string, neighborhood?: string) => {
  if (!boutiqueId) return;
  const current = getStoredAnalytics();
  const existing = current.boutiqueViews[boutiqueId] || {
    id: boutiqueId,
    name: boutiqueName || 'Boutique',
    neighborhood: neighborhood || 'Dakar',
    views: 0
  };

  const updated: TerangaAnalytics = {
    ...current,
    boutiqueViews: {
      ...current.boutiqueViews,
      [boutiqueId]: {
        ...existing,
        name: boutiqueName || existing.name,
        neighborhood: neighborhood || existing.neighborhood,
        views: existing.views + 1
      }
    }
  };

  saveAnalytics(updated);
};

/**
 * Enregistre la consultation / clic d'un produit
 */
export const trackProductView = (productId: string, productName: string, price?: number, vendorName?: string) => {
  if (!productId) return;
  const current = getStoredAnalytics();
  const existing = current.productViews[productId] || {
    id: productId,
    name: productName || 'Produit',
    price,
    vendorName,
    views: 0
  };

  const updated: TerangaAnalytics = {
    ...current,
    productViews: {
      ...current.productViews,
      [productId]: {
        ...existing,
        name: productName || existing.name,
        price: price ?? existing.price,
        vendorName: vendorName ?? existing.vendorName,
        views: existing.views + 1
      }
    }
  };

  saveAnalytics(updated);
};
