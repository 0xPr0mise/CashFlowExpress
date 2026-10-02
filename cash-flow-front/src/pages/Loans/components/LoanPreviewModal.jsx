import BudgetReceipt from "../../../components/Receipts/BudgetReceipt";

export default function LoanPreviewModal({
  isOpen,
  onClose,
  onBack,
  onConfirm,
  calculatedDetails,
  form = {},
}) {
  if (!isOpen || !calculatedDetails) return null;

  const formatDateToLocal = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const installmentsNum = parseInt(form.installments, 10) || calculatedDetails.installments || 1;
  
  const baseRate = parseFloat(form.interestRate) || 30;
  
  const extraRate = parseFloat(
    form.remainderRate ?? 
    form.customRate ?? 
    form.extraRate ?? 
    form.tasaDiasExtras ?? 
    form.remainderInterestRate ?? 
    baseRate
  );

  const isPersonalizado = form.remainderType === "personalizado";
  const diasExtras = (calculatedDetails.daysDiff || 30) - 30;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col">
        
        {/* Cabecera corregida para evitar solapamiento en mobile */}
        <div className="relative flex justify-between items-center border-b border-neutral-800 pb-3 flex-shrink-0">
          <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2 pr-12 sm:pr-0 leading-snug">
            <span>📋</span> <span className="break-words">Previsualización del Préstamo</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 sm:static text-neutral-400 hover:text-white text-xs font-bold px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl cursor-pointer transition-colors shadow-md"
          >
            ✕ Volver
          </button>
        </div>

        {/* Contenido con scroll interno */}
        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 text-sm">
          
          <div className="bg-black/50 border border-neutral-800 rounded-xl p-3 sm:p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-neutral-400 text-xs sm:text-sm">Cliente:</span>
              <span className="text-white font-medium text-xs sm:text-sm">{calculatedDetails.client?.name || "Cliente General"}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-neutral-400 text-xs sm:text-sm">Monto Solicitado:</span>
              <span className="text-white font-medium text-xs sm:text-sm">${(calculatedDetails.amount || 0).toLocaleString("es-AR")}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-neutral-400 text-xs sm:text-sm">Forma de Entrega:</span>
              <span className="text-amber-400 font-bold uppercase text-xs sm:text-sm">{calculatedDetails.paymentMethod || "EFECTIVO"}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <span className="text-neutral-400 text-xs sm:text-sm">Plazo / Frecuencia:</span>
              <span className="text-white font-medium text-xs sm:text-sm">
                {calculatedDetails.installments} cuota(s) - {calculatedDetails.frequency}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 text-amber-400 font-medium">
              <span className="text-neutral-400 text-xs sm:text-sm">Días Calendario (1er Vto.):</span>
              <span className="text-xs sm:text-sm">{calculatedDetails.daysDiff || 0} días</span>
            </div>

            {/* Resumen dinámico reflejando la tasa exacta ingresada */}
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-2.5 text-xs space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-400">Tasa Base / Mes:</span>
                <span className="font-semibold">{baseRate}%</span>
              </div>
              
              {installmentsNum === 1 && diasExtras > 0 && (
                <div className="flex flex-col sm:flex-row sm:justify-between text-neutral-300 border-t border-neutral-900 pt-1.5 mt-1 gap-1">
                  <span className="text-neutral-400">Días Excedentes ({diasExtras}d):</span>
                  <span className="font-semibold text-amber-400 text-right">
                    {isPersonalizado 
                      ? `Prop. diario (${extraRate}% / 30d × ${diasExtras}d)`
                      : `Prop. diario (${form.remainderRate || baseRate}% / 30d × ${diasExtras}d)`
                    }
                  </span>
                </div>
              )}

              {installmentsNum > 1 && calculatedDetails.frequency === "MENSUAL" && (
                <>
                  <div className="flex justify-between text-neutral-300 border-t border-neutral-900 pt-1.5 mt-1">
                    <span className="text-neutral-400">Cálculo 1era Cuota:</span>
                    <span className="font-semibold">{form.multiInstallmentCalc === "plena" ? "Plena fija" : `Proporcional (${baseRate}% / 30d)`}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-400">Meses Siguientes:</span>
                    <span className="font-semibold text-right">
                      {form.subsequentCalcType === "plena" && "Plena fija"}
                      {form.subsequentCalcType === "proporcional_intervalo" && "Prop. por intervalo"}
                      {form.subsequentCalcType === "personalizado" && `Personalizada (${form.subsequentRate || baseRate}%)`}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400 text-xs sm:text-sm">Total de Interés:</span>
              <span className="text-green-400 font-medium text-xs sm:text-sm">${(calculatedDetails.interestAmount || 0).toLocaleString("es-AR")}</span>
            </div>
            
            <div className="border-t border-neutral-800 pt-2.5 flex justify-between text-sm sm:text-base font-bold">
              <span className="text-white">Total a Pagar:</span>
              <span className="text-red-500">${(calculatedDetails.totalToPay || 0).toLocaleString("es-AR")}</span>
            </div>

            {/* Desglose de cuotas */}
            <div className="pt-2 border-t border-neutral-800">
              <span className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Desglose de Cuotas (Capital + Interés):
              </span>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {calculatedDetails.schedule?.map((inst) => (
                  <div key={inst.installmentNumber} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-800 gap-1.5">
                    <span className="text-neutral-300 font-semibold">
                      Cuota #{inst.installmentNumber} — <span className="text-neutral-400 font-normal">{formatDateToLocal(inst.dueDate)}</span>
                    </span>
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto text-right">
                      <span className="text-neutral-400 text-[11px]">Cap: ${(inst.capital || 0).toLocaleString("es-AR")} + Int: ${(inst.interest || 0).toLocaleString("es-AR")}</span>
                      <span className="text-amber-400 font-bold">${(inst.amount || 0).toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer de Botones */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-neutral-800 flex-shrink-0 bg-neutral-900/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            ← Editar Datos
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
              <BudgetReceipt loanData={calculatedDetails} />
            </div>
            <button
              type="button"
              onClick={onConfirm}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer"
            >
              Confirmar y Otorgar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}