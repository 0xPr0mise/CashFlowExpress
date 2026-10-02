import { useState, useMemo, useEffect } from "react";

export default function CashFlowChart({ movements = [], loans = [], currentCashBalance = 0 }) {
  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "month"
  const [dayRange, setDayRange] = useState(14);
  const [showDaySlider, setShowDaySlider] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);

  // Cerrar el popup si se hace clic fuera del gráfico
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".chart-container")) {
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
        setShowDaySlider((prev) => !prev);
      } else {
        setViewMode("day");
        setShowDaySlider(false);
      }
    } else {
      setViewMode(mode);
      setShowDaySlider(false);
    }
  };

  const chartData = useMemo(() => {
    const timelineMap = {};
    const nowTime = new Date().setHours(0, 0, 0, 0);

    // 1. Procesar Movimientos de Caja (Ingresos y Egresos reales)
    if (Array.isArray(movements)) {
      movements.forEach((mov) => {
        const rawDate = mov.createdAt || mov.date || mov.fecha;
        const amount = Number(mov.amount) || Number(mov.monto) || 0;
        const type = (mov.type || mov.tipo || "").toUpperCase();
        
        const isExpense = type === 'EGRESO' || type === 'OUTFLOW' || type === 'EXPENSE' || type === 'WITHDRAWAL' || amount < 0;
        const isIncome = type === 'INGRESO' || type === 'INCOME' || type === 'DEPOSIT' || amount > 0;
        const absAmount = Math.abs(amount);

        if (!rawDate || absAmount === 0) return;
        const dateObj = new Date(rawDate);
        if (isNaN(dateObj.getTime())) return;

        const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (!timelineMap[key]) {
          timelineMap[key] = {
            timestamp: d.getTime(),
            dateObj: d,
            dailyIncome: 0,
            dailyExpense: 0,
            futureIncome: 0,
          };
        }

        if (isExpense) {
          timelineMap[key].dailyExpense += absAmount;
        } else if (isIncome) {
          timelineMap[key].dailyIncome += absAmount;
        }
      });
    }

    // 2. Procesar Préstamos (Capital Proyectado Futuro)
    if (Array.isArray(loans)) {
      loans.forEach((loan) => {
        if (loan.status === 'REFINANCIADO') return;

        const paidSum = (loan.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const totalToPay = Number(loan.totalToPay) || Number(loan.totalAmount) || 0;
        const pendingAmount = Math.max(0, totalToPay - paidSum);

        if (pendingAmount > 0 && loan.dueDate) {
          const dueDateObj = new Date(loan.dueDate);
          if (!isNaN(dueDateObj.getTime())) {
            const d = new Date(dueDateObj.getFullYear(), dueDateObj.getMonth(), dueDateObj.getDate());
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            if (!timelineMap[key]) {
              timelineMap[key] = {
                timestamp: d.getTime(),
                dateObj: d,
                dailyIncome: 0,
                dailyExpense: 0,
                futureIncome: 0,
              };
            }
            timelineMap[key].futureIncome += pendingAmount;
          }
        }
      });
    }

    let rawArray = Object.values(timelineMap);
    if (rawArray.length === 0) return [];

    rawArray.sort((a, b) => a.timestamp - b.timestamp);

    // 3. Reconstrucción histórica basada en caja actual
    const aggregatedMap = {};
    let totalNetDelta = 0;
    rawArray.forEach((item) => {
      totalNetDelta += (item.dailyIncome - item.dailyExpense);
    });

    let runningCashBalance = Number(currentCashBalance) - totalNetDelta;

    rawArray.forEach((item) => {
      const d = item.dateObj;
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

      const netDelta = item.dailyIncome - item.dailyExpense;
      runningCashBalance += netDelta;

      if (aggregatedMap[key]) {
        aggregatedMap[key].cajaActual = runningCashBalance;
        aggregatedMap[key].ingresosDiarios += item.dailyIncome;
        aggregatedMap[key].egresosDiarios += item.dailyExpense;
        aggregatedMap[key].ingresosFuturos += item.futureIncome;
      } else {
        aggregatedMap[key] = {
          period: label.charAt(0).toUpperCase() + label.slice(1),
          timestamp: new Date(key).getTime() || d.getTime(),
          cajaActual: runningCashBalance,
          ingresosDiarios: item.dailyIncome,
          egresosDiarios: item.dailyExpense,
          ingresosFuturos: item.futureIncome,
        };
      }
    });

    let processedData = Object.values(aggregatedMap).sort((a, b) => a.timestamp - b.timestamp);

    if (viewMode === "day") {
      const futureIndex = processedData.findIndex(d => d.timestamp >= nowTime);
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
  }, [movements, loans, currentCashBalance, viewMode, dayRange]);

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
    const maxCaja = Math.max(...chartData.map((d) => Math.abs(d.cajaActual)), 0);
    const maxFut = Math.max(...chartData.map((d) => d.ingresosFuturos), 0);
    return Math.max(maxCaja, maxFut, 100);
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
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5 chart-container relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            💰 Caja Actual y Capital Proyectado
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Haz clic en cualquier punto del gráfico para ver el detalle de ingresos y egresos.
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
              className="w-full accent-emerald-500 cursor-pointer bg-neutral-800 h-1.5 rounded-lg"
            />
            <span className="text-emerald-400 font-bold whitespace-nowrap min-w-[50px] text-right">
              {dayRange} días
            </span>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-5 text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-indigo-400">
          <span className="w-3 h-1.5 bg-indigo-400 rounded-full inline-block"></span> Caja Actual (Disponible)
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-3 h-1 bg-amber-500 rounded-full inline-block"></span> Capital Proyectado (Futuro)
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-neutral-500 text-xs space-y-1">
          <span>No hay datos suficientes para graficar.</span>
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
            <polyline fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={getPoints("cajaActual")} />
            <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" points={getPoints("ingresosFuturos")} />

            {/* Puntos Interactivos por Click */}
            {chartData.map((d, index) => {
              const x = padding + (index / (chartData.length - 1 || 1)) * (svgWidth - padding * 2);
              const yCaja = svgHeight - padding - (d.cajaActual / maxVal) * (svgHeight - padding * 2);
              const yFut = svgHeight - padding - (d.ingresosFuturos / maxVal) * (svgHeight - padding * 2);
              const isSelected = selectedPointIndex === index;

              return (
                <g key={index} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedPointIndex(isSelected ? null : index); }}>
                  <circle cx={x} cy={yCaja} r={isSelected ? "6" : "4.5"} fill={isSelected ? "#ffffff" : "#818cf8"} stroke={isSelected ? "#818cf8" : "none"} strokeWidth="2" />
                  <circle cx={x} cy={yFut} r={isSelected ? "5" : "3.5"} fill={isSelected ? "#ffffff" : "#f59e0b"} stroke={isSelected ? "#f59e0b" : "none"} strokeWidth="2" />

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
            const x = padding + (selectedPointIndex / (chartData.length - 1 || 1)) * (svgWidth - padding * 2);
            // Posicionamos el popup de manera inteligente a un lado del punto para no tapar la vista
            const isRightSide = x > svgWidth / 2;
            const popupStyle = isRightSide ? { right: `${Math.max(10, svgWidth - x - 20)}px` } : { left: `${Math.max(10, x - 20)}px` };

            return (
              <div 
                style={popupStyle}
                className="absolute top-4 z-40 bg-neutral-900 border border-indigo-500/50 p-3.5 rounded-2xl shadow-2xl text-[11px] space-y-2.5 w-48 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">📅 {d.period}</span>
                  <button 
                    onClick={() => setSelectedPointIndex(null)}
                    className="text-neutral-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-neutral-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5">
                  <p className="text-indigo-300 flex justify-between items-center">
                    <span>Caja Actual:</span> <span className="font-bold text-white">{formatMoney(d.cajaActual)}</span>
                  </p>
                  <p className="text-emerald-400 flex justify-between items-center">
                    <span>➕ Ingresos Cap.:</span> <span className="font-semibold">+{formatMoney(d.ingresosDiarios)}</span>
                  </p>
                  <p className="text-rose-400 flex justify-between items-center">
                    <span>➖ Egresos Cap.:</span> <span className="font-semibold">-{formatMoney(d.egresosDiarios)}</span>
                  </p>
                  <p className="text-amber-400 flex justify-between items-center border-t border-neutral-800/80 pt-1.5">
                    <span>Cap. Proyectado:</span> <span className="font-semibold">{formatMoney(d.ingresosFuturos)}</span>
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}