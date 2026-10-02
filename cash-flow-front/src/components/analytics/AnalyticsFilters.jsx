import { useState } from "react";
import * as XLSX from "xlsx";

export default function AnalyticsFilters({ onFilterChange, rawData }) {
  const [activePreset, setActivePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Manejar selección de botones rápidos
  const handlePreset = (preset) => {
    setActivePreset(preset);
    setStartDate("");
    setEndDate("");
    onFilterChange({ preset, startDate: null, endDate: null });
  };

  // Manejar cambios en el selector de fechas personalizado
  const handleCustomDateChange = (start, end) => {
    setActivePreset("custom");
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      onFilterChange({ preset: "custom", startDate: new Date(start), endDate: new Date(end) });
    }
  };

  // Función de Exportación a Excel (XLSX)
  const exportToExcel = () => {
    if (!rawData) return;

    const exportData = [
      { "Métrica / Concepto": "Balance en Caja", "Valor": rawData.cashBalance || 0 },
      { "Métrica / Concepto": "Capital Colocado Bruto", "Valor": rawData.totalLentAmount || 0 },
      { "Métrica / Concepto": "Retorno Proyectado Total", "Valor": rawData.totalExpectedReturn || 0 },
      { "Métrica / Concepto": "Dinero Recaudado", "Valor": rawData.totalCollected || 0 },
      { "Métrica / Concepto": "Total de Préstamos", "Valor": rawData.totalLoansCount || 0 },
      { "Métrica / Concepto": "Créditos Activos", "Valor": rawData.activeLoansCount || 0 },
      { "Métrica / Concepto": "Créditos Pagados", "Valor": rawData.paidLoansCount || 0 }
    ];

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Financiero");

    const fechaStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Reporte_Financiero_${fechaStr}.xlsx`);
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md flex flex-col gap-3">
      
      {/* Fila 1: Botones de Filtro Rápido */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1 shrink-0 hidden sm:inline">Período:</span>
        
        <button
          onClick={() => handlePreset("today")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shrink-0 ${
            activePreset === "today"
              ? "bg-red-950 text-red-400 border-red-800 shadow-md shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Hoy
        </button>

        <button
          onClick={() => handlePreset("week")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shrink-0 ${
            activePreset === "week"
              ? "bg-red-950 text-red-400 border-red-800 shadow-md shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Esta semana
        </button>

        <button
          onClick={() => handlePreset("month")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shrink-0 ${
            activePreset === "month"
              ? "bg-red-950 text-red-400 border-red-800 shadow-md shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Este mes
        </button>

        <button
          onClick={() => handlePreset("all")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shrink-0 ${
            activePreset === "all"
              ? "bg-red-950 text-red-400 border-red-800 shadow-md shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Histórico
        </button>
      </div>

      {/* Fila 2: Selectores de Calendario y Botón de Excel */}
      <div className="flex flex-wrap items-center gap-2 justify-between pt-2 border-t border-neutral-800/60">
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Input Desde */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-neutral-800 hover:border-neutral-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="bg-transparent text-[11px] text-neutral-200 focus:outline-none cursor-pointer [color-scheme:dark] w-full sm:w-auto"
            />
          </div>

          {/* Input Hasta */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-neutral-800 hover:border-neutral-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex-1 sm:flex-initial">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="bg-transparent text-[11px] text-neutral-200 focus:outline-none cursor-pointer [color-scheme:dark] w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Botón de Exportar XLSX */}
        <button
          onClick={exportToExcel}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-md shadow-emerald-950 transition-all cursor-pointer w-full sm:w-auto"
          title="Descargar reporte en formato XLSX"
        >
          <span>📥</span>
          <span>Exportar XLSX</span>
        </button>
      </div>

    </div>
  );
}