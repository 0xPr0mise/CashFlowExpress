import { useState, useEffect } from "react";
import { getAnalytics } from "../../services/analytics.service";
import AnalyticsHeader from "../../components/analytics/AnalyticsHeader";
import AnalyticsFilters from "../../components/analytics/AnalyticsFilters";
import AnalyticsKpiGrid from "../../components/analytics/AnalyticsKpiGrid";
import AnalyticsCharts from "../../components/analytics/AnalyticsCharts";
import CapitalGrowthChart from "../../components/analytics/CapitalGrowthChart";
import CashFlowChart from "../../components/analytics/CashFlowChart";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await getAnalytics(filters);
      setStats({ ...(data || {}), ...filters });
    } catch (err) {
      console.error("Error cargando analíticas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics({ preset: "all" });
  }, []);

  const handleFilterChange = ({ preset, startDate, endDate }) => {
    const formattedFilters = {
      preset: preset || "all",
      startDate: startDate ? (startDate instanceof Date ? startDate.toISOString().split("T")[0] : startDate) : null,
      endDate: endDate ? (endDate instanceof Date ? endDate.toISOString().split("T")[0] : endDate) : null,
    };
    fetchAnalytics(formattedFilters);
  };

  if (loading && !stats)
    return (
      <div className="min-h-screen bg-black text-neutral-400 flex items-center justify-center font-sans p-4">
        <div className="flex items-center gap-3 text-center">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping shrink-0"></span>
          <span className="text-sm">Sincronizando núcleos de analíticas financieras...</span>
        </div>
      </div>
    );

  const currentData = stats || {};
  const loansArray = currentData.loans || [];
  const movementsArray = currentData.movements || currentData.cashMovements || [];

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

  const now = new Date();
  const lateLoansList = loansArray.filter(loan => {
    if (loan.status !== 'ACTIVO' || !loan.dueDate) return false;
    return new Date(loan.dueDate) < now;
  });

  const lateLoansCount = lateLoansList.length;
  const defaultRate = totalLoans > 0 ? ((lateLoansCount / totalLoans) * 100).toFixed(1) : 0;
  
  const totalLateAmount = lateLoansList.reduce((acc, loan) => {
    const paidSum = (loan.payments || []).reduce((pAcc, p) => pAcc + p.amount, 0);
    const pending = loan.totalToPay - paidSum;
    return acc + (pending > 0 ? pending : 0);
  }, 0);

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
    lateLoansCount,
    defaultRate,
    totalLateAmount,
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-red-600 selection:text-white">
      
      {/* HEADER Y FILTROS FIJOS (Sticky Mobile First) */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-neutral-800/80 px-4 sm:px-6 md:px-10 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Título y subtítulo */}
          <div className="w-full lg:w-auto">
            <AnalyticsHeader />
          </div>

          {/* Tarjetas de KPIs arriba (Scroll horizontal fluido en mobile, alineado a la derecha en desktop) */}
          <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <div className="min-w-max lg:min-w-0 lg:origin-right">
              <AnalyticsKpiGrid stats={currentData} calculations={calculations} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-3">
          <AnalyticsFilters onFilterChange={handleFilterChange} rawData={currentData} />
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL DESPLAZABLE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-10 space-y-6 md:space-y-8">
        <AnalyticsCharts stats={currentData} calculations={calculations} />
        
        {/* Gráficos: 1 columna en celulares, 2 columnas lado a lado en pantallas grandes (lg) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CapitalGrowthChart loans={loansArray} />
          <CashFlowChart 
            movements={movementsArray} 
            loans={loansArray} 
            currentCashBalance={cashBalance} 
          />
        </div>
      </div>

    </div>
  );
}