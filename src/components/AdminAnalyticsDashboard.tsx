import React, { useState, useEffect } from 'react';
import { Eye, TrendingUp, Store, ShoppingBag, RefreshCw, Sparkles, Calendar } from 'lucide-react';
import { getStoredAnalytics, TerangaAnalytics, BoutiqueViewStat, ProductViewStat } from '../services/analytics';

export const AdminAnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<TerangaAnalytics>(getStoredAnalytics());

  const refreshStats = () => {
    setStats(getStoredAnalytics());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const topBoutiques: BoutiqueViewStat[] = Object.values(stats.boutiqueViews)
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  const topProducts: ProductViewStat[] = Object.values(stats.productViews)
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-3xl border-2 border-[#F8D7E3] p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header du Tableau de Bord Analytique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FCE8EF] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D46A8A] text-white flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D46A8A]">
                Statistiques en Direct
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#D46A8A]" />
                teranga_analytics
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-black text-[#8B2D4A]">
              Tableau de Bord Analytique & Audience
            </h2>
          </div>
        </div>

        <button
          onClick={refreshStats}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FCE8EF] hover:bg-[#F8D7E3] text-[#8B2D4A] text-xs font-bold transition-all cursor-pointer"
          title="Actualiser les statistiques"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D46A8A]" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* 4 Compteurs Clés : Visites Aujourd'hui · Boutique la plus vue · Produit le plus cliqué · Total Visites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Visites Aujourd'hui */}
        <div className="bg-gradient-to-br from-[#D46A8A] to-[#B85372] text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#FCE8EF] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-white" />
              Visites Aujourd'hui
            </span>
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              Jour
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-serif font-black text-white">
              {stats.visitsToday.toLocaleString('fr-FR')}
            </div>
            <p className="text-[10px] text-[#FCE8EF]/90 mt-0.5">
              En direct ({new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})
            </p>
          </div>
          <div className="text-[10px] bg-black/15 px-2 py-0.5 rounded-md font-semibold text-white/90 truncate">
            Enregistré via teranga_analytics
          </div>
        </div>

        {/* Boutique la plus vue */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#F8D7E3] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8B2D4A] uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#D46A8A]" />
              Boutique la Plus Vue
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-[10px] font-bold">
              Top 1
            </span>
          </div>
          <div className="my-2">
            <div className="text-base sm:text-lg font-serif font-bold text-[#8B2D4A] truncate" title={topBoutiques[0]?.name || 'En attente de visites'}>
              {topBoutiques[0] ? topBoutiques[0].name : 'Aucune boutique'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-[#FCE8EF] text-[#D46A8A] text-xs font-extrabold">
                {topBoutiques[0] ? `${topBoutiques[0].views} vue${topBoutiques[0].views > 1 ? 's' : ''}` : '0 vue'}
              </span>
              {topBoutiques[0]?.neighborhood && (
                <span className="text-[10px] text-[#A24866] truncate font-medium">
                  • {topBoutiques[0].neighborhood}
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[#A24866]">
            {topBoutiques[0] ? 'Boutique n°1 en popularité' : 'Visitez une boutique pour l\'activer'}
          </p>
        </div>

        {/* Produit le plus cliqué */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#F8D7E3] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8B2D4A] uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#D46A8A]" />
              Produits les Plus Cliqués
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FCE8EF] text-[#8B2D4A] text-[10px] font-bold">
              Vedette
            </span>
          </div>
          <div className="my-2">
            <div className="text-base sm:text-lg font-serif font-bold text-[#8B2D4A] truncate" title={topProducts[0]?.name || 'En attente de clics'}>
              {topProducts[0] ? topProducts[0].name : 'Aucun produit'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-[#FFF0F5] text-[#D46A8A] text-xs font-extrabold">
                {topProducts[0] ? `${topProducts[0].views} clic${topProducts[0].views > 1 ? 's' : ''}` : '0 clic'}
              </span>
              {topProducts[0]?.vendorName && (
                <span className="text-[10px] text-[#A24866] truncate font-medium">
                  chez {topProducts[0].vendorName}
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-[#A24866]">
            {topProducts[0] ? 'Article le plus consulté' : 'Touchez un produit pour l\'activer'}
          </p>
        </div>

        {/* Total Visites du Site */}
        <div className="bg-gradient-to-br from-[#FFF5F8] to-[#FCE8EF] rounded-2xl p-4 border border-[#F8D7E3] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8B2D4A] uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#D46A8A]" />
              Total Visites Site
            </span>
            <div className="w-7 h-7 rounded-full bg-white/80 border border-[#F8D7E3] flex items-center justify-center text-[#D46A8A]">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-serif font-black text-[#8B2D4A]">
              {stats.totalVisits.toLocaleString('fr-FR')}
            </div>
            <p className="text-[10px] text-[#A24866] mt-0.5">
              Cumul global marketplace
            </p>
          </div>
          <p className="text-[10px] text-[#8B2D4A]/70 truncate">
            Toutes sessions TERANGA BEAUTY
          </p>
        </div>
      </div>

      {/* 2 Colonnes : Boutiques les Plus Vues & Produits les Plus Vus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Boutiques les plus vues */}
        <div className="bg-[#FFF9FB] rounded-2xl border border-[#F8D7E3] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-[#8B2D4A] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#D46A8A]" />
              Boutiques les Plus Vues
            </h3>
            <span className="text-[10px] font-bold text-[#D46A8A] bg-[#FCE8EF] px-2 py-0.5 rounded-full">
              Top Vendeuses
            </span>
          </div>

          {topBoutiques.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-white border border-[#F8D7E3]/60 text-xs text-[#8B2D4A]">
              Aucune boutique consultée pour l'instant. Les vues s'afficheront dès qu'un visiteur explore une boutique.
            </div>
          ) : (
            <div className="space-y-2">
              {topBoutiques.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#F8D7E3] text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#FCE8EF] text-[#8B2D4A] font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 truncate">
                      <p className="font-bold text-[#5A2D3A] truncate">{b.name}</p>
                      {b.neighborhood && (
                        <p className="text-[10px] text-[#A24866] truncate">{b.neighborhood}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#FFF0F5] text-[#D46A8A] font-extrabold text-xs">
                      {b.views} {b.views > 1 ? 'vues' : 'vue'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produits les plus vus / cliqués */}
        <div className="bg-[#FFF9FB] rounded-2xl border border-[#F8D7E3] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-[#8B2D4A] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D46A8A]" />
              Produits les Plus Vus & Cliqués
            </h3>
            <span className="text-[10px] font-bold text-[#D46A8A] bg-[#FCE8EF] px-2 py-0.5 rounded-full">
              Articles Vedettes
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-white border border-[#F8D7E3]/60 text-xs text-[#8B2D4A]">
              Aucun produit consulté pour l'instant. Les clics des clientes s'incrémenteront en direct ici.
            </div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#F8D7E3] text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#FCE8EF] text-[#8B2D4A] font-bold text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 truncate">
                      <p className="font-bold text-[#5A2D3A] truncate">{p.name}</p>
                      {p.vendorName && (
                        <p className="text-[10px] text-[#A24866] truncate">{p.vendorName}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#FFF0F5] text-[#D46A8A] font-extrabold text-xs">
                      {p.views} {p.views > 1 ? 'clics' : 'clic'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
