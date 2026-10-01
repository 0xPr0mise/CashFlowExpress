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
        console.log("Datos analíticos recibidos:", data);
        setStats(data || {});
        setFilteredStats(data || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando analíticas:", err);
        setLoading(false);
      });
  }, []);

  const handleFilterChange = ({ preset, startDate, endDate }) => {
    if (!stats) return;
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

  const currentData = filteredStats || stats || {};
  
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
      <div className="max-w-6xl mx-auto space-y-8">
        
        <AnalyticsHeader />
        <AnalyticsFilters onFilterChange={handleFilterChange} rawData={stats} />
        <AnalyticsKpiGrid stats={currentData} calculations={calculations} />
        <AnalyticsCharts stats={currentData} calculations={calculations} />
        
      </div>
    </div>
  );
}