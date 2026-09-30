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
  
  // Tasa base elegida en el formulario
  const baseRate = parseFloat(form.interestRate) || 30;
  
  // Buscamos dinámicamente el valor exacto de la tasa de días extras en cualquier propiedad posible del formulario
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            📋 Previsualización del Préstamo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer"
          >
            ✕ Volver
          </button>
        </div>

        <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Cliente:</span>
            <span className="text-white font-medium">{calculatedDetails.client?.name || "Cliente General"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Monto Solicitado:</span>
            <span className="text-white font-medium">${(calculatedDetails.amount || 0).toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Forma de Entrega:</span>
            <span className="text-amber-400 font-bold uppercase">{calculatedDetails.paymentMethod || "EFECTIVO"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Plazo / Frecuencia:</span>
            <span className="text-white font-medium">
              {calculatedDetails.installments} cuota(s) - {calculatedDetails.frequency}
            </span>
          </div>
          <div className="flex justify-between text-amber-400 font-medium">
            <span>Días Calendario Calculados (1er Vto.):</span>
            <span>{calculatedDetails.daysDiff || 0} días</span>
          </div>

          {/* Resumen dinámico reflejando la tasa exacta ingresada */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-2.5 text-xs space-y-1">
            <div className="flex justify-between text-neutral-300">
              <span className="text-neutral-400">Tasa Base / Mes:</span>
              <span className="font-semibold">{baseRate}%</span>
            </div>
            
            {installmentsNum === 1 && diasExtras > 0 && (
              <div className="flex justify-between text-neutral-300 border-t border-neutral-900 pt-1 mt-1">
                <span className="text-neutral-400">Cálculo Días Excedentes ({diasExtras} días extras):</span>
                <span className="font-semibold text-amber-400">
                  {isPersonalizado 
                    ? `Proporcional diario (${extraRate}% / 30 días × ${diasExtras} días)`
                    : `Proporcional diario (${form.remainderRate || baseRate}% / 30 días × ${diasExtras} días)`
                  }
                </span>
              </div>
            )}

            {installmentsNum > 1 && calculatedDetails.frequency === "MENSUAL" && (
              <>
                <div className="flex justify-between text-neutral-300 border-t border-neutral-900 pt-1 mt-1">
                  <span className="text-neutral-400">Cálculo 1era Cuota:</span>
                  <span className="font-semibold">{form.multiInstallmentCalc === "plena" ? "Plena fija" : `Proporcional (${baseRate}% / 30 días)`}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span className="text-neutral-400">Meses Siguientes:</span>
                  <span className="font-semibold">
                    {form.subsequentCalcType === "plena" && "Plena fija"}
                    {form.subsequentCalcType === "proporcional_intervalo" && "Proporcional por intervalo"}
                    {form.subsequentCalcType === "personalizado" && `Personalizada (${form.subsequentRate || baseRate}%)`}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-400">Total de Interés:</span>
            <span className="text-green-400 font-medium">${(calculatedDetails.interestAmount || 0).toLocaleString("es-AR")}</span>
          </div>
          <div className="border-t border-neutral-800 pt-2 flex justify-between text-base font-bold">
            <span className="text-white">Total a Pagar:</span>
            <span className="text-red-500">${(calculatedDetails.totalToPay || 0).toLocaleString("es-AR")}</span>
          </div>

          <div className="pt-2 border-t border-neutral-800">
            <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Desglose de Cuotas (Capital + Interés):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {calculatedDetails.schedule?.map((inst) => (
                <div key={inst.installmentNumber} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800 gap-1">
                  <span className="text-neutral-300 font-semibold">
                    Cuota #{inst.installmentNumber} — <span className="text-neutral-400 font-normal">{formatDateToLocal(inst.dueDate)}</span>
                  </span>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-neutral-400">Cap: ${(inst.capital || 0).toLocaleString("es-AR")} + Int: ${(inst.interest || 0).toLocaleString("es-AR")}</span>
                    <span className="text-amber-400 font-bold">${(inst.amount || 0).toLocaleString("es-AR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            ← Editar Datos
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
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