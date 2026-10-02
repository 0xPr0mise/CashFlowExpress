import { useState, useMemo } from "react";

export default function CashFlowChart({ movements = [] }) {
  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "month"
  const [dayRange, setDayRange] = useState(14); // Rango dinámico de días para el zoom
  const [showDaySlider, setShowDaySlider] = useState(false); // Controla la visibilidad del slider en modo "Días"

  const handleViewModeChange = (mode) => {
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
    if (!Array.isArray(movements) || movements.length === 0) return [];

    const events = [];

    movements.forEach((mov) => {
      const rawDate = mov.createdAt || mov.date || mov.fecha;
      const amount = Number(mov.amount) || Number(mov.monto) || 0;
      // Asumimos que el movimiento tiene un tipo: 'INGRESO' / 'INCOME' o 'EGRESO' / 'EXPENSE' / 'GASTO'
      const type = (mov.type || mov.tipo || "").toUpperCase();
      
      const isIncome = type === 'INGRESO' || type === 'INCOME' || type === 'DEPOSIT' || amount > 0;
      const absAmount = Math.abs(amount);

      if (!rawDate || absAmount === 0) return;

      const dateObj = new Date(rawDate);
      if (isNaN(dateObj.getTime())) return;

      events.push({
        timestamp: dateObj.getTime(),
        dateObj: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
        incomeDelta: isIncome ? absAmount : 0,
        expenseDelta: !isIncome ? absAmount : 0,
      });
    });

    if (events.length === 0) return [];

    events.sort((a, b) => a.timestamp - b.timestamp);

    let accumulatedBalance = 0;
    let accumulatedIncome = 0;
    let accumulatedExpense = 0;
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

      const deltaInc = ev.incomeDelta || 0;
      const deltaExp = ev.expenseDelta || 0;
      const netDelta = deltaInc - deltaExp;

      accumulatedBalance += netDelta;
      accumulatedIncome += deltaInc;
      accumulatedExpense += deltaExp;

      if (timelineMap[key]) {
        timelineMap[key].balance = accumulatedBalance;
        timelineMap[key].totalIngresos = accumulatedIncome;
        timelineMap[key].totalEgresos = accumulatedExpense;
        timelineMap[key].periodDeltaInc += deltaInc;
        timelineMap[key].periodDeltaExp += deltaExp;
      } else {
        timelineMap[key] = {
          period: label.charAt(0).toUpperCase() + label.slice(1),
          timestamp: new Date(key).getTime() || d.getTime(),
          balance: accumulatedBalance,
          totalIngresos: accumulatedIncome,
          totalEgresos: accumulatedExpense,
          periodDeltaInc: deltaInc,
          periodDeltaExp: deltaExp,
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
  }, [movements, viewMode, dayRange]);

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
    const maxBal = Math.max(...chartData.map((d) => d.balance), 0);
    const maxInc = Math.max(...chartData.map((d) => d.totalIngresos), 0);
    const maxExp = Math.max(...chartData.map((d) => d.totalEgresos), 0);
    return Math.max(maxBal, maxInc, maxExp, 100);
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
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            💰 Flujo de Caja y Movimientos en el Tiempo
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {viewMode === 'day' && `Mostrando un rango dinámico de ${dayRange} días.`}
            {viewMode === 'week' && 'Evolución semanal agrupada.'}
            {viewMode === 'month' && 'Mostrando perspectiva de los últimos 3 a 4 meses.'}
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
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span> Ingresos Totales
        </span>
        <span className="flex items-center gap-1.5 text-rose-400">
          <span className="w-3 h-1 bg-rose-500 rounded-full inline-block"></span> Egresos / Gastos
        </span>
        <span className="flex items-center gap-1.5 text-sky-400">
          <span className="w-3 h-1 bg-sky-400 rounded-full inline-block"></span> Balance Neto Acumulado
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 text-neutral-500 text-xs space-y-1">
          <span>No hay movimientos de caja registrados para graficar.</span>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
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
            <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={getPoints("totalIngresos")} />
            <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={getPoints("totalEgresos")} />
            <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={getPoints("balance")} />

            {/* Puntos y tooltips */}
            {chartData.map((d, index) => {
              const x = padding + (index / (chartData.length - 1 || 1)) * (svgWidth - padding * 2);
              const yInc = svgHeight - padding - (d.totalIngresos / maxVal) * (svgHeight - padding * 2);
              const yExp = svgHeight - padding - (d.totalEgresos / maxVal) * (svgHeight - padding * 2);
              const yBal = svgHeight - padding - (d.balance / maxVal) * (svgHeight - padding * 2);

              return (
                <g key={index} className="group cursor-pointer">
                  <circle cx={x} cy={yInc} r="3.5" fill="#10b981" />
                  <circle cx={x} cy={yExp} r="3.5" fill="#f43f5e" />
                  <circle cx={x} cy={yBal} r="3.5" fill="#38bdf8" />

                  <text x={x} y={svgHeight - 12} fill="#737373" fontSize="9" textAnchor="middle">
                    {d.period}
                  </text>

                  <foreignObject x={Math.min(Math.max(x - 75, 10), svgWidth - 160)} y="2" width="150" height="115" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    <div className="bg-neutral-900 border border-neutral-700 p-2.5 rounded-xl shadow-2xl text-[10px] space-y-1.5">
                      <p className="font-bold text-white border-b border-neutral-800 pb-1 flex justify-between">
                        <span>📅 {d.period}</span>
                      </p>
                      <div className="space-y-0.5">
                        <p className="text-emerald-400 flex justify-between">
                          <span>Ingresos:</span> <span className="font-semibold">{formatMoney(d.totalIngresos)}</span>
                        </p>
                        <p className="text-rose-400 flex justify-between">
                          <span>Egresos:</span> <span className="font-semibold">{formatMoney(d.totalEgresos)}</span>
                        </p>
                        <p className="text-sky-400 flex justify-between">
                          <span>Balance Neto:</span> <span className="font-semibold">{formatMoney(d.balance)}</span>
                        </p>
                      </div>
                      {(d.periodDeltaInc > 0 || d.periodDeltaExp > 0) && (
                        <div className="border-t border-neutral-800 pt-1 text-[9px] text-neutral-400">
                          {d.periodDeltaInc > 0 && <p className="text-emerald-300">+ {formatMoney(d.periodDeltaInc)} ingresados hoy</p>}
                          {d.periodDeltaExp > 0 && <p className="text-rose-300">- {formatMoney(d.periodDeltaExp)} egresados hoy</p>}
                        </div>
                      )}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}