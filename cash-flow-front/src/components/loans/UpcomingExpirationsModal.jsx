import { useState, useMemo } from "react";
import ReactDOM from "react-dom";

export default function UpcomingExpirationsModal({ isOpen, onClose, loans = [], onSelectLoan }) {
  const [filterMode, setFilterMode] = useState("week"); // "week" o "all"

  // Función para normalizar y calcular fechas
  const getDaysUntilDue = (dueDateString) => {
    if (!dueDateString) return 999;
    const cleanDate = dueDateString.split("T")[0];
    const [year, month, day] = cleanDate.split("-");
    const dueDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Procesar y aplanar todas las cuotas pendientes de todos los préstamos
  const allInstallments = useMemo(() => {
    const list = [];
    loans.forEach((loan) => {
      let schedule = [];
      try {
        schedule = typeof loan.schedule === "string" ? JSON.parse(loan.schedule) : (loan.schedule || []);
      } catch (e) {
        schedule = [];
      }

      schedule.forEach((inst) => {
        if (inst.status !== "PAGADO") {
          const daysLeft = getDaysUntilDue(inst.dueDate);
          list.push({
            ...inst,
            loanId: loan.id,
            client: loan.client,
            loanRef: loan,
            daysLeft,
          });
        }
      });
    });

    // Ordenar por fecha de vencimiento más cercana (incluyendo negativos para los vencidos)
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [loans]);

  // Filtrar según el modo seleccionado (Próxima semana: 0 a 7 días, o Todos)
  const filteredInstallments = useMemo(() => {
    if (filterMode === "week") {
      return allInstallments.filter((inst) => inst.daysLeft <= 7);
    }
    return allInstallments;
  }, [allInstallments, filterMode]);

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const cleanDate = dateString.split("T")[0];
    const [year, month, day] = cleanDate.split("-");
    if (!year || !month || !day) return cleanDate;
    return `${day}/${month}/${year}`;
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950/50 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📅</span> Próximos Vencimientos
            </h3>
            <p className="text-xs text-neutral-400">Control de cuotas pendientes y por vencer</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filtros de visualización (Semana vs Todos) */}
        <div className="px-5 py-3 bg-neutral-950/30 border-b border-neutral-800 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setFilterMode("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === "week" ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Próxima Semana (7 días)
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterMode === "all" ? "bg-emerald-600 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Ver Todos ({allInstallments.length})
            </button>
          </div>
          <span className="text-xs text-neutral-500">
            Mostrando {filteredInstallments.length} cuotas
          </span>
        </div>

        {/* Lista de vencimientos con scroll */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredInstallments.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <span className="text-3xl block">🎉</span>
              <p className="text-sm font-medium">No hay vencimientos en este período.</p>
            </div>
          ) : (
            filteredInstallments.map((item, idx) => {
              const saldo = (item.amount || 0) - (item.paidAmount || 0);
              
              // Definir colores según estado de proximidad
              let badgeStyle = "bg-neutral-800 text-neutral-300";
              let badgeText = `Vence en ${item.daysLeft} días`;

              if (item.daysLeft < 0) {
                badgeStyle = "bg-rose-950 text-rose-400 border border-rose-900";
                badgeText = `Vencido hace ${Math.abs(item.daysLeft)} días`;
              } else if (item.daysLeft === 0) {
                badgeStyle = "bg-amber-950 text-amber-400 border border-amber-900";
                badgeText = "¡Vence Hoy!";
              } else if (item.daysLeft <= 2) {
                badgeStyle = "bg-amber-950/60 text-amber-300 border border-amber-900/50";
                badgeText = `Vence en ${item.daysLeft} días`;
              }

              return (
                <div 
                  key={`${item.loanId}-${item.installmentNumber}-${idx}`}
                  className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-neutral-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">
                        {item.client?.name || "Cliente sin nombre"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeStyle}`}>
                        {badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Cuota #{item.installmentNumber} • Vto: <span className="text-white">{formatDate(item.dueDate)}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <span className="text-xs text-neutral-500 block">Saldo Pendiente</span>
                      <span className="text-emerald-400 font-bold text-sm">${saldo.toLocaleString("es-AR")}</span>
                    </div>
                    {onSelectLoan && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLoan(item.loanRef);
                          onClose();
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ver Préstamo
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}