export default function AnalyticsCharts({ stats, calculations }) {
  const { 
    totalLent = 0, 
    totalCollected = 0, 
    expectedReturn = 0, 
    collectionRate = 0, 
    activeLoans = 0, 
    paidLoans = 0, 
    activePercentage = 0, 
    paidPercentage = 0,
    lateLoansCount = 0,
    defaultRate = 0,
    totalLateAmount = 0
  } = calculations || {};

  const loansArray = stats?.loans || [];
  const activePreset = stats?.preset || "all";
  const customStartDate = stats?.startDate ? new Date(stats.startDate) : null;
  const customEndDate = stats?.endDate ? new Date(stats.endDate) : null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let rangeStart = new Date(now);
  let rangeEnd = new Date(now);

  if (activePreset === "today") {
    rangeStart = new Date(now);
    rangeEnd = new Date(now);
    rangeEnd.setHours(23, 59, 59, 999);
  } else if (activePreset === "week") {
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    rangeStart = new Date(now);
    rangeStart.setDate(now.getDate() - dayOfWeek);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 6);
    rangeEnd.setHours(23, 59, 59, 999);
  } else if (activePreset === "month") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else if (activePreset === "custom" && customStartDate && customEndDate) {
    rangeStart = new Date(customStartDate);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(customEndDate);
    rangeEnd.setHours(23, 59, 59, 999);
  } else {
    rangeStart = new Date(1970, 0, 1);
    rangeEnd = new Date(2099, 11, 31);
  }

  let upcomingAmount = 0;
  let upcomingCount = 0;

  loansArray.forEach(loan => {
    if (loan && (loan.status === 'ACTIVO' || loan.status === 'ACTIVE' || !loan.status)) {
      const paidSum = (loan.payments || []).reduce((pAcc, p) => pAcc + (Number(p?.amount) || 0), 0);
      const pendingLoanBalance = (Number(loan.totalToPay) || Number(loan.totalAmount) || 0) - paidSum;
      const installmentsList = loan.installments || loan.cuotas || [];

      if (installmentsList.length > 0) {
        installmentsList.forEach(inst => {
          if (inst) {
            const rawDate = inst.dueDate || inst.vencimiento || inst.date || inst.fecha;
            const isPaid = inst.status === 'PAGADA' || inst.pagada === true || inst.isPaid === true;
            
            if (rawDate && !isPaid) {
              const cleanDateStr = typeof rawDate === 'string' ? rawDate.split('T')[0] : rawDate;
              const d = new Date(cleanDateStr + 'T00:00:00');

              if (!isNaN(d.getTime()) && d >= rangeStart && d <= rangeEnd) {
                upcomingAmount += (Number(inst.amount) || Number(inst.cuota) || (pendingLoanBalance / installmentsList.length));
                upcomingCount++;
              }
            }
          }
        });
      } else if (pendingLoanBalance > 0 && loan.dueDate) {
        const cleanDateStr = typeof loan.dueDate === 'string' ? loan.dueDate.split('T')[0] : loan.dueDate;
        const d = new Date(cleanDateStr + 'T00:00:00');
        if (!isNaN(d.getTime()) && d >= rangeStart && d <= rangeEnd) {
          upcomingAmount += pendingLoanBalance;
          upcomingCount++;
        }
      }
    }
  });

  const totalPending = Math.max(0, expectedReturn - totalCollected);
  upcomingAmount = Math.min(upcomingAmount, totalPending);

  const remainingRate = Math.max(0, 100 - collectionRate);
  const upcomingBarPercentage = expectedReturn > 0 ? Math.min(100, (upcomingAmount / expectedReturn) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
      {/* Bloque Izquierdo: Flujo de Capital y Eficiencia de Cobro */}
      <div className="lg:col-span-2 bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Flujo de Capital y Eficiencia de Cobro
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-black rounded-lg border border-neutral-800 text-neutral-400">
              Global: <strong className="text-white">{collectionRate}%</strong>
            </span>
          </div>
          <p className="text-xs text-neutral-400 mb-4 sm:mb-6">
            Desglose estructural entre capital colocado bruto, capital ingresado por recaudación y retorno total proyectado.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 my-auto">
          {/* Barra 1 */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Capital Inicial Colocado
              </span>
              <span className="text-purple-400 font-bold">
                ${Number(totalLent).toLocaleString("es-AR", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800 p-0.5">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-1000 shadow-lg shadow-purple-950" style={{ width: "100%" }}></div>
            </div>
          </div>

          {/* Barra 2: Dinero Real Recaudado */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                Dinero Real Recaudado
              </span>
              <span className="text-red-400 font-bold">
                ${Number(totalCollected).toLocaleString("es-AR", { maximumFractionDigits: 2 })} ({collectionRate}%)
              </span>
            </div>
            <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800 p-0.5 flex gap-0.5">
              <div 
                className="bg-gradient-to-r from-red-700 to-red-500 h-full rounded-l-full transition-all duration-1000" 
                style={{ width: `${collectionRate}%` }}
              ></div>
              <div 
                className="bg-neutral-800/80 h-full rounded-r-full transition-all duration-1000" 
                style={{ width: `${remainingRate}%` }}
              ></div>
            </div>
          </div>

          {/* Barra 3 */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Retorno Proyectado Total
              </span>
              <span className="text-emerald-400 font-bold">
                ${Number(expectedReturn).toLocaleString("es-AR", { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800 p-0.5">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: "100%" }}></div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
          <span>Velocidad de recupero de capital estimada</span>
          <span className="text-neutral-300 font-semibold bg-black px-2.5 py-1 rounded-lg border border-neutral-800">
            Salud: <strong className={lateLoansCount > 0 ? "text-amber-400" : "text-emerald-400"}>
              {lateLoansCount > 0 ? "Atención requerida ⚠️" : "Óptima 🚀"}
            </strong>
          </span>
        </div>
      </div>

      {/* Bloque Derecho: Salud de Cartera y Riesgo */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1">
            Salud de Cartera y Riesgo
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Proporción de créditos vigentes, liquidados y nivel de atrasos.
          </p>
        </div>

        <div className="space-y-3 my-auto">
          {/* Activos */}
          <div className="bg-black/50 border border-neutral-800/80 p-2.5 rounded-lg shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="text-xs font-semibold text-neutral-300">Activos en Curso</span>
              </div>
              <span className="text-xs font-bold text-amber-400">
                {activeLoans} ({activePercentage}%)
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${activePercentage}%` }}></div>
            </div>
          </div>

          {/* Pagados */}
          <div className="bg-black/50 border border-neutral-800/80 p-2.5 rounded-lg shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-xs font-semibold text-neutral-300">Liquidados / Pagados</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">
                {paidLoans} ({paidPercentage}%)
              </span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${paidPercentage}%` }}></div>
            </div>
          </div>

          {/* Próximos a Vencer */}
          <div className="bg-black/50 border border-sky-950/40 p-2.5 rounded-lg shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
                <span className="text-xs font-semibold text-neutral-300">Próximos a Vencer</span>
              </div>
              <span className="text-xs font-bold text-sky-400">
                {upcomingCount} cuotas
              </span>
            </div>
            <div className="text-[10px] text-sky-300/80 font-medium mb-1.5">
              Por cobrar: ${Number(upcomingAmount).toLocaleString("es-AR", { maximumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, upcomingBarPercentage)}%` }}></div>
            </div>
          </div>

          {/* Atrasados / Vencidos */}
          <div className="bg-black/50 border border-rose-950/40 p-2.5 rounded-lg shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-neutral-300">Préstamos Atrasados</span>
              </div>
              <span className="text-xs font-bold text-rose-400">
                {lateLoansCount} ({defaultRate}%)
              </span>
            </div>
            <div className="text-[10px] text-rose-400/80 font-medium mb-1.5">
              Deuda vencida: ${Number(totalLateAmount).toLocaleString("es-AR", { maximumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${defaultRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2.5 border-t border-neutral-800/80 text-center">
          <span className="text-[11px] text-neutral-500">
            Historial acumulado: <strong className="text-neutral-300">{stats?.totalLoansCount || 0} operaciones</strong>
          </span>
        </div>
      </div>

    </div>
  );
}