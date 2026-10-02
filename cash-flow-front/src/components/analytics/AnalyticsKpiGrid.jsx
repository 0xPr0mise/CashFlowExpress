export default function AnalyticsKpiGrid({ stats, calculations }) {
  const { cashBalance, outstandingPortfolio, estimatedProfit, avgROI, averageTicket, activeLoans } = calculations;

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
    <div className="w-full">
      {/* Grilla de 4 columnas en computadoras, 2 en tablets y 1 en celular */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            
          {/* 1. Balance en Caja */}
          <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-4 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-300">
            <div className={`absolute top-0 left-0 w-1 h-full ${isNegative ? 'bg-red-600' : 'bg-emerald-500'}`}></div>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Balance en Caja</span>
              <span className="p-2 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-900/40 text-xs">💵</span>
            </div>

            <div>
              <p className={`text-xl sm:text-2xl font-black tracking-tight ${isNegative ? 'text-red-500' : 'text-emerald-400'}`}>
                ${formatMoney(numericCash)}
              </p>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">{isNegative ? 'Déficit (Conciliar)' : 'Liquidez Operativa'}</span>
            </div>
          </div>
     
          {/* 2. Por Cobrar (Pendiente) */}
          <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-4 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Por Cobrar (Pendiente)</span>
              <span className="p-2 bg-amber-950/40 text-amber-400 rounded-lg border border-amber-900/40 text-xs">⏳</span>
            </div>

            <div>
              <p className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                ${formatMoney(outstandingPortfolio)}
              </p>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">{activeLoans} créditos activos</span>
            </div>
          </div>
     
          {/* 3. Utilidad Proyectada */}
          <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-4 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between hover:border-purple-500/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Utilidad Proyectada</span>
              <span className="p-2 bg-purple-950/40 text-purple-400 rounded-lg border border-purple-900/40 text-xs">📈</span>
            </div>

            <div>
              <p className="text-xl sm:text-2xl font-black text-purple-400 tracking-tight">
                ${formatMoney(estimatedProfit)}
              </p>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">ROI Estimado: +{avgROI}%</span>
            </div>
          </div>
     
          {/* 4. Clientes Totales */}
          <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 p-4 rounded-xl shadow-lg overflow-hidden flex flex-col justify-between hover:border-red-600/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Clientes Totales</span>
              <span className="p-2 bg-red-950/40 text-red-400 rounded-lg border border-red-900/40 text-xs">👥</span>
            </div>

            <div>
              <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {stats?.clientsCount || 0}
              </p>
              <span className="text-[11px] text-neutral-400 mt-0.5 block">Ticket Promedio: ${formatMoney(averageTicket)}</span>
            </div>
          </div>
     
      </div>
    </div>
  );
}