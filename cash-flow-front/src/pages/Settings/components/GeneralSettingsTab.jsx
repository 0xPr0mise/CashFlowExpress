export default function GeneralSettingsTab({ form, handleChange }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Identidad */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
        <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
          Identidad Comercial y Regional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              name="companyName"
              value={form.companyName || ""}
              onChange={handleChange}
              required
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Símbolo de Divisa *
            </label>
            <input
              type="text"
              name="currency"
              value={form.currency || ""}
              onChange={handleChange}
              required
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
            />
          </div>
        </div>
      </div>

      {/* Políticas de Crédito */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
        <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
          Políticas de Crédito y Tasas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Máximo Número de Cuotas *
            </label>
            <input
              type="number"
              name="maxInstallments"
              value={form.maxInstallments || ""}
              onChange={handleChange}
              required
              placeholder="Ej. 12"
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Tasa de Interés Predeterminada (%) *
            </label>
            <input
              type="number"
              step="0.01"
              name="defaultInterestRate"
              value={form.defaultInterestRate || ""}
              onChange={handleChange}
              required
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Mora Diaria (%)
            </label>
            <input
              type="number"
              step="0.01"
              name="lateFeePercentage"
              value={form.lateFeePercentage || ""}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}