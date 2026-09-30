export default function LoanCalculationOptions({ form, onChange, currentDaysDiff, installmentsNum }) {
    const isOverAMonth = currentDaysDiff > 30 && installmentsNum === 1;
    const isMultiMonthly = installmentsNum > 1 && form.frequency === "MENSUAL";
  
    if (!isMultiMonthly && !isOverAMonth) return null;
  
    return (
      <div className="sm:col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
            {isMultiMonthly 
              ? `Cálculo de Interés para ${installmentsNum} Cuotas Mensuales`
              : `Ajuste por Días Excedentes (${currentDaysDiff - 30} días más de 1 mes)`
            }
          </h4>
        </div>
  
        {isMultiMonthly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                1. Cálculo de la 1era Cuota ({currentDaysDiff} días):
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
  
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                2. Cálculo de Meses Siguientes:
              </label>
              <select
                name="subsequentCalcType"
                value={form.subsequentCalcType}
                onChange={onChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="plena">Tasa Plena Fija (Igual al mes base)</option>
                <option value="proporcional_intervalo">Proporcional según días del intervalo</option>
                <option value="personalizado">Tasa Personalizada Fija</option>
              </select>
            </div>
  
            {form.subsequentCalcType === "personalizado" && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
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
  
        {isOverAMonth && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Cálculo del Remanente
              </label>
              <select
                name="remainderType"
                value={form.remainderType}
                onChange={onChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="proporcional">Proporcional (Según tasa diaria)</option>
                <option value="personalizado">Personalizado (Tasa fija al remanente)</option>
              </select>
            </div>
  
            {form.remainderType === "personalizado" && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
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