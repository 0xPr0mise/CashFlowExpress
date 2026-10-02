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
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col gap-3.5 w-full">
      
      {/* Fila 1: Botones de Filtro Rápido (con flex-wrap para evitar desbordes) */}
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mr-1 hidden sm:inline">
          Período:
        </span>
        
        {[
          { id: "today", label: "Hoy" },
          { id: "week", label: "Esta semana" },
          { id: "month", label: "Este mes" },
          { id: "all", label: "Histórico" }
        ].map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePreset(preset.id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border cursor-pointer flex-1 sm:flex-initial text-center ${
              activePreset === preset.id
                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-950/50"
                : "bg-black/50 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Fila 2: Selectores de Calendario y Botón de Excel */}
      <div className="flex flex-col gap-2.5 pt-2.5 border-t border-neutral-800/80">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {/* Input Desde */}
          <div className="flex items-center justify-between bg-black/50 border border-neutral-800 hover:border-neutral-700 px-3 py-2 rounded-xl transition-all cursor-pointer">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold shrink-0">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="bg-transparent text-[11px] text-neutral-200 focus:outline-none cursor-pointer [color-scheme:dark] text-right w-full"
            />
          </div>

          {/* Input Hasta */}
          <div className="flex items-center justify-between bg-black/50 border border-neutral-800 hover:border-neutral-700 px-3 py-2 rounded-xl transition-all cursor-pointer">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold shrink-0">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              className="bg-transparent text-[11px] text-neutral-200 focus:outline-none cursor-pointer [color-scheme:dark] text-right w-full"
            />
          </div>
        </div>

        {/* Botón de Exportar XLSX */}
        <button
          onClick={exportToExcel}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          title="Descargar reporte en formato XLSX"
        >
          <span>📥</span>
          <span>Exportar Reporte XLSX</span>
        </button>
      </div>

    </div>
  );
}