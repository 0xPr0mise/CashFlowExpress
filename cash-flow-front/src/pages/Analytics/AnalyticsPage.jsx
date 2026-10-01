import { useState, useEffect } from "react";
import { getAnalytics } from "../../services/analytics.service";
import AnalyticsHeader from "../../components/analytics/AnalyticsHeader";
import AnalyticsFilters from "../../components/analytics/AnalyticsFilters";
import AnalyticsKpiGrid from "../../components/analytics/AnalyticsKpiGrid";
import AnalyticsCharts from "../../components/analytics/AnalyticsCharts";

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función centralizada para buscar analíticas con filtros
  const fetchAnalytics = async (filters = {}) => {
    try {
      setLoading(true);
      const data = await getAnalytics(filters);
      console.log("Datos analíticos actualizados:", data);
      setStats(data || {});
    } catch (err) {
      console.error("Error cargando analíticas:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial al montar la página (por defecto "all" o sin filtros)
  useEffect(() => {
    fetchAnalytics({ preset: "all" });
  }, []);

  // 🔄 Disparador clave: Cada vez que el usuario cambia un filtro, llamamos al backend
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
      <div className="min-h-screen bg-black text-neutral-400 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
          Sincronizando núcleos de analíticas financieras...
        </div>
      </div>
    );

  const currentData = stats || {};
  
  const totalLoans = Number(currentData.totalLoansCount) || 1;
  const activeLoans = Number(currentData.activeLoansCount) || 0;
  const paidLoans = Number(currentData.paidLoansCount) || 0;
  
  const activePercentage = Math.round((activeLoans / totalLoans) * 100);
  const paidPercentage = Math.round((paidLoans / totalLoans) * 100);

  const totalLent = Number(currentData.totalLentAmount) || 0;
  const expectedReturn = Number(currentData.totalExpectedReturn) || 0;
  const totalCollected = Number(currentData.totalCollected) || 0;
  const cashBalance = Number(currentData.cashBalance) || 0;

  const estimatedProfit = Math.max(0, expectedReturn - totalLent);
  const avgROI = totalLent > 0 ? ((estimatedProfit / totalLent) * 100).toFixed(1) : 0;
  
  const collectionRate = expectedReturn > 0
    ? Math.min(100, Math.round((totalCollected / expectedReturn) * 100))
    : 0;
  
  const outstandingPortfolio = Math.max(0, expectedReturn - totalCollected);
  const averageTicket = totalLoans > 0 ? totalLent / totalLoans : 0;

  // 🚨 Nuevos cálculos centralizados de Atrasos / Morosidad
  const now = new Date();
  const lateLoansList = (currentData.loans || []).filter(loan => {
    if (loan.status !== 'ACTIVO' || !loan.dueDate) return false;
    const dueDate = new Date(loan.dueDate);
    return dueDate < now;
  });

  const lateLoansCount = lateLoansList.length;
  const defaultRate = totalLoans > 0 ? ((lateLoansCount / totalLoans) * 100).toFixed(1) : 0;
  
  const totalLateAmount = lateLoansList.reduce((acc, loan) => {
    const loanTotal = Number(loan.totalToPay) || 0;
    const paidSum = (loan.payments || []).reduce((pAcc, p) => pAcc + (Number(p.amount) || 0), 0);
    const pending = loanTotal - paidSum;
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
    <div className="min-h-screen bg-black text-gray-100 p-6 md:p-10 font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <AnalyticsHeader />
        <AnalyticsFilters onFilterChange={handleFilterChange} rawData={currentData} />
        <AnalyticsKpiGrid stats={currentData} calculations={calculations} />
        <AnalyticsCharts stats={currentData} calculations={calculations} />
        
      </div>
    </div>
  );
}