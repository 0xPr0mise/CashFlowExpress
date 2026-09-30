import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

export default function CashTable({ movements, filter, setFilter }) {
  // Estados para los filtros temporales, de método de pago y de calendario personalizado
  const [dateFilterType, setDateFilterType] = useState("ALL"); // 'ALL', 'TODAY', 'THIS_WEEK', 'THIS_MONTH', 'CUSTOM'
  const [methodFilter, setMethodFilter] = useState("TODOS"); // 'TODOS', 'EFECTIVO', 'TRANSFERENCIA', etc.
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCategoryLabel = (category) => {
    const labels = {
      COBRO_CUOTA: "Cobro de Cuota",
      APORTE_CAPITAL: "Aporte de Capital",
      INGRESO_EXTRA: "Ingreso Extraordinario",
      PRESTAMO_OTORGADO: "Préstamo Otorgado",
      GASTO_OPERATIVO: "Gasto Operativo / Oficina",
      RETIRO_SOCIO: "Retiro de Socio",
      EGRESO_EXTRA: "Gasto Extraordinario",
    };
    return labels[category] || category;
  };

  // Filtrado avanzado (Tipo de operación + Método de pago + Fechas)
  const filteredMovements = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return movements.filter((mov) => {
      // 1. Filtro por tipo (TODOS, INGRESO, EGRESO)
      if (filter !== "TODOS" && mov.type !== filter) return false;

      // 2. Filtro por método de pago (EFECTIVO, TRANSFERENCIA, etc.)
      const movMethod = (mov.paymentMethod || "EFECTIVO").toUpperCase();
      if (methodFilter !== "TODOS" && movMethod !== methodFilter) return false;

      // 3. Filtros temporales
      const movDateStr = new Date(mov.createdAt).toISOString().split("T")[0];

      if (dateFilterType === "TODAY") {
        if (movDateStr !== todayStr) return false;
      } else if (dateFilterType === "THIS_WEEK") {
        const movDate = new Date(mov.createdAt);
        const now = new Date();
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        firstDayOfWeek.setHours(0, 0, 0, 0);
        if (movDate < firstDayOfWeek) return false;
      } else if (dateFilterType === "THIS_MONTH") {
        const movDate = new Date(mov.createdAt);
        const now = new Date();
        if (
          movDate.getMonth() !== now.getMonth() ||
          movDate.getFullYear() !== now.getFullYear()
        )
          return false;
      } else if (dateFilterType === "CUSTOM") {
        if (customRange.startDate && movDateStr < customRange.startDate) return false;
        if (customRange.endDate && movDateStr > customRange.endDate) return false;
      }

      return true;
    });
  }, [movements, filter, methodFilter, dateFilterType, customRange]);

  // Datos paginados
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(start, start + itemsPerPage);
  }, [filteredMovements, currentPage]);

  // Función para exportar los datos filtrados actuales a Excel (.xlsx) incluyendo el método de pago
  const exportToExcel = () => {
    const dataToExport = filteredMovements.map((mov) => ({
      Fecha: new Date(mov.createdAt).toLocaleString(),
      Tipo: mov.type,
      Categoría: formatCategoryLabel(mov.category),
      "Método de Pago": mov.paymentMethod || "EFECTIVO",
      Descripción: mov.description || "-",
      Monto: mov.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos de Caja");
    
    // Generar archivo y descargar
    XLSX.writeFile(workbook, `Reporte_Caja_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera, Pestañas de Tipo y Botón de Excel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl backdrop-blur-sm">
        
        {/* Filtros de Tipo (Todos / Ingresos / Egresos) */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 border border-neutral-800 rounded-xl">
          {["TODOS", "INGRESO", "EGRESO"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === f ? "bg-red-600 text-white shadow-md shadow-red-950/50" : "text-neutral-400 hover:text-white"
              }`}
            >
              {f === "TODOS" ? "Todos" : f === "INGRESO" ? "Ingresos" : "Egresos"}
            </button>
          ))}
        </div>

        {/* Botón de Exportación XLSX */}
        <button
          onClick={exportToExcel}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Exportar Planilla (XLSX)
        </button>
      </div>

      {/* Barra de Filtros por Método de Pago / Canal */}
      <div className="flex flex-wrap items-center gap-2 bg-neutral-900/40 border border-neutral-800 p-3 rounded-2xl text-xs">
        <span className="text-neutral-400 font-semibold uppercase tracking-wider mr-2">Canal / Método:</span>
        {["TODOS", "EFECTIVO", "TRANSFERENCIA"].map((method) => (
          <button
            key={method}
            onClick={() => {
              setMethodFilter(method);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              methodFilter === method
                ? "bg-amber-500 text-black font-bold shadow"
                : "bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {method === "TODOS" ? "Todos los canales" : method}
          </button>
        ))}
      </div>

      {/* Barra de Filtros Temporales (Hoy, Esta Semana, Este Mes, Histórico, Calendario) */}
      <div className="flex flex-wrap items-center gap-2 bg-neutral-900/40 border border-neutral-800 p-3 rounded-2xl text-xs">
        <span className="text-neutral-400 font-semibold uppercase tracking-wider mr-2">Filtrar por Fecha:</span>
        {[
          { id: "ALL", label: "Histórico" },
          { id: "TODAY", label: "Hoy" },
          { id: "THIS_WEEK", label: "Esta Semana" },
          { id: "THIS_MONTH", label: "Este Mes" },
          { id: "CUSTOM", label: "Calendario (Desde / Hasta)" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setDateFilterType(tab.id);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              dateFilterType === tab.id
                ? "bg-neutral-200 text-black shadow"
                : "bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inputs de Calendario Personalizado si está activo */}
      {dateFilterType === "CUSTOM" && (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl shadow-xl animate-fadeIn">
          <div className="w-full sm:w-1/2 space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Desde:</label>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) => {
                setCustomRange({ ...customRange, startDate: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 cursor-pointer [color-scheme:dark]"
            />
          </div>
          <div className="w-full sm:w-1/2 space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Hasta:</label>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) => {
                setCustomRange({ ...customRange, endDate: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {/* Tabla de Datos */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 bg-black/40">
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Método de Pago</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm">
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-neutral-500">
                    No hay movimientos registrados para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 text-neutral-400 text-xs">
                      {new Date(mov.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                          mov.type === "INGRESO"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                            : "bg-red-950/40 text-red-400 border-red-900/40"
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {formatCategoryLabel(mov.category)}
                    </td>
                    <td className="p-4">
                      <span className="bg-neutral-800 px-2.5 py-1 rounded-md text-neutral-200 font-mono text-xs border border-neutral-700/50">
                        {mov.paymentMethod || "EFECTIVO"}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-400">
                      {mov.description || "-"}
                    </td>
                    <td
                      className={`p-4 text-right font-black tracking-tight ${
                        mov.type === "INGRESO" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {mov.type === "INGRESO" ? "+" : "-"}${Number(mov.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-neutral-800 bg-black/40 text-xs text-neutral-400 gap-3">
          <div>
            Mostrando <span className="text-white font-semibold">{paginatedMovements.length}</span> de <span className="text-white font-semibold">{filteredMovements.length}</span> resultados filtrados
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white font-semibold disabled:opacity-40 cursor-pointer transition-colors"
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-bold">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white font-semibold disabled:opacity-40 cursor-pointer transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}