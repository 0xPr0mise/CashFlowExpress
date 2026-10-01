import { useState } from "react";
import PaymentModal from "../../../components/loans/PaymentModal";
import Swal from "sweetalert2";

export default function LoansTable({ loans, onLoanUpdated, onDeleteLoan, onRefinanceLoan, onSelectLoanForHistory }) {
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

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
    if (loan.status === "PAGADO" || loan.status === "REFINANCIADO") return null;

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
    const rawDate = getNextDueDateObject(loan);
    return rawDate ? formatDateToLocal(rawDate) : "N/A";
  };

  const isLoanOverdue = (loan) => {
    if (loan.status === "PAGADO" || loan.status === "REFINANCIADO") return false;
    const dueDateStr = getNextDueDateObject(loan);
    if (!dueDateStr) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr + "T00:00:00");
    return dueDate < today;
  };

  const handleRefinanceClick = async (loan) => {
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

      if (onRefinanceLoan) {
        onRefinanceLoan(refinancePayload);
      }
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
    <div>
      {sortedLoans.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          No hay préstamos para mostrar con los filtros seleccionados.
        </div>
      ) : (
        <>
          {/* --- VISTA MÓVIL --- */}
          <div className="block md:hidden space-y-3">
            {sortedLoans.map((loan) => {
              const totalToPay = loan.totalToPay || 0;
              const totalPaidSoFar = Array.isArray(loan.payments)
                ? loan.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
                : (loan.paidAmount || 0);
              const pendingAmount = loan.status === "PAGADO" || loan.status === "REFINANCIADO"
                ? 0 
                : Math.max(0, totalToPay - totalPaidSoFar);
              const isClosed = loan.status === "PAGADO" || loan.status === "REFINANCIADO";
              const overdue = isLoanOverdue(loan);

              return (
                <div
                  key={loan.id}
                  className={`border rounded-2xl p-4 shadow-lg space-y-3 backdrop-blur-sm ${
                    overdue
                      ? "bg-rose-950/20 border-rose-500/50 border-l-4 border-l-rose-500"
                      : "bg-neutral-900/80 border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                    <div className="font-bold text-white text-base flex items-center gap-2">
                      {overdue && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                      )}
                      {loan.client?.name || "N/A"}
                    </div>
                    
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                        loan.status === "PAGADO"
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                          : loan.status === "REFINANCIADO"
                          ? "bg-purple-950/40 text-purple-400 border-purple-900/40"
                          : overdue
                          ? "bg-rose-950/60 text-rose-400 border-rose-900/60 animate-pulse"
                          : "bg-amber-950/40 text-amber-400 border-amber-900/40"
                      }`}
                    >
                      {overdue ? "VENCIDO" : (loan.status || "ACTIVO")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-neutral-400">
                      <span className="text-neutral-500 block text-[10px] uppercase">Plan / Frecuencia</span>
                      <span className="text-neutral-200 font-medium">{loan.installments} cuotas ({loan.frequency})</span>
                    </div>
                    <div className="text-neutral-400">
                      <span className="text-neutral-500 block text-[10px] uppercase">Próximo Vencimiento</span>
                      <span className={`font-semibold ${overdue ? "text-rose-400 animate-pulse" : "text-neutral-200"}`}>
                        {getNextDueDateFormatted(loan)} {overdue && "⚠️"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-black/40 border border-neutral-800/60 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase">Total a Pagar</span>
                      <span className="text-sm font-bold text-emerald-400">{formatMoney(totalToPay)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase">Saldo Pendiente</span>
                      <span className="text-sm font-bold text-amber-400">{formatMoney(pendingAmount)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {!isClosed && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedLoanForPayment(loan)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
                        >
                          Pagar 💵
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRefinanceClick(loan)}
                          disabled={loadingId === loan.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer disabled:opacity-50"
                        >
                          {loadingId === loan.id ? "..." : "🔄 Refinanciar"}
                        </button>
                      </>
                    )}

                    {/* Botón Historial (Móvil) vinculado correctamente */}
                    <button
                      type="button"
                      onClick={() => onSelectLoanForHistory && onSelectLoanForHistory(loan)}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      title="Ver historial y tickets"
                    >
                      📋 Historial
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteLoan(loan.id)}
                      className={`${isClosed ? "w-full" : "w-auto"} bg-neutral-800 hover:bg-red-950/60 text-red-400 border border-neutral-700 hover:border-red-900 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer`}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- VISTA ESCRITORIO --- */}
          <div className="hidden md:block overflow-x-auto">
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
                  const pendingAmount = loan.status === "PAGADO" || loan.status === "REFINANCIADO"
                    ? 0 
                    : Math.max(0, totalToPay - totalPaidSoFar);
                  const isClosed = loan.status === "PAGADO" || loan.status === "REFINANCIADO";
                  const overdue = isLoanOverdue(loan);

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

                              <button
                                type="button"
                                onClick={() => handleRefinanceClick(loan)}
                                disabled={loadingId === loan.id}
                                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-red-950/50 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                {loadingId === loan.id ? "..." : "🔄 Refinanciar"}
                              </button>
                            </>
                          )}

                          {/* Botón Historial (Escritorio) vinculado correctamente */}
                          <button
                            type="button"
                            onClick={() => onSelectLoanForHistory && onSelectLoanForHistory(loan)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                            title="Ver historial y tickets"
                          >
                            📋 Historial
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteLoan(loan.id)}
                            className="bg-neutral-800 hover:bg-red-950/60 text-red-400 border border-neutral-700 hover:border-red-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            Eliminar
                          </button>
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