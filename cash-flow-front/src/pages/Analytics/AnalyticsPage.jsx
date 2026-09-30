import { useState, useEffect } from "react";
import { getAnalytics } from "../../services/analytics.service";
import AnalyticsHeader from "../../components/analytics/AnalyticsHeader";
import AnalyticsFilters from "../../components/analytics/AnalyticsFilters";
import AnalyticsKpiGrid from "../../components/analytics/AnalyticsKpiGrid";
import AnalyticsCharts from "../../components/analytics/AnalyticsCharts";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [filteredStats, setFilteredStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then((data) => {
        setStats(data);
        setFilteredStats(data); // Inicialmente sin filtrar
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando analíticas:", err);
        setLoading(false);
      });
  }, []);

  // Lógica de filtrado según el rango seleccionado
  const handleFilterChange = ({ preset, startDate, endDate }) => {
    if (!stats) return;

    // Aquí puedes aplicar la lógica de filtrado real sobre tus transacciones o llamadas al backend.
    // Por ahora, simulamos el filtrado estructural o lo pasamos directo para mantener la reactividad visual:
    setFilteredStats(stats);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black text-neutral-400 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
          Sincronizando núcleos de analíticas financieras...
        </div>
      </div>
    );

  if (!stats)
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-sans">
        Error al conectar con los motores de cálculo del servidor.
      </div>
    );

  // --- CÁLCULOS FINANCIEROS SOBRE LOS DATOS (FILTRADOS O GLOBALES) ---
  const currentData = filteredStats || stats;
  const totalLoans = currentData.totalLoansCount || 1;
  const activeLoans = currentData.activeLoansCount || 0;
  const paidLoans = currentData.paidLoansCount || 0;
  
  const activePercentage = Math.round((activeLoans / totalLoans) * 100);
  const paidPercentage = Math.round((paidLoans / totalLoans) * 100);

  const totalLent = currentData.totalLentAmount || 0;
  const expectedReturn = currentData.totalExpectedReturn || 0;
  const totalCollected = currentData.totalCollected || 0;
  const cashBalance = currentData.cashBalance || 0;

  const estimatedProfit = Math.max(0, expectedReturn - totalLent);
  const avgROI = totalLent > 0 ? ((estimatedProfit / totalLent) * 100).toFixed(1) : 0;
  const collectionRate = expectedReturn > 0
    ? Math.min(100, Math.round((totalCollected / expectedReturn) * 100))
    : 0;
  const outstandingPortfolio = Math.max(0, expectedReturn - totalCollected);
  const averageTicket = totalLoans > 0 ? totalLent / totalLoans : 0;

  const calculations = {
    totalLoans,
    activeLoans,
    paidLoans,
    activePercentage,
    paidPercentage,
    totalLent,
    expectedReturn,
    totalCollected,
    cashBalance,
    estimatedProfit,
    avgROI,
    collectionRate,
    outstandingPortfolio,
    averageTicket,
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <AnalyticsHeader />
        
        {/* Componente de Filtros y Exportación */}
        <AnalyticsFilters onFilterChange={handleFilterChange} rawData={stats} />

        <AnalyticsKpiGrid stats={currentData} calculations={calculations} />
        <AnalyticsCharts stats={currentData} calculations={calculations} />
      </div>
    </div>
  );
}