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
    <div className="space-y-4">
        
      {/* Mensaje de Conciliación si hay un número negativo */}
      {isNegative && (
        <div className="bg-red-950/60 border border-red-500/80 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-red-900 text-red-300 rounded-xl border border-red-700 text-sm">⚠</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Atención: Posición Consolidada Negativa</h4>
              <p className="text-xs text-neutral-200 mt-0.5">
                Se detectó un saldo en rojo de ${formatMoney(numericCash)}. Es necesario <strong className="text-white underline">conciliar caja</strong> para normalizar los registros.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
            Conciliar Caja
          </span>
        </div>
      )}

      {/* Grilla de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
          {/* Liquidez / Caja */}
          <div className="relative bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isNegative ? 'bg-red-600' : 'bg-emerald-500'}`}></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Balance en Caja</span>
              <span className="p-2 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-900/40 text-xs">💵</span>
            </div>
            <p className={`text-3xl font-black tracking-tight ${isNegative ? 'text-red-500' : 'text-emerald-400'}`}>
              ${formatMoney(numericCash)}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-3">
              <span>Liquidez disponible</span>
              <span className={isNegative ? 'text-red-500 font-semibold' : 'text-emerald-400 font-semibold'}>
                {isNegative ? 'Déficit (Conciliar)' : 'Operativa'}
              </span>
            </div>
          </div>
     
          {/* Cartera en la Calle */}
          <div className="relative bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Por Cobrar (Pendiente)</span>
              <span className="p-2 bg-amber-950/40 text-amber-400 rounded-xl border border-amber-900/40 text-xs">⏳</span>
            </div>
            <p className="text-3xl font-black text-amber-400 tracking-tight">
              ${formatMoney(outstandingPortfolio)}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-3">
              <span>Préstamos Activos</span>
              <span className="text-amber-400 font-semibold">{activeLoans} créditos</span>
            </div>
          </div>
     
          {/* Utilidad Proyectada */}
          <div className="relative bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Utilidad Proyectada</span>
              <span className="p-2 bg-purple-950/40 text-purple-400 rounded-xl border border-purple-900/40 text-xs">📈</span>
            </div>
            <p className="text-3xl font-black text-purple-400 tracking-tight">
              ${formatMoney(estimatedProfit)}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-3">
              <span>ROI Estimado Cartera</span>
              <span className="text-purple-400 font-semibold">+{avgROI}%</span>
            </div>
          </div>
     
          {/* Clientes & Colocación */}
          <div className="relative bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden group hover:border-red-600/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Clientes Totales</span>
              <span className="p-2 bg-red-950/40 text-red-400 rounded-xl border border-red-900/40 text-xs">👥</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">
              {stats?.clientsCount || 0}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-3">
              <span>Ticket Promedio</span>
              <span className="text-neutral-200 font-semibold">${formatMoney(averageTicket)}</span>
            </div>
          </div>
     
      </div>
    </div>
  );
}