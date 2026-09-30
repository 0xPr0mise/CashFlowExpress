import LoanDisbursementReceipt from "../../../components/Receipts/LoanDisbursementReceipt";

export default function LoanSuccessModal({ isOpen, successLoanData, onClose }) {
  if (!isOpen || !successLoanData) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center space-y-5">
        
        <div className="w-16 h-16 bg-emerald-950/80 border border-emerald-600/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl shadow-lg shadow-emerald-950">
          ✓
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white">¡Préstamo Asignado con Éxito!</h3>
          <p className="text-xs text-neutral-400">
            El préstamo se ha registrado correctamente en el sistema y el movimiento de caja fue generado.
          </p>
        </div>

        <div className="bg-black/40 border border-neutral-800 rounded-xl p-3.5 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-400">Cliente:</span>
            <span className="text-white font-semibold">{successLoanData.client?.name || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Monto Entregado:</span>
            <span className="text-emerald-400 font-bold">${successLoanData.amount.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Forma de Desembolso:</span>
            <span className="text-amber-400 font-bold uppercase">{successLoanData.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Total a Devolver:</span>
            <span className="text-white font-bold">${successLoanData.totalToPay.toLocaleString("es-AR")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <div className="w-full">
            <LoanDisbursementReceipt loanData={successLoanData} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Cerrar y Finalizar
          </button>
        </div>

      </div>
    </div>
  );
}