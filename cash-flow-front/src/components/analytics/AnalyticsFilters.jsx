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
    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-4">
      
      {/* Botones de Filtro Rápido */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mr-2 hidden sm:inline">Período:</span>
        
        <button
          onClick={() => handlePreset("today")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === "today"
              ? "bg-red-950 text-red-400 border-red-800 shadow-lg shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Hoy
        </button>

        <button
          onClick={() => handlePreset("week")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === "week"
              ? "bg-red-950 text-red-400 border-red-800 shadow-lg shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Esta semana
        </button>

        <button
          onClick={() => handlePreset("month")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === "month"
              ? "bg-red-950 text-red-400 border-red-800 shadow-lg shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Este mes
        </button>

        <button
          onClick={() => handlePreset("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
            activePreset === "all"
              ? "bg-red-950 text-red-400 border-red-800 shadow-lg shadow-red-950/50"
              : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          Histórico
        </button>
      </div>

      {/* Selectores de Calendario Interactivos (Desde / Hasta) y Botón de Excel */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
        
        {/* Input Desde */}
        <div className="flex items-center gap-2 bg-black/50 border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
          <span className="text-[11px] text-neutral-500 uppercase font-semibold">Desde:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()} // Abre el calendario inmediatamente al hacer clic
            className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer [color-scheme:dark]"
          />
        </div>

        {/* Input Hasta */}
        <div className="flex items-center gap-2 bg-black/50 border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
          <span className="text-[11px] text-neutral-500 uppercase font-semibold">Hasta:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
            onClick={(e) => e.target.showPicker && e.target.showPicker()} // Abre el calendario inmediatamente al hacer clic
            className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer [color-scheme:dark]"
          />
        </div>

        {/* Botón de Exportar XLSX */}
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          title="Descargar reporte en formato XLSX"
        >
          <span>📥</span>
          <span>Exportar XLSX</span>
        </button>
      </div>

    </div>
  );
}