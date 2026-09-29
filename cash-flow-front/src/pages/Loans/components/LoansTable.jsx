import { useState } from "react";
import PaymentModal from "../../../components/loans/PaymentModal";

export default function LoansTable({ loans, onLoanUpdated, onDeleteLoan }) {
  // Estado para controlar qué préstamo se está cobrando mediante el modal
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);

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
    const cleanDate = dateString.split("T")[0]; // Por si viene con hora
    const [year, month, day] = cleanDate.split("-");
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  };

  // Función para obtener la fecha de la próxima cuota pendiente
  const getNextDueDate = (loan) => {
    if (loan.status === "PAGADO") return "Completado";

    // Manejamos por si el schedule viene como string JSON o ya como array
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
      const nextInstallment = installmentsList.find((inst) => inst.status !== "PAGADO") || installmentsList[0];
      if (nextInstallment && nextInstallment.dueDate) {
        return formatDateToLocal(nextInstallment.dueDate);
      }
    }

    if (loan.dueDate) {
      return formatDateToLocal(loan.dueDate);
    }

    return "N/A";
  };

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
            {loans.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-neutral-500">
                  No hay préstamos cargados.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const totalToPay = loan.totalToPay || 0;

                // --- CÁLCULO DINÁMICO DE LO PAGADO Y PENDIENTE ---
                const totalPaidSoFar = Array.isArray(loan.payments)
                  ? loan.payments.reduce((acc, p) => acc + (p.amount || 0), 0)
                  : (loan.paidAmount || 0);

                const pendingAmount = loan.status === "PAGADO" 
                  ? 0 
                  : Math.max(0, totalToPay - totalPaidSoFar);

                return (
                  <tr
                    key={loan.id}
                    className="hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-white">
                      {loan.client?.name || "N/A"}
                    </td>
                    <td className="p-4 text-neutral-400">{loan.installments}</td>
                    <td className="p-4 text-neutral-400">{loan.frequency}</td>
                    
                    {/* Total a Pagar */}
                    <td className="p-4 font-semibold text-emerald-400">
                      {formatMoney(totalToPay)}
                    </td>

                    {/* Valor pendiente calculado en tiempo real */}
                    <td className="p-4 font-semibold text-amber-400">
                      {formatMoney(pendingAmount)}
                    </td>

                    {/* Fecha de la próxima cuota */}
                    <td className="p-4 text-neutral-300 font-medium">
                      {getNextDueDate(loan)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${
                          loan.status === "PAGADO"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                            : "bg-amber-950/40 text-amber-400 border-amber-900/40"
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        {loan.status !== "PAGADO" && (
                          <button
                            onClick={() => setSelectedLoanForPayment(loan)} // <--- Abre el modal de pago
                            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
                          >
                            Pagar 💵
                          </button>
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