export default function LoanCalculationOptions({ form, onChange, currentDaysDiff, installmentsNum }) {
  const isOverAMonth = currentDaysDiff > 30 && installmentsNum === 1;
  const isMultiMonthly = installmentsNum > 1 && form.frequency === "MENSUAL";

  if (!isMultiMonthly && !isOverAMonth) return null;

  return (
    <div className="sm:col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 sm:p-4 space-y-3">
      
      {/* Cabecera de sección */}
      <div className="flex items-start sm:items-center gap-2">
        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mt-1 sm:mt-0 flex-shrink-0"></span>
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide leading-relaxed">
          {isMultiMonthly 
            ? `Cálculo de Interés para ${installmentsNum} Cuotas Mensuales`
            : `Ajuste por Días Excedentes (${currentDaysDiff - 30} días más de 1 mes)`
          }
        </h4>
      </div>

      {/* Opciones Multi-mensuales */}
      {isMultiMonthly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-400">
              1. Cálculo 1era Cuota ({currentDaysDiff}d):
            </label>
            <select
              name="multiInstallmentCalc"
              value={form.multiInstallmentCalc}
              onChange={onChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 cursor-pointer"
            >
              <option value="plena">Tasa Plena Fija del Mes</option>
              <option value="proporcional_dias">Proporcional según días exactos</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-400">
              2. Meses Siguientes:
            </label>
            <select
              name="subsequentCalcType"
              value={form.subsequentCalcType}
              onChange={onChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 cursor-pointer"
            >
              <option value="plena">Tasa Plena Fija (Mes base)</option>
              <option value="proporcional_intervalo">Proporcional por intervalo</option>
              <option value="personalizado">Tasa Personalizada Fija</option>
            </select>
          </div>

          {form.subsequentCalcType === "personalizado" && (
            <div className="sm:col-span-2 space-y-1 pt-1">
              <label className="block text-[11px] font-semibold text-neutral-400">
                Tasa Fija para Meses Posteriores (%)
              </label>
              <input
                type="text"
                name="subsequentRate"
                value={form.subsequentRate}
                onChange={onChange}
                placeholder="Ej: 20"
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
              />
            </div>
          )}
        </div>
      )}

      {/* Opciones por Días Excedentes (1 sola cuota) */}
      {isOverAMonth && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-neutral-400">
              Cálculo del Remanente
            </label>
            <select
              name="remainderType"
              value={form.remainderType}
              onChange={onChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 cursor-pointer"
            >
              <option value="proporcional">Proporcional (Tasa diaria)</option>
              <option value="personalizado">Personalizado (Tasa fija)</option>
            </select>
          </div>

          {form.remainderType === "personalizado" && (
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-neutral-400">
                Tasa por Días Extras (%)
              </label>
              <input
                type="text"
                name="remainderRate"
                value={form.remainderRate}
                onChange={onChange}
                placeholder="Ej: 20"
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
}