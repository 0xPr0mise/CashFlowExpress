import { payLoan } from "../../../services/loans.service"; // Ajusta la ruta si es necesario

export default function LoansTable({ loans, onLoanUpdated, onDeleteLoan }) {
  // Función auxiliar para formatear montos en pesos (estilo argentino)
  const formatMoney = (value) => {
    if (value === undefined || value === null) return "$0";
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
    // Si el préstamo ya está pagado
    if (loan.status === "PAGADO") return "Completado";

    // Si el backend te devuelve un array de cuotas/cronograma (ej. loan.schedule o loan.installmentsList)
    const schedule = loan.schedule || loan.installmentsList;

    if (Array.isArray(schedule) && schedule.length > 0) {
      // Buscamos la primera cuota que no esté pagada (puedes ajustar la condición según tu backend, ej: status !== 'PAGADO')
      const nextInstallment = schedule.find((inst) => inst.status !== "PAGADO") || schedule[0];
      if (nextInstallment && nextInstallment.dueDate) {
        return formatDateToLocal(nextInstallment.dueDate);
      }
    }

    // Fallback: si viene una fecha general de vencimiento en el préstamo
    if (loan.dueDate) {
      return formatDateToLocal(loan.dueDate);
    }

    return "N/A";
  };

  // Función para manejar el evento de pago directo
  const handlePayClick = async (loan) => {
    const amountStr = prompt(
      `Ingrese el monto a abonar para el préstamo de ${loan.client?.name || "Cliente"}:`,
      "0",
    );
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, ingrese un monto válido.");
      return;
    }

    try {
      await payLoan(loan.id, { amount, paymentMethod: "EFECTIVO" });
      alert("¡Pago registrado con éxito!");

      if (onLoanUpdated) {
        onLoanUpdated();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      alert("Error al registrar el pago en el servidor.");
    }
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
                // Si el backend te manda el saldo pendiente, lo usamos. Si no, simulamos un cálculo base o tomamos loan.pendingAmount
                const totalToPay = loan.totalToPay || 0;
                const paidAmount = loan.paidAmount || 0; 
                const pendingAmount = loan.pendingAmount !== undefined ? loan.pendingAmount : Math.max(0, totalToPay - paidAmount);

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
                    
                    {/* Total a Pagar único */}
                    <td className="p-4 font-semibold text-emerald-400">
                      {formatMoney(totalToPay)}
                    </td>

                    {/* Valor pendiente */}
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
                            onClick={() => handlePayClick(loan)}
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
    </div>
  );
}