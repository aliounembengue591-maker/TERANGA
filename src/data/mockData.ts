import { Product, Vendor, Order, BoostPlan, ProSubscriptionPlan } from '../types';

import rosePoudreBannerImg from '../assets/images/rose_poudre_chic_leaves_1792240124961.jpg';
import voileBeigeImg from '../assets/images/voile_beige_luxury_1792196275342.jpg';
import awaPortraitImg from '../assets/images/awa_fashion_portrait_1792239007909.jpg';
import moussaPortraitImg from '../assets/images/moussa_portrait_1792239009061.jpg';
import keurSabarPortraitImg from '../assets/images/keur_sabar_duo_portrait_1792239009383.jpg';

import boubouWaxImg from '../assets/images/product_boubou_wax_1792162350471.jpg';
import sheaSoapImg from '../assets/images/product_shea_soap_1792162352043.jpg';
import thiourayeImg from '../assets/images/product_thiouraye_perfume_1792165037443.jpg';
import caftanSilkImg from '../assets/images/product_caftan_silk_1792164171606.jpg';

// Banners & Luxury Visuals
export const HERO_IMAGE = rosePoudreBannerImg;
export const ROSE_POUDRE_BANNER = rosePoudreBannerImg;
export const VOILE_BEIGE_CHIC = voileBeigeImg;

// Official Google Form link for Dakar creators
export const GOOGLE_FORM_URL = 'https://forms.gle/TerangaBeautyDakarCreatrices';

import { TWENTY_GUEDIAWAYE_VENDORS, TWENTY_GUEDIAWAYE_PRODUCTS, INITIAL_TEST_ORDERS } from './twentyBoutiques';

export const ADMIN_CONFIG = {
  monthlySubscriptionFee: 5000, // 5000 FCFA / mois par boutique
  trialDurationDays: 30, // 30 jours gratuits à l'inscription
  adminWaveNumber: '+221 77 591 00 29',
  adminOrangeMoneyNumber: '+221 78 591 00 29',
  adminName: 'Alioune (Fondateur TERANGA BEAUTY)'
};

// Clean slate: no fake or demo boutiques
export const INITIAL_VENDORS: Vendor[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const SAMPLE_VENDORS: Vendor[] = [];
export const SAMPLE_PRODUCTS: Product[] = [];
export const SAMPLE_ORDERS: Order[] = [];
import { PRIMARY_DAKAR_SHORTCUTS } from './dakarNeighborhoods';
export const POPULAR_DAKAR_AREAS = PRIMARY_DAKAR_SHORTCUTS;

export const STARTER_PLAN = {
  id: 'starter_3000',
  name: 'Standard Dakar',
  price: 3000,
  maxProducts: 10,
  features: ['Jusqu’à 10 créations', 'Boutique vérifiée', 'Support WhatsApp']
};

export const PRO_PLAN = {
  id: 'pro_6000',
  name: 'Abonnement Pro Créatrice',
  price: 6000,
  maxProducts: 999,
  features: ['Créations illimitées', 'Badge VIP Or', 'Support prioritaire']
};

export const BOOST_PLAN = {
  id: 'boost_3500',
  name: 'Boost 7 Jours',
  price: 3500,
  durationDays: 7,
  description: 'Place votre création en tête de catalogue'
};

