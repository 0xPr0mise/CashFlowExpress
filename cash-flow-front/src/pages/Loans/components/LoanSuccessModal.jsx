import LoanDisbursementReceipt from "../../../components/Receipts/LoanDisbursementReceipt";

export default function LoanSuccessModal({ isOpen, successLoanData, onClose }) {
  if (!isOpen || !successLoanData) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl text-center space-y-4 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Icono de éxito */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-950/80 border border-emerald-600/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-2xl sm:text-3xl shadow-lg shadow-emerald-950 flex-shrink-0">
          ✓
        </div>

        {/* Títulos */}
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
            ¡Préstamo Asignado con Éxito!
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed px-1">
            El préstamo se ha registrado correctamente en el sistema y el movimiento de caja fue generado.
          </p>
        </div>

        {/* Tarjeta de detalles */}
        <div className="bg-black/40 border border-neutral-800 rounded-xl p-3 sm:p-3.5 text-left text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
            <span className="text-neutral-400 text-[11px] sm:text-xs">Cliente:</span>
            <span className="text-white font-semibold text-xs sm:text-sm truncate">{successLoanData.client?.name || "N/A"}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
            <span className="text-neutral-400 text-[11px] sm:text-xs">Monto Entregado:</span>
            <span className="text-emerald-400 font-bold text-xs sm:text-sm">${successLoanData.amount.toLocaleString("es-AR")}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
            <span className="text-neutral-400 text-[11px] sm:text-xs">Forma de Desembolso:</span>
            <span className="text-amber-400 font-bold uppercase text-xs sm:text-sm">{successLoanData.paymentMethod}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 border-t border-neutral-800/80 pt-2 mt-1">
            <span className="text-neutral-400 text-[11px] sm:text-xs">Total a Devolver:</span>
            <span className="text-white font-bold text-xs sm:text-sm">${successLoanData.totalToPay.toLocaleString("es-AR")}</span>
          </div>
        </div>

        {/* Botonera de acciones */}
        <div className="flex flex-col gap-2.5 pt-2">
          <div className="w-full [&>button]:w-full">
            <LoanDisbursementReceipt loanData={successLoanData} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-md"
          >
            Cerrar y Finalizar
          </button>
        </div>

      </div>
    </div>
  );
}