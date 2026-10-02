export default function CashMetrics({ balances = {}, totalMovements = 0 }) {
  const formatMoney = (amount) => {
    const rounded = Math.round(amount || 0);
    return rounded.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const channels = Object.entries(balances);

  const globalNetTotal = channels.reduce((acc, [_, data]) => {
    const netVal = Number(data?.net ?? data?.balance ?? data ?? 0);
    return acc + netVal;
  }, 0);

  const isNegativeCash = globalNetTotal < 0;

  const getTextColor = (val) => {
    if (val > 0) return "text-emerald-400";
    if (val < 0) return "text-red-500";
    return "text-neutral-500";
  };

  return (
    <div className="w-full space-y-3.5 sm:space-y-4">
      
      {/* Alerta de Conciliación de Caja (Adaptada para apilarse en móvil) */}
      {isNegativeCash && (
        <div className="bg-red-950/60 border border-red-500/80 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-2xl animate-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 bg-red-900 text-red-300 rounded-xl border border-red-700 text-sm flex-shrink-0 mt-0.5 sm:mt-0">⚠</span>
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-red-400">Atención: Posición Consolidada Negativa</h4>
              <p className="text-[11px] sm:text-xs text-neutral-200 mt-0.5 leading-relaxed">
                Se detectó un saldo global en rojo de ${formatMoney(globalNetTotal)}. Es necesario <strong className="text-white underline">conciliar caja</strong> para normalizar los registros.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-red-600 text-white px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap self-end sm:self-center">
            Conciliar Caja
          </span>
        </div>
      )}

      {/* Cuadrícula de Métricas (1 columna en móvil, 3 columnas en pantallas medianas+) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* 1. Tarjeta Total Consolidado */}
        <div className={`bg-neutral-900/80 border border-neutral-800 p-4 sm:p-5 rounded-xl shadow-lg backdrop-blur-sm border-l-4 ${isNegativeCash ? 'border-l-red-600' : 'border-l-emerald-500'} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isNegativeCash ? 'text-red-400 bg-red-950/40 border-red-900/50' : 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50'} px-2 py-0.5 rounded border`}>
                Total Consolidado
              </span>
              <span className={`w-2 h-2 rounded-full ${isNegativeCash ? 'bg-red-600 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
            </div>
            <span className="text-[11px] text-neutral-400 block">Caja General Acumulada</span>
          </div>

          <div className="my-2.5 sm:my-3">
            <p className={`text-2xl sm:text-3xl font-black tracking-tight truncate ${getTextColor(globalNetTotal)}`}>
              ${formatMoney(globalNetTotal)}
            </p>
          </div>
        </div>

        {/* 2. Tarjetas Dinámicas por Canal */}
        {channels.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl text-center text-neutral-500 text-xs flex items-center justify-center col-span-1 md:col-span-2">
            No hay registros de canales de pago activos.
          </div>
        ) : (
          channels.map(([method, data]) => {
            const netValue = Number(data?.net ?? data?.balance ?? (typeof data === 'number' ? data : 0));
            const isTransfer = method.toUpperCase().includes("TRANSFERENCIA");
            const isChannelNegative = netValue < 0;
            
            const borderClass = isChannelNegative ? "border-l-red-600" : (isTransfer ? "border-l-blue-500" : "border-l-red-500");
            const badgeClass = isTransfer 
              ? "text-blue-400 bg-blue-950/40 border-blue-900/50" 
              : "text-red-400 bg-red-950/40 border-red-900/50";

            return (
              <div
                key={method}
                className={`bg-neutral-900/80 border border-neutral-800 p-4 sm:p-5 rounded-xl shadow-lg backdrop-blur-sm border-l-4 ${borderClass} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border truncate max-w-[75%] ${badgeClass}`}>
                      Canal: {method}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${netValue > 0 ? 'bg-emerald-500' : (isChannelNegative ? 'bg-red-600' : 'bg-neutral-600')}`}></span>
                  </div>
                  <span className="text-[11px] text-neutral-400 block">Balance Neto del Canal</span>
                </div>

                <div className="my-2.5 sm:my-3">
                  <p className={`text-2xl sm:text-3xl font-black tracking-tight truncate ${getTextColor(netValue)}`}>
                    ${formatMoney(netValue)}
                  </p>
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}