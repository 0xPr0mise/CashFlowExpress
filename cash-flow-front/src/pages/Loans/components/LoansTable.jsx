import { useState, useEffect, useRef } from "react";
import PaymentModal from "../../../components/loans/PaymentModal";
import LoanReminderButton from "../../../components/loans/LoanReminderButton";
import { markLoanAsBadDebt } from "../../../services/loans.service";
import Swal from "sweetalert2";

export default function LoansTable({ loans, onLoanUpdated, onDeleteLoan, onRefinanceLoan, onSelectLoanForHistory }) {
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  const dropdownRef = useRef(null);

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatMoney = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "$0";
    return Number(value).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  };

  const formatDateToLocal = (dateString) => {
    if (!dateString) return "N/A";
    const cleanDate = dateString.split("T")[0];
    const [year, month, day] = cleanDate.split("-");
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  };

  const getNextDueDateObject = (loan) => {
    if (loan.status === "PAGADO" || loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE") return null;

    let schedule = loan.schedule;
    if (typeof schedule === "string") {
      try {
        schedule = JSON.parse(schedule);
      } catch (e) {
        schedule = [];
      }
    }

    const installmentsList = schedule || loan.installmentsList;

    if (Array.isArray(installmentsList) && installmentsList.length > 0) {
      const nextInstallment = installmentsList.find((inst) => inst.status !== "PAGADO" && inst.status !== "PAGADA") || installmentsList[0];
      if (nextInstallment && nextInstallment.dueDate) {
        return nextInstallment.dueDate.split("T")[0];
      }
    }

    if (loan.dueDate) {
      return loan.dueDate.split("T")[0];
    }

    return null;
  };

  const getNextDueDateFormatted = (loan) => {
    if (loan.status === "PAGADO") return "Completado";
    if (loan.status === "REFINANCIADO") return "Refinanciado";
    if (loan.status === "INCOBRABLE") return "Incobrable";
    const rawDate = getNextDueDateObject(loan);
    return rawDate ? formatDateToLocal(rawDate) : "N/A";
  };

  const isLoanOverdue = (loan) => {
    if (loan.status === "PAGADO" || loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE") return false;
    const dueDateStr = getNextDueDateObject(loan);
    if (!dueDateStr) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr + "T00:00:00");
    return dueDate < today;
  };

  const isWithinThreeDaysOrOverdue = (loan) => {
    if (loan.status === "PAGADO" || loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE") return false;
    const dueDateStr = getNextDueDateObject(loan);
    if (!dueDateStr) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr + "T00:00:00");
    const diffTime = dueDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return daysLeft <= 3;
  };

  const handleBadDebtClick = async (loan) => {
    setActiveDropdownId(null);
    const result = await Swal.fire({
      title: "¿Marcar como Préstamo Incobrable?",
      html: `
        <div class="text-left text-sm space-y-2 text-neutral-300">
          <p>Esta acción:</p>
          <ul class="list-disc pl-5 space-y-1 text-neutral-400">
            <li>Cambiará el estado del préstamo a <strong class="text-rose-500">INCOBRABLE</strong>.</li>
            <li>Removerá las fechas de vencimiento pendientes.</li>
            <li>Bloqueará automáticamente a este cliente para futuros préstamos.</li>
          </ul>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, marcar como incobrable",
      cancelButtonText: "Cancelar",
      background: "#171717",
      color: "#ffffff",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#404040",
      customClass: { popup: "border border-neutral-800 rounded-2xl shadow-2xl" }
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingId(loan.id);
      await markLoanAsBadDebt(loan.id);

      Swal.fire({
        icon: "success",
        title: "Actualizado",
        text: "El préstamo ha sido marcado como incobrable.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#10b981",
      });

      if (onLoanUpdated) onLoanUpdated();
    } catch (error) {
      console.error("Error al marcar como incobrable:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado del préstamo.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRefinanceClick = async (loan) => {
    setActiveDropdownId(null);
    let schedule = [];
    try {
      schedule = typeof loan.schedule === "string" ? JSON.parse(loan.schedule) : (loan.schedule || []);
    } catch (e) {
      schedule = [];
    }

    const pendingSchedule = schedule.filter(inst => inst.status !== "PAGADO" && inst.status !== "PAGADA");
    let remainingAmount = 0;

    if (pendingSchedule.length > 0) {
      remainingAmount = pendingSchedule.reduce((acc, inst) => acc + (inst.amount || inst.total || 0), 0);
    } else {
      remainingAmount = loan.pendingAmount || loan.totalToPay || loan.amount || 0;
    }

    const result = await Swal.fire({
      title: "¿Refinanciar Préstamo?",
      html: `
        <div class="text-left text-sm space-y-2 text-neutral-300">
          <p>Esta acción va a:</p>
          <ul class="list-disc pl-5 space-y-1 text-neutral-400">
            <li>Cerrar este préstamo catalogándolo como <strong class="text-amber-400">REFINANCIADO</strong>.</li>
            <li>Tomar el remanente de <strong class="text-white">$${remainingAmount.toLocaleString("es-AR")}</strong>.</li>
            <li>Abrir el formulario con los datos listos y nota histórica.</li>
          </ul>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, refinanciar",
      cancelButtonText: "Cancelar",
      background: "#171717",
      color: "#ffffff",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#404040",
      customClass: { popup: "border border-neutral-800 rounded-2xl shadow-2xl" }
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingId(loan.id);
      const clientName = loan.client?.name || loan.clientName || "Cliente";
      const noteDetails = `Refinanciación del préstamo #${loan.id || ''} de ${clientName}. Monto remanente refinanciado: $${remainingAmount.toLocaleString("es-AR")}.`;

      const refinancePayload = {
        clientId: loan.clientId,
        amount: String(remainingAmount),
        interestRate: String(loan.interestRate || 20),
        notes: noteDetails,
        oldLoanId: loan.id,
      };

      if (onRefinanceLoan) onRefinanceLoan(refinancePayload);
    } catch (error) {
      console.error("Error al refinanciar préstamo:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const sortedLoans = [...loans].sort((a, b) => {
    const dateA = getNextDueDateObject(a);
    const dateB = getNextDueDateObject(b);

    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateA) - new Date(dateB);
  });

  return (
    <div ref={dropdownRef} className="w-full">
      {sortedLoans.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm">
          No hay préstamos para mostrar con los filtros seleccionados.
        </div>
      ) : (
        <>
          {/* --- VISTA MÓVIL (MOBILE FIRST) --- */}
          <div className="block md:hidden space-y-3">
            {sortedLoans.map((loan) => {
              const totalToPay = loan.totalToPay || 0;
              const totalPaidSoFar = Array.isArray(loan.payments)
                ? loan.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
                : (loan.paidAmount || 0);
              const pendingAmount = loan.status === "PAGADO" || loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE"
                ? 0 
                : Math.max(0, totalToPay - totalPaidSoFar);
              const isClosed = loan.status === "PAGADO" || loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE";
              const overdue = isLoanOverdue(loan);
              const showReminder = isWithinThreeDaysOrOverdue(loan);

              return (
                <div
                  key={loan.id}
                  className={`border rounded-2xl p-4 shadow-lg space-y-3.5 backdrop-blur-sm transition-all ${
                    overdue
                      ? "bg-rose-950/20 border-rose-500/50 border-l-4 border-l-rose-500"
                      : "bg-neutral-900/90 border-neutral-800"
                  }`}
                >
                  {/* Cabecera de la tarjeta: Cliente y Estado */}
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                    <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2 truncate">
                      {overdue && (
                        <span className="relative flex h-2 w-2 flex-shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                      <span className="truncate">{loan.client?.name || "N/A"}</span>
                    </div>
                    
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 ${
                        loan.status === "PAGADO"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                          : loan.status === "REFINANCIADO"
                          ? "bg-purple-950/40 text-purple-400 border-purple-900/40"
                          : loan.status === "INCOBRABLE"
                          ? "bg-rose-950/80 text-rose-300 border-rose-800"
                          : overdue
                          ? "bg-rose-950/60 text-rose-400 border-rose-900/60 animate-pulse"
                          : "bg-amber-950/40 text-amber-400 border-amber-900/40"
                      }`}
                    >
                      {overdue ? "VENCIDO" : (loan.status || "ACTIVO")}
                    </span>
                  </div>

                  {/* Detalles de cuotas y fechas */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-neutral-950/30 p-2 rounded-xl border border-neutral-800/40">
                      <span className="text-neutral-500 block text-[10px] uppercase font-medium">Plan</span>
                      <span className="text-neutral-200 font-semibold">{loan.installments} cuotas <span className="text-neutral-400 text-[11px] font-normal">({loan.frequency})</span></span>
                    </div>
                    <div className="bg-neutral-950/30 p-2 rounded-xl border border-neutral-800/40">
                      <span className="text-neutral-500 block text-[10px] uppercase font-medium">Vencimiento</span>
                      <span className={`font-semibold truncate block ${overdue ? "text-rose-400 animate-pulse" : "text-neutral-200"}`}>
                        {getNextDueDateFormatted(loan)} {overdue && "⚠️"}
                      </span>
                    </div>
                  </div>

                  {/* Bloque de Dinero */}
                  <div className="grid grid-cols-2 gap-2 bg-black/50 border border-neutral-800/60 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">Total a Pagar</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-400">{formatMoney(totalToPay)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-medium">Saldo Pendiente</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-400">{formatMoney(pendingAmount)}</span>
                    </div>
                  </div>

                  {/* Botonera de Acciones Móvil */}
                  <div className="flex items-center gap-2 pt-1 relative">
                    {!isClosed && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedLoanForPayment(loan)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Pagar</span> 💵
                        </button>

                        {showReminder && (
                          <div className="flex-shrink-0">
                            <LoanReminderButton 
                              loan={loan} 
                              getNextDueDateFormatted={getNextDueDateFormatted} 
                              isOverdue={overdue}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Botón de Acciones (Desplegable) */}
                    <div className={`relative ${isClosed || !showReminder ? "w-full" : ""}`}>
                      <button
                        type="button"
                        onClick={() => setActiveDropdownId(activeDropdownId === loan.id ? null : loan.id)}
                        className={`w-full bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 border border-neutral-700 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isClosed ? "w-full" : ""}`}
                      >
                        <span>⚙️ Acciones</span>
                        <span className="text-[10px]">▼</span>
                      </button>

                      {/* Menú Desplegable (Se despliega hacia arriba si está cerca del borde para evitar recortes) */}
                      {activeDropdownId === loan.id && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1 text-left">
                          {!isClosed && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRefinanceClick(loan)}
                                disabled={loadingId === loan.id}
                                className="w-full px-4 py-2 text-xs text-red-400 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span>🔄</span> Refinanciar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBadDebtClick(loan)}
                                disabled={loadingId === loan.id}
                                className="w-full px-4 py-2 text-xs text-rose-400 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span>⚠️</span> Incobrable
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null);
                              if (onSelectLoanForHistory) onSelectLoanForHistory(loan);
                            }}
                            className="w-full px-4 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <span>📋</span> Historial
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null);
                              onDeleteLoan(loan.id);
                            }}
                            className="w-full px-4 py-2 text-xs text-red-500 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-neutral-800/60"
                          >
                            <span>🗑️</span> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- VISTA ESCRITORIO --- */}
          <div className="hidden md:block overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider text-neutral-400 bg-black/40">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Cuotas</th>
                  <th className="p-4">Frecuencia</th>
                  <th className="p-4">Total a Pagar</th>
                  <th className="p-4">Pendiente</th>
                  <th className="p-4">Próximo Vto.</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-sm">
                {sortedLoans.map((loan) => {
                  const totalToPay = loan.totalToPay || 0;
                  const totalPaidSoFar = Array.isArray(loan.payments)
                    ? loan.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
                    : (loan.paidAmount || 0);
                  const pendingAmount = loan.status === "PAGADO" || loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE"
                    ? 0 
                    : Math.max(0, totalToPay - totalPaidSoFar);
                  const isClosed = loan.status === "PAGADO" || loan.status === "REFINANCIADO" || loan.status === "INCOBRABLE";
                  const overdue = isLoanOverdue(loan);
                  const showReminder = isWithinThreeDaysOrOverdue(loan);

                  return (
                    <tr
                      key={loan.id}
                      className={`transition-colors ${
                        overdue 
                          ? "bg-rose-950/20 hover:bg-rose-950/40 border-l-4 border-l-rose-500" 
                          : "hover:bg-neutral-800/30"
                      }`}
                    >
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        {overdue && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                          </span>
                        )}
                        {loan.client?.name || "N/A"}
                      </td>
                      <td className="p-4 text-neutral-400">{loan.installments}</td>
                      <td className="p-4 text-neutral-400">{loan.frequency}</td>
                      
                      <td className="p-4 font-semibold text-emerald-400">{formatMoney(totalToPay)}</td>
                      <td className="p-4 font-semibold text-amber-400">{formatMoney(pendingAmount)}</td>
                      <td className={`p-4 font-medium ${overdue ? "text-rose-400 animate-pulse font-bold" : "text-neutral-300"}`}>
                        {getNextDueDateFormatted(loan)} {overdue && "⚠️"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${
                            loan.status === "PAGADO"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                              : loan.status === "REFINANCIADO"
                              ? "bg-purple-950/40 text-purple-400 border-purple-900/40"
                              : loan.status === "INCOBRABLE"
                              ? "bg-rose-950/80 text-rose-300 border-rose-800"
                              : overdue
                              ? "bg-rose-950/60 text-rose-400 border-rose-900/60 animate-pulse"
                              : "bg-amber-950/40 text-amber-400 border-amber-900/40"
                          }`}
                        >
                          {overdue ? "VENCIDO" : (loan.status || "ACTIVO")}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center items-center">
                          {!isClosed && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedLoanForPayment(loan)}
                                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
                              >
                                Pagar 💵
                              </button>

                              {showReminder && (
                                <LoanReminderButton 
                                  loan={loan} 
                                  getNextDueDateFormatted={getNextDueDateFormatted} 
                                  isOverdue={overdue}
                                />
                              )}
                            </>
                          )}

                          {/* Botonera Desplegable Escritorio */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveDropdownId(activeDropdownId === loan.id ? null : loan.id)}
                              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>⚙️ Acciones</span>
                              <span className="text-[10px]">▼</span>
                            </button>

                            {activeDropdownId === loan.id && (
                              <div className="absolute right-0 mt-2 w-44 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1 text-left">
                                {!isClosed && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleRefinanceClick(loan)}
                                      disabled={loadingId === loan.id}
                                      className="w-full px-4 py-2 text-xs text-red-400 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <span>🔄</span> Refinanciar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBadDebtClick(loan)}
                                      disabled={loadingId === loan.id}
                                      className="w-full px-4 py-2 text-xs text-rose-400 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <span>⚠️</span> Incobrable
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    if (onSelectLoanForHistory) onSelectLoanForHistory(loan);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                  <span>📋</span> Historial
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    onDeleteLoan(loan.id);
                                  }}
                                  className="w-full px-4 py-2 text-xs text-red-500 hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer border-t border-neutral-800/60"
                                >
                                  <span>🗑️</span> Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selectedLoanForPayment && (
        <PaymentModal
          loan={selectedLoanForPayment}
          onClose={() => setSelectedLoanForPayment(null)}
          onPaymentSuccess={() => {
            setSelectedLoanForPayment(null);
            if (onLoanUpdated) onLoanUpdated();
            else window.location.reload();
          }}
        />
      )}
    </div>
  );
}