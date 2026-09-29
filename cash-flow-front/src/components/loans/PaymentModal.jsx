import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { payLoan } from "../../services/loans.service";

export default function PaymentModal({ loan, onClose, onPaymentSuccess }) {
  // Estado local del schedule para que el modal refleje los cambios instantáneamente
  const [schedule, setSchedule] = useState(() => {
    try {
      return typeof loan.schedule === "string" ? JSON.parse(loan.schedule) : (loan.schedule || []);
    } catch (e) {
      return [];
    }
  });

  // Filtrar cuotas pendientes
  const pendingInstallments = schedule.filter((inst) => inst.status !== "PAGADO");
  const defaultInstallment = pendingInstallments[0] || schedule[0];

  const [selectedInstallmentNum, setSelectedInstallmentNum] = useState(
    defaultInstallment ? defaultInstallment.installmentNumber : ""
  );
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Cada vez que cambia la cuota seleccionada, sugerimos el saldo pendiente
  useEffect(() => {
    if (selectedInstallmentNum) {
      const inst = schedule.find((i) => i.installmentNumber === Number(selectedInstallmentNum));
      if (inst) {
        const total = inst.amount || 0;
        const paid = inst.paidAmount || 0;
        setAmount(Math.max(0, total - paid).toFixed(2));
      }
    }
  }, [selectedInstallmentNum, schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Por favor, ingrese un monto válido.");
      return;
    }

    try {
      setLoading(true);
      
      // Llamada al servicio con la cuota seleccionada
      const response = await payLoan(loan.id, { 
        amount: parsedAmount, 
        paymentMethod, 
        note,
        targetInstallmentNumber: Number(selectedInstallmentNum)
      });

      // Si el backend te devuelve el préstamo actualizado, actualizamos el schedule localmente de inmediato
      if (response && response.loan && response.loan.schedule) {
        const updatedSchedule = typeof response.loan.schedule === "string" 
          ? JSON.parse(response.loan.schedule) 
          : response.loan.schedule;
        setSchedule(updatedSchedule);
      }

      alert("¡Pago registrado con éxito!");
      
      // Notificamos al componente padre para que actualice su propia tabla/vista
      if (onPaymentSuccess) {
        onPaymentSuccess(response.loan); 
      }
      
      onClose(); 
    } catch (error) {
      console.error(error);
      alert("Error al registrar el pago en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-950/50">
          <div>
            <h3 className="text-lg font-bold text-white">Registrar Pago</h3>
            <p className="text-xs text-neutral-400">Cliente: {loan.client?.name || "N/A"}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xl font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Historial / Estado detallado de Cuotas */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 max-h-40 overflow-y-auto text-xs space-y-2">
            <span className="text-neutral-400 font-semibold uppercase tracking-wider block mb-1">Estado de Cuotas:</span>
            {schedule.length === 0 ? (
              <p className="text-neutral-500">No hay cronograma detallado.</p>
            ) : (
              schedule.map((inst, idx) => {
                const total = inst.amount || 0;
                const paid = inst.paidAmount || 0;
                return (
                  <div key={idx} className="flex justify-between items-center text-neutral-300 border-b border-neutral-900 pb-1.5">
                    <div>
                      <span className="font-bold text-white">Cuota #{inst.installmentNumber}</span>
                      <span className="text-neutral-500 block text-[10px]">Vto: {inst.dueDate?.split("T")[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                        inst.status === 'PAGADO' ? 'bg-emerald-950 text-emerald-400' :
                        inst.status === 'PARCIAL' ? 'bg-amber-950 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {inst.status || 'PENDIENTE'}
                      </span>
                      <span className="block text-[11px] text-neutral-400">
                        Pagado: ${paid} / Total:${total}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selector de Cuota a Pagar */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Seleccionar Cuota a Abonar</label>
            <select
              value={selectedInstallmentNum}
              onChange={(e) => setSelectedInstallmentNum(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {schedule
                .filter((inst) => inst.status !== "PAGADO")
                .map((inst) => {
                  const saldo = (inst.amount || 0) - (inst.paidAmount || 0);
                  return (
                    <option key={inst.installmentNumber} value={inst.installmentNumber}>
                      Cuota #{inst.installmentNumber} — Saldo: ${saldo} ({inst.dueDate?.split("T")[0]})
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Input de Monto */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Monto a abonar ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors font-semibold text-lg"
              placeholder="0.00"
              required
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Puedes pagar la cuota completa o un monto menor (generará un pago parcial).
            </span>
          </div>

          {/* Selector de Método de Pago */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Método de Pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          {/* Nota opcional */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Nota / Observación (Opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              placeholder="Ej: Abona parte de la cuota"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Confirmar Pago"}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}