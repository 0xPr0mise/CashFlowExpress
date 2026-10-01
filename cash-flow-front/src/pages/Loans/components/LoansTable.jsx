import { useState } from "react";
import PaymentModal from "../../../components/loans/PaymentModal";
import Swal from "sweetalert2";

export default function LoansTable({ loans, onLoanUpdated, onDeleteLoan, onRefinanceLoan }) {
  // Estado para controlar qué préstamo se está cobrando mediante el modal
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  // Función auxiliar para formatear montos en pesos (estilo argentino)
  const formatMoney = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "$0";
    return Number(value).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  };

  // Función auxiliar para formatear fechas de AAAA-MM-DD a DD/MM/AAAA
  const formatDateToLocal = (dateString) => {
    if (!dateString) return "N/A";
    const cleanDate = dateString.split("T")[0];
    const [year, month, day] = cleanDate.split("-");
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  };

  // Función para obtener la fecha de la próxima cuota pendiente
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

  // Función para detectar si un préstamo está vencido (fecha pasada y no pagado)
  const isLoanOverdue = (loan) => {
    if (loan.status === "PAGADO" || loan.status === "REFINANCIADO") return false;
    const dueDateStr = getNextDueDateObject(loan);
    if (!dueDateStr) return false;

    // Crear fecha actual sin hora para comparar correctamente
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(dueDateStr + "T00:00:00");
    return dueDate < today;
  };

  // Manejador para el botón de Refinanciar
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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo procesar la refinanciación.",
        background: "#171717",
        color: "#ffffff",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoadingId(null);
    }
  };

  // Ordenar los préstamos por el vencimiento más próximo primero
  const sortedLoans = [...loans].sort((a, b) => {
    const dateA = getNextDueDateObject(a);
    const dateB = getNextDueDateObject(b);

    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateA) - new Date(dateB);
  });

  return (
    <div>
      <div className="overflow-x-auto">
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
            {sortedLoans.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-neutral-500">
                  No hay préstamos para mostrar con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              sortedLoans.map((loan) => {
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
                    
                    <td className="p-4 font-semibold text-emerald-400">
                      {formatMoney(totalToPay)}
                    </td>

                    <td className="p-4 font-semibold text-amber-400">
                      {formatMoney(pendingAmount)}
                    </td>

                    <td className={`p-4 font-medium ${overdue ? "text-rose-400 animate-pulse font-bold" : "text-neutral-300"}`}>
                      {getNextDueDateFormatted(loan)} {overdue && "⚠️"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${
                          loan.status === "PAGADO"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                            : loan.status === "REFINANCIADO"
                            ? "bg-purple-950/40 text-purple-900/40 text-purple-400"
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
                            {/* Botón Pagar */}
                            <button
                              onClick={() => setSelectedLoanForPayment(loan)}
                              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
                            >
                              Pagar 💵
                            </button>

                            {/* Botón Rojo de Refinanciar */}
                            <button
                              onClick={() => handleRefinanceClick(loan)}
                              disabled={loadingId === loan.id}
                              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-red-950/50 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              {loadingId === loan.id ? "..." : "🔄 Refinanciar"}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => onDeleteLoan(loan.id)}
                          className="bg-neutral-800 hover:bg-red-950/60 text-red-400 border border-neutral-700 hover:border-red-900 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- RENDERIZADO DEL MODAL DE PAGO --- */}
      {selectedLoanForPayment && (
        <PaymentModal
          loan={selectedLoanForPayment}
          onClose={() => setSelectedLoanForPayment(null)}
          onPaymentSuccess={() => {
            setSelectedLoanForPayment(null);
            if (onLoanUpdated) {
              onLoanUpdated();
            } else {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}