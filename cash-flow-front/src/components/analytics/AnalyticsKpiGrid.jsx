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
    <div className="space-y-3">
        
      {/* Mensaje de Conciliación si hay un número negativo */}
      {isNegative && (
        <div className="bg-red-950/60 border border-red-500/80 p-3 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-xl animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-red-900 text-red-300 rounded-lg border border-red-700 text-xs">⚠</span>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-red-400">Atención: Posición Consolidada Negativa</h4>
              <p className="text-[11px] text-neutral-200 mt-0.5">
                Se detectó un saldo en rojo de ${formatMoney(numericCash)}. Es necesario <strong className="text-white underline">conciliar caja</strong>.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase bg-red-600 text-white px-2.5 py-1 rounded-lg shadow whitespace-nowrap">
            Conciliar
          </span>
        </div>
      )}

      {/* Tarjetas de KPIs apiladas una arriba del otra (en columna) */}
      <div className="flex flex-col gap-2.5">
            
          {/* Liquidez / Caja */}
          <div className="relative bg-gradient-to-r from-neutral-900/90 to-neutral-950 border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md overflow-hidden flex items-center justify-between group hover:border-emerald-500/50 transition-all duration-300">
            <div className={`absolute top-0 left-0 w-1 h-full ${isNegative ? 'bg-red-600' : 'bg-emerald-500'}`}></div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-emerald-950/40 text-emerald-400 rounded-lg border border-emerald-900/40 text-xs">💵</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Balance en Caja</span>
                <span className="text-[11px] text-neutral-400">{isNegative ? 'Déficit (Conciliar)' : 'Liquidez Operativa'}</span>
              </div>
            </div>
            <p className={`text-lg sm:text-xl font-black tracking-tight ${isNegative ? 'text-red-500' : 'text-emerald-400'}`}>
              ${formatMoney(numericCash)}
            </p>
          </div>
     
          {/* Cartera en la Calle */}
          <div className="relative bg-gradient-to-r from-neutral-900/90 to-neutral-950 border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md overflow-hidden flex items-center justify-between group hover:border-amber-500/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-950/40 text-amber-400 rounded-lg border border-amber-900/40 text-xs">⏳</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Por Cobrar (Pendiente)</span>
                <span className="text-[11px] text-neutral-400">{activeLoans} créditos activos</span>
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-amber-400 tracking-tight">
              ${formatMoney(outstandingPortfolio)}
            </p>
          </div>
     
          {/* Utilidad Proyectada */}
          <div className="relative bg-gradient-to-r from-neutral-900/90 to-neutral-950 border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md overflow-hidden flex items-center justify-between group hover:border-purple-500/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-purple-950/40 text-purple-400 rounded-lg border border-purple-900/40 text-xs">📈</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Utilidad Proyectada</span>
                <span className="text-[11px] text-neutral-400">ROI Estimado: +{avgROI}%</span>
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-purple-400 tracking-tight">
              ${formatMoney(estimatedProfit)}
            </p>
          </div>
     
          {/* Clientes & Colocación */}
          <div className="relative bg-gradient-to-r from-neutral-900/90 to-neutral-950 border border-neutral-800/80 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md overflow-hidden flex items-center justify-between group hover:border-red-600/50 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-red-950/40 text-red-400 rounded-lg border border-red-900/40 text-xs">👥</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Clientes Totales</span>
                <span className="text-[11px] text-neutral-400">Ticket Promedio: ${formatMoney(averageTicket)}</span>
              </div>
            </div>
            <p className="text-lg sm:text-xl font-black text-white tracking-tight">
              {stats?.clientsCount || 0}
            </p>
          </div>
     
      </div>
    </div>
  );
}