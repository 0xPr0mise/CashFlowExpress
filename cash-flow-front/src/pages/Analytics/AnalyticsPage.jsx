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

  const formatMoney = (amount) => {
    const rounded = Math.round(amount || 0);
    return rounded.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const numericCash = Number(cashBalance) || 0;
  const isNegative = numericCash < 0;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-red-600 selection:text-white pb-32 md:pb-12 w-full">
      
      {/* HEADER Y FILTROS FIJOS (Ocupa todo el ancho disponible con padding lateral fluido) */}
      <div className="relative lg:sticky lg:top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-neutral-800/80 px-4 sm:px-6 lg:px-8 py-4 shadow-2xl w-full">
        <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Título y subtítulo */}
          <div className="w-full lg:w-auto">
            <AnalyticsHeader />
          </div>

          {/* Tarjetas de KPIs */}
          <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <div className="min-w-max lg:min-w-0 lg:origin-right">
              <AnalyticsKpiGrid stats={currentData} calculations={calculations} />
            </div>
          </div>
        </div>

        <div className="w-full mt-3">
          <AnalyticsFilters onFilterChange={handleFilterChange} rawData={currentData} />
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL DESPLAZABLE (Ocupa todo el ancho con padding simétrico) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
        
        {/* Alerta de posición consolidada si aplica */}
        {isNegative && (
          <div className="bg-red-950/60 border border-red-500/80 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl animate-pulse w-full">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-red-900 text-red-300 rounded-xl border border-red-700 text-sm">⚠</span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-400">Atención: Posición Consolidada Negativa</h4>
                <p className="text-xs text-neutral-200 mt-0.5">
                  Se detectó un saldo en rojo de ${formatMoney(numericCash)}. Es necesario <strong className="text-white underline">conciliar caja</strong>.
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase bg-red-600 text-white px-3 py-1.5 rounded-xl shadow whitespace-nowrap cursor-pointer hover:bg-red-500 transition-colors">
              Conciliar
            </span>
          </div>
        )}

        <AnalyticsCharts stats={currentData} calculations={calculations} />
        
        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
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