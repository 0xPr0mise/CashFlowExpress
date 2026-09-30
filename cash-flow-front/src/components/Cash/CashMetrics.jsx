export default function CashMetrics({ balances = {}, totalMovements = 0 }) {
  const formatMoney = (amount) => {
    const rounded = Math.round(amount || 0);
    return rounded.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const channels = Object.entries(balances);

  // Calcular el total global consolidado sumando todos los canales
  const globalNetTotal = channels.reduce((acc, [_, data]) => {
    const netVal = Number(data?.net ?? data?.balance ?? data ?? 0);
    return acc + netVal;
  }, 0);

  // Función auxiliar para color numérico: verde si > 0, gris si 0 o negativo
  const getTextColor = (val) => {
    if (val > 0) return "text-emerald-400";
    return "text-neutral-500"; // Gris si es 0 o menor
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
      
      {/* 1. Tarjeta Total Consolidado (En verde si es positivo) */}
      <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl shadow-lg backdrop-blur-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
              Total Consolidado
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <span className="text-[11px] text-neutral-400 block">Caja General Acumulada</span>
        </div>

        <div className="my-2">
          <p className={`text-2xl font-black tracking-tight ${getTextColor(globalNetTotal)}`}>
            ${formatMoney(globalNetTotal)}
          </p>
        </div>

        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
          <span>Transacciones:</span>
          <strong className="text-white font-mono">{totalMovements} ops</strong>
        </div>
      </div>

      {/* 2. Tarjetas Dinámicas por Canal (Efectivo en Rojo, Transferencia en Azul) */}
      {channels.length === 0 ? (
        <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl text-center text-neutral-500 text-xs flex items-center justify-center col-span-2">
          No hay registros de canales de pago activos.
        </div>
      ) : (
        channels.map(([method, data]) => {
          const netValue = Number(data?.net ?? data?.balance ?? (typeof data === 'number' ? data : 0));
          const ingresosVal = Number(data?.ingresos ?? 0);
          const egresosVal = Number(data?.egresos ?? 0);
          
          const isTransfer = method.toUpperCase().includes("TRANSFERENCIA");
          
          // Estilos distintivos: Transferencia en Azul, Efectivo en Rojo
          const borderClass = isTransfer ? "border-l-blue-500" : "border-l-red-500";
          const badgeClass = isTransfer 
            ? "text-blue-400 bg-blue-950/40 border-blue-900/50" 
            : "text-red-400 bg-red-950/40 border-red-900/50";

          return (
            <div
              key={method}
              className={`bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl shadow-lg backdrop-blur-sm border-l-4 ${borderClass} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}>
                    Canal: {method}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${netValue > 0 ? 'bg-emerald-500' : 'bg-neutral-600'}`}></span>
                </div>
                <span className="text-[11px] text-neutral-400 block">Balance Neto del Canal</span>
              </div>

              <div className="my-2">
                <p className={`text-2xl font-black tracking-tight ${getTextColor(netValue)}`}>
                  ${formatMoney(netValue)}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400">
                <span>Ingresos: <strong className="text-emerald-400">+${formatMoney(ingresosVal)}</strong></span>
                <span>Egresos: <strong className="text-red-400">-${formatMoney(egresosVal)}</strong></span>
              </div>
            </div>
          );
        })
      )}

    </div>
  );
}