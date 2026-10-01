export default function AnalyticsCharts({ stats, calculations }) {
  const { 
    totalLent, 
    totalCollected, 
    expectedReturn, 
    collectionRate, 
    activeLoans, 
    paidLoans, 
    activePercentage, 
    paidPercentage,
    lateLoansCount = 0,
    defaultRate = 0,
    totalLateAmount = 0
  } = calculations;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
      {/* Bloque Izquierdo: Analítica de Inversión y Recaudación */}
      <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Flujo de Capital y Eficiencia de Cobro
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-black rounded-lg border border-neutral-800 text-neutral-400">
              Global: <strong className="text-white">{collectionRate}%</strong>
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-6">
            Desglose estructural entre capital colocado bruto, capital ingresado por recaudación y retorno total proyectado con tasas.
          </p>
        </div>
 
        <div className="space-y-6 my-auto">
          {/* Barra 1 */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Capital Inicial Colocado
              </span>
              <span className="text-purple-400 font-bold">
                ${totalLent.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-black rounded-full h-3.5 overflow-hidden border border-neutral-800 p-0.5">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-1000 shadow-lg shadow-purple-950" style={{ width: "100%" }}></div>
            </div>
          </div>
 
          {/* Barra 2 */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                Dinero Real Recaudado a la Fecha
              </span>
              <span className="text-red-400 font-bold">
                ${totalCollected.toLocaleString("es-AR", { maximumFractionDigits: 2 })} ({collectionRate}%)
              </span>
            </div>
            <div className="w-full bg-black rounded-full h-3.5 overflow-hidden border border-neutral-800 p-0.5">
              <div className="bg-gradient-to-r from-red-700 to-red-500 h-full rounded-full transition-all duration-1000 shadow-lg shadow-red-950" style={{ width: `${collectionRate}%` }}></div>
            </div>
          </div>
 
          {/* Barra 3 */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Retorno Proyectado Total (Capital + Intereses)
              </span>
              <span className="text-emerald-400 font-bold">
                ${expectedReturn.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-black rounded-full h-3.5 overflow-hidden border border-neutral-800 p-0.5">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-lg shadow-emerald-950" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>
 
        <div className="mt-8 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
          <span>Velocidad de recupero de capital estimada</span>
          <span className="text-neutral-300 font-semibold bg-black px-3 py-1.5 rounded-xl border border-neutral-800">
            Salud Financiera: <strong className={lateLoansCount > 0 ? "text-amber-400" : "text-emerald-400"}>
              {lateLoansCount > 0 ? "Atención requerida ⚠️" : "Óptima 🚀"}
            </strong>
          </span>
        </div>
      </div>
 
      {/* Bloque Derecho: Salud de Cartera y Riesgo */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight mb-1">
            Salud de Cartera y Riesgo
          </h3>
          <p className="text-xs text-neutral-400 mb-6">
            Proporción de créditos vigentes, liquidados y nivel de atrasos actuales.
          </p>
        </div>
 
        <div className="space-y-4 my-auto">
          {/* Activos */}
          <div className="bg-black/50 border border-neutral-800/80 p-3.5 rounded-xl shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                <span className="text-xs font-semibold text-neutral-300">Activos en Curso</span>
              </div>
              <span className="text-xs font-bold text-amber-400">
                {activeLoans} ({activePercentage}%)
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${activePercentage}%` }}></div>
            </div>
          </div>
 
          {/* Pagados */}
          <div className="bg-black/50 border border-neutral-800/80 p-3.5 rounded-xl shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <span className="text-xs font-semibold text-neutral-300">Liquidados / Pagados</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {paidLoans} ({paidPercentage}%)
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${paidPercentage}%` }}></div>
            </div>
          </div>

          {/* Atrasados / Vencidos */}
          <div className="bg-black/50 border border-rose-950/40 p-3.5 rounded-xl shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-neutral-300">Préstamos Atrasados</span>
              </div>
              <span className="text-xs font-bold text-rose-400">
                {lateLoansCount} ({defaultRate}%)
              </span>
            </div>
            <div className="text-[10px] text-rose-400/80 font-medium mb-2">
              Deuda vencida: ${totalLateAmount.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${defaultRate}%` }}></div>
            </div>
          </div>
        </div>
 
        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center">
          <span className="text-xs text-neutral-500">
            Historial acumulado: <strong className="text-neutral-300">{stats.totalLoansCount} operaciones</strong>
          </span>
        </div>
      </div>
 
    </div>
  );
}