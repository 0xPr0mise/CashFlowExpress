export default function AnalyticsKpiGrid({ stats, calculations }) {
    const { cashBalance, outstandingPortfolio, estimatedProfit, avgROI, averageTicket, activeLoans } = calculations;
  
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Liquidez / Caja */}
        <div className="relative bg-gradient-to-b from-neutral-900/80 to-neutral-950 border border-neutral-800/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Balance en Caja</span>
            <span className="p-2 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-900/40 text-xs">💵</span>
          </div>
          <p className="text-3xl font-black text-emerald-400 tracking-tight">
            ${cashBalance.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-3">
            <span>Liquidez disponible</span>
            <span className="text-emerald-400 font-semibold">Operativa</span>
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
            ${outstandingPortfolio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
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
            ${estimatedProfit.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
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
            {stats.clientsCount}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/60 pt-3">
            <span>Ticket Promedio</span>
            <span className="text-neutral-200 font-semibold">${averageTicket.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
  
      </div>
    );
  }