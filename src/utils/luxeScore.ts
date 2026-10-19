import { Vendor, Product } from '../types';

export interface LuxeScoreBreakdown {
  total: number;
  hasKeywords: boolean;
  hasCustomLogo: boolean;
  hasDetailedProducts: boolean;
  hasWhatsApp: boolean;
}

/**
 * Calculates the Luxe Score for a boutique:
 * - +10 pts if description/bio/name contains "Maison", "Atelier", "Édition Limitée", "Fondée par"
 * - +10 pts if shop has custom logo (not default SVG initials or placeholder)
 * - +20 pts if shop has >3 products with detailed descriptions >20 words
 * - +15 pts if shop has WhatsApp contact filled
 */
export function getLuxeScoreBreakdown(vendor: Vendor, products: Product[]): LuxeScoreBreakdown {
  let score = 0;

  // 1. +10 points if description contains "Maison", "Atelier", "Édition Limitée", "Fondée par"
  const textToScan = [
    vendor.bio || '',
    vendor.name || '',
    vendor.categoryLabel || '',
    vendor.creatorTag || '',
    vendor.ownerName || ''
  ].join(' ').toLowerCase();

  const keywords = ['maison', 'atelier', 'édition limitée', 'edition limitee', 'fondée par', 'fondee par'];
  const hasKeywords = keywords.some((kw) => textToScan.includes(kw));
  if (hasKeywords) {
    score += 10;
  }

  // 2. +10 points if shop has logo custom (not default)
  const isCustomLogo = Boolean(
    vendor.avatar &&
    vendor.avatar.trim() !== '' &&
    !vendor.avatar.includes('via.placeholder') &&
    !vendor.avatar.startsWith('data:image/svg+xml;utf8,<svg')
  );
  if (isCustomLogo) {
    score += 10;
  }

  // 3. +20 points if shop has >3 products with detailed descriptions >20 words
  const vendorProducts = products.filter(
    (p) =>
      p.vendorId === vendor.id ||
      p.vendeuseId === vendor.id ||
      (p as any).shopId === vendor.id ||
      (p as any).sellerId === vendor.id
  );

  const detailedProductsCount = vendorProducts.filter((p) => {
    if (!p.description) return false;
    const words = p.description.trim().split(/\s+/).filter(Boolean);
    return words.length > 20;
  }).length;

  const hasDetailedProducts = detailedProductsCount > 3;
  if (hasDetailedProducts) {
    score += 20;
  }

  // 4. +15 points if shop has WhatsApp contact filled
  const cleanPhone = (vendor.phone || '').replace(/\D/g, '');
  const hasWhatsApp = cleanPhone.length >= 8;
  if (hasWhatsApp) {
    score += 15;
  }

  return {
    total: score,
    hasKeywords,
    hasCustomLogo: isCustomLogo,
    hasDetailedProducts,
    hasWhatsApp,
  };
}

export function calculateLuxeScore(vendor: Vendor, products: Product[]): number {
  return getLuxeScoreBreakdown(vendor, products).total;
}

export function sortVendorsByLuxeScore(vendors: Vendor[], products: Product[]): Vendor[] {
  return [...vendors].sort((a, b) => {
    const scoreB = calculateLuxeScore(b, products);
    const scoreA = calculateLuxeScore(a, products);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return (b.rating || 5) - (a.rating || 5);
  });
}
