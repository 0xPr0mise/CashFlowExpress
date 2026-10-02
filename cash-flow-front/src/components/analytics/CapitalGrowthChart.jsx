import { useState, useMemo, useEffect } from "react";

export default function CapitalGrowthChart({ loans = [] }) {
  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "month"
  const [dayRange, setDayRange] = useState(14); // Rango dinámico de días para el zoom (por defecto 14)
  const [showDaySlider, setShowDaySlider] = useState(false); // Controla la visibilidad manual del slider en modo "Días"
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);

  // Cerrar el popup si se hace clic fuera del gráfico
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".growth-chart-container")) {
        setSelectedPointIndex(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleViewModeChange = (mode) => {
    setSelectedPointIndex(null);
    if (mode === "day") {
      if (viewMode === "day") {
        // Si ya estaba en "day" y vuelve a hacer clic, alterna la visibilidad del slider
        setShowDaySlider((prev) => !prev);
      } else {
        // Si cambia a "day" por primera vez, activa la vista pero mantiene el slider oculto hasta el segundo toque
        setViewMode("day");
        setShowDaySlider(false);
      }
    } else {
      // Si cambia a otra vista (semanas/meses), oculta y resetea el slider
      setViewMode(mode);
      setShowDaySlider(false);
    }
  };

  const chartData = useMemo(() => {
    if (!Array.isArray(loans) || loans.length === 0) return [];

    const events = [];

    loans.forEach((loan) => {
      if (loan.status === 'REFINANCIADO') return;

      const capital = Number(loan.amount) || 0;
      const totalToPay = Number(loan.totalToPay) || capital;
      const totalInterest = Math.max(0, totalToPay - capital);

      const rawCreatedDate = loan.createdAt;
      if (!rawCreatedDate || capital <= 0) return;

      const createdDateObj = new Date(rawCreatedDate);
      if (isNaN(createdDateObj.getTime())) return;

      // 1. EVENTO DE ENTRADA: Capital Colocado
      events.push({
        timestamp: createdDateObj.getTime(),
        dateObj: new Date(createdDateObj.getFullYear(), createdDateObj.getMonth(), createdDateObj.getDate()),
        capitalDelta: capital,
        projectedUtilityDelta: 0,
        collectedUtilityDelta: 0,
      });

      // 2. UTILIDAD PROYECTADA
      let installmentsList = loan.installments || loan.cuotas || [];

      if (totalInterest > 0) {
        if (installmentsList.length > 0) {
          const interestPerInstallment = totalInterest / installmentsList.length;
          installmentsList.forEach((inst) => {
            const rawInstDate = inst.dueDate || inst.vencimiento || inst.date;
            if (rawInstDate) {
              const instDateObj = new Date(rawInstDate);
              if (!isNaN(instDateObj.getTime())) {
                events.push({
                  timestamp: instDateObj.getTime(),
                  dateObj: new Date(instDateObj.getFullYear(), instDateObj.getMonth(), instDateObj.getDate()),
                  capitalDelta: 0,
                  projectedUtilityDelta: interestPerInstallment,
                  collectedUtilityDelta: 0,
                });
              }
            }
          });
        } else {
          const count = Number(loan.installmentsCount) || 30;
          const interestPerDay = totalInterest / count;

          for (let i = 1; i <= count; i++) {
            const dayTime = createdDateObj.getTime() + i * 24 * 60 * 60 * 1000;
            const dayDate = new Date(dayTime);
            events.push({
              timestamp: dayTime,
              dateObj: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()),
              capitalDelta: 0,
              projectedUtilityDelta: interestPerDay,
              collectedUtilityDelta: 0,
            });
          }
        }
      }

      // 3. UTILIDAD COBRADA (Pagos reales)
      const paymentsList = loan.payments || [];
      let cumulativePaid = 0;
      const interestRatio = totalToPay > 0 ? totalInterest / totalToPay : 0;

      paymentsList.forEach((payment) => {
        const rawPayDate = payment.createdAt || payment.date;
        const payAmount = Number(payment.amount) || 0;

        if (rawPayDate && payAmount > 0) {
          const payDateObj = new Date(rawPayDate);
          if (!isNaN(payDateObj.getTime())) {
            cumulativePaid += payAmount;
            const collectedInterestForThisPayment = payAmount * interestRatio;

            events.push({
              timestamp: payDateObj.getTime(),
              dateObj: new Date(payDateObj.getFullYear(), payDateObj.getMonth(), payDateObj.getDate()),
              capitalDelta: 0,
              projectedUtilityDelta: 0,
              collectedUtilityDelta: collectedInterestForThisPayment,
            });
          }
        }
      });

      // 4. SALIDA DE CAPITAL
      const isPaid = loan.status === 'PAGADO' || cumulativePaid >= totalToPay;
      if (isPaid && capital > 0) {
        const lastPaymentDate = paymentsList.length > 0 
          ? new Date(paymentsList[paymentsList.length - 1].createdAt) 
          : createdDateObj;

        if (!isNaN(lastPaymentDate.getTime())) {
          events.push({
            timestamp: lastPaymentDate.getTime() + 1000,
            dateObj: new Date(lastPaymentDate.getFullYear(), lastPaymentDate.getMonth(), lastPaymentDate.getDate()),
            capitalDelta: -capital,
            projectedUtilityDelta: 0,
            collectedUtilityDelta: 0,
          });
        }
      }
    });

    if (events.length === 0) return [];

    events.sort((a, b) => a.timestamp - b.timestamp);

    let accumulatedCapital = 0;
    let accumulatedProjectedUtility = 0;
    let accumulatedCollectedUtility = 0;
    const timelineMap = {};

    events.forEach((ev) => {
      const d = ev.dateObj;
      let key = "";
      let label = "";

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      if (viewMode === "day") {
        key = `${year}-${month}-${day}`;
        label = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
      } else if (viewMode === "week") {
        const firstDayOfWeek = new Date(d);
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        key = `${firstDayOfWeek.getFullYear()}-${String(firstDayOfWeek.getMonth() + 1).padStart(2, "0")}-${String(firstDayOfWeek.getDate()).padStart(2, "0")}`;
        label = `Sem ${firstDayOfWeek.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}`;
      } else {
        key = `${year}-${month}`;
        label = d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
      }

      const deltaCap = ev.capitalDelta || 0;
      const deltaProj = ev.projectedUtilityDelta || 0;
      const deltaColl = ev.collectedUtilityDelta || 0;

      accumulatedCapital += deltaCap;
      accumulatedProjectedUtility += deltaProj;
      accumulatedCollectedUtility += deltaColl;

      if (accumulatedCapital < 0) accumulatedCapital = 0;
      if (accumulatedProjectedUtility < 0) accumulatedProjectedUtility = 0;
      if (accumulatedCollectedUtility < 0) accumulatedCollectedUtility = 0;

      if (timelineMap[key]) {
        timelineMap[key].capitalColocado = accumulatedCapital;
        timelineMap[key].utilidadProyectada = accumulatedProjectedUtility;
        timelineMap[key].utilidadCobrada = accumulatedCollectedUtility;
        timelineMap[key].periodDeltaProj += deltaProj;
        timelineMap[key].periodDeltaColl += deltaColl;
      } else {
        timelineMap[key] = {
          period: label.charAt(0).toUpperCase() + label.slice(1),
          timestamp: new Date(key).getTime() || d.getTime(),
          capitalColocado: accumulatedCapital,
          utilidadProyectada: accumulatedProjectedUtility,
          utilidadCobrada: accumulatedCollectedUtility,
          periodDeltaProj: deltaProj,
          periodDeltaColl: deltaColl,
        };
      }
    });

    let processedData = Object.values(timelineMap).sort((a, b) => a.timestamp - b.timestamp);

    if (viewMode === "day") {
      const todayTime = new Date().setHours(0, 0, 0, 0);
      const futureIndex = processedData.findIndex(d => d.timestamp >= todayTime);
      const centerIndex = futureIndex !== -1 ? futureIndex : processedData.length - 1;
      
      const halfRange = Math.floor(dayRange / 2);
      const start = Math.max(0, centerIndex - halfRange);
      const end = Math.min(processedData.length, start + dayRange);
      processedData = processedData.slice(start, end);
    } else if (viewMode === "month") {
      if (processedData.length > 4) {
        processedData = processedData.slice(-4);
      }
    }

    return processedData;
  }, [loans, viewMode, dayRange]);

  const formatMoney = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "$0";
    return Number(value).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  };

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 100;
    const maxCap = Math.max(...chartData.map((d) => d.capitalColocado), 0);
    const maxProj = Math.max(...chartData.map((d) => d.utilidadProyectada), 0);
    const maxColl = Math.max(...chartData.map((d) => d.utilidadCobrada), 0);
    return Math.max(maxCap, maxProj, maxColl, 100);
  }, [chartData]);

  const svgWidth = 750;
  const svgHeight = 230;
  const padding = 45;

  const getPoints = (dataKey) => {
    if (chartData.length === 0) return "";
    return chartData.map((d, index) => {
      const x = padding + (index / (chartData.length - 1 || 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - (d[dataKey] / maxVal) * (svgHeight - padding * 2);
      return `${x},${isNaN(y) ? svgHeight - padding : y}`;
    }).join(" ");
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5 growth-chart-container relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            📈 Crecimiento de Capital y Utilidad en el Tiempo
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Haz clic en cualquier punto del gráfico para ver el detalle de capital y utilidades.
          </p>
        </div>

        {/* Selector de Vista */}
        <div className="flex items-center bg-black/60 border border-neutral-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => handleViewModeChange("day")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === "day" ? "bg-neutral-800 text-white shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Días {viewMode === "day" && showDaySlider && " ⚙️"}
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("week")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === "week" ? "bg-neutral-800 text-white shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Semanas
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("month")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === "month" ? "bg-neutral-800 text-white shadow-md" : "text-neutral-400 hover:text-white"
            }`}
          >
            Meses
          </button>
        </div>
      </div>

      {/* Control Slider desplegable condicional */}
      <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
        viewMode === "day" && showDaySlider ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0 mb-0"
      }`}>
        <div className="overflow-hidden">
          <div className="flex items-center gap-3 bg-neutral-950/40 border border-neutral-800/60 px-4 py-2.5 rounded-xl text-xs">
            <span className="text-neutral-400 font-medium whitespace-nowrap">🔍 Zoom Días:</span>
            <input
              type="range"
              min="7"
              max="45"
              step="1"
              value={dayRange}
              onChange={(e) => setDayRange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer bg-neutral-800 h-1.5 rounded-lg"
            />
            <span className="text-amber-400 font-bold whitespace-nowrap min-w-[50px] text-right">
              {dayRange} días
            </span>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-5 text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-purple-400">
          <span className="w-3 h-1 bg-purple-500 rounded-full inline-block"></span> Capital Colocado
        </span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span> Utilidad Cobrada (Real)
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-3 h-1 bg-amber-500 rounded-full inline-block"></span> Utilidad Proyectada
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-neutral-500 text-xs space-y-1">
          <span>No hay eventos temporales suficientes para trazar las líneas de tendencia.</span>
        </div>
      ) : (
        <div className="w-full overflow-x-auto relative">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-60 overflow-visible">
            {/* Guías horizontales */}
            {[0, 0.5, 1].map((ratio, i) => {
              const y = padding + ratio * (svgHeight - padding * 2);
              const val = maxVal * (1 - ratio);
              return (
                <g key={i}>
                  <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="#262626" strokeDasharray="4 4" />
                  <text x={padding - 10} y={y + 4} fill="#737373" fontSize="10" textAnchor="end">
                    {val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val.toFixed(0)}`}
                  </text>
                </g>
              );
            })}

            {/* Líneas del Gráfico */}
            <polyline fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={getPoints("capitalColocado")} />
            <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={getPoints("utilidadCobrada")} />
            <polyline fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" points={getPoints("utilidadProyectada")} />

            {/* Puntos interactivos por click */}
            {chartData.map((d, index) => {
              const x = padding + (index / (chartData.length - 1 || 1)) * (svgWidth - padding * 2);
              const yCap = svgHeight - padding - (d.capitalColocado / maxVal) * (svgHeight - padding * 2);
              const yColl = svgHeight - padding - (d.utilidadCobrada / maxVal) * (svgHeight - padding * 2);
              const yProj = svgHeight - padding - (d.utilidadProyectada / maxVal) * (svgHeight - padding * 2);
              const isSelected = selectedPointIndex === index;

              return (
                <g key={index} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedPointIndex(isSelected ? null : index); }}>
                  <circle cx={x} cy={yCap} r={isSelected ? "5.5" : "3.5"} fill={isSelected ? "#ffffff" : "#a855f7"} stroke={isSelected ? "#a855f7" : "none"} strokeWidth="2" />
                  <circle cx={x} cy={yColl} r={isSelected ? "5.5" : "3.5"} fill={isSelected ? "#ffffff" : "#10b981"} stroke={isSelected ? "#10b981" : "none"} strokeWidth="2" />
                  <circle cx={x} cy={yProj} r={isSelected ? "5.5" : "3.5"} fill={isSelected ? "#ffffff" : "#fbbf24"} stroke={isSelected ? "#fbbf24" : "none"} strokeWidth="2" />

                  <text x={x} y={svgHeight - 12} fill="#737373" fontSize="9" textAnchor="middle">
                    {d.period}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Ventana flotante (Popup) vinculada al punto seleccionado */}
          {selectedPointIndex !== null && chartData[selectedPointIndex] && (() => {
            const d = chartData[selectedPointIndex];

            return (
              <div 
                className="absolute top-14 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-neutral-900/95 border border-purple-500/60 p-3.5 rounded-2xl shadow-2xl text-[11px] space-y-2.5 sm:w-60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">📅 {d.period}</span>
                  <button 
                    onClick={() => setSelectedPointIndex(null)}
                    className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 rounded-lg bg-neutral-800 cursor-pointer"
                  >
                    ✕ Cerrar
                  </button>
                </div>
                <div className="space-y-1.5">
                  <p className="text-purple-400 flex justify-between items-center">
                    <span>Cap. Colocado:</span> <span className="font-bold text-white">{formatMoney(d.capitalColocado)}</span>
                  </p>
                  <p className="text-emerald-400 flex justify-between items-center">
                    <span>Cobrado (Acum):</span> <span className="font-semibold">{formatMoney(d.utilidadCobrada)}</span>
                  </p>
                  <p className="text-amber-400 flex justify-between items-center">
                    <span>Proyectada:</span> <span className="font-semibold">{formatMoney(d.utilidadProyectada)}</span>
                  </p>
                </div>
                {(d.periodDeltaProj > 0 || d.periodDeltaColl > 0) && (
                  <div className="border-t border-neutral-800/80 pt-1.5 text-[10px] space-y-0.5">
                    {d.periodDeltaProj > 0 && <p className="text-amber-300">+{formatMoney(d.periodDeltaProj)} proyectados</p>}
                    {d.periodDeltaColl > 0 && <p className="text-emerald-300">+{formatMoney(d.periodDeltaColl)} cobrados</p>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}