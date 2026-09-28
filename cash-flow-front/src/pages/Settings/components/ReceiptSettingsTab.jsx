export default function ReceiptSettingsTab({
  form,
  handleChange,
  setPreviewType,
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
        <h3 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
          Diseño y Textos de Recibos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Título del Recibo
            </label>
            <input
              type="text"
              name="receiptHeaderTitle"
              value={form.receiptHeaderTitle}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Identificación Fiscal (CUIT / RUT)
            </label>
            <input
              type="text"
              name="receiptCompanyId"
              value={form.receiptCompanyId}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Nota al Pie del Recibo
            </label>
            <textarea
              name="receiptFooterNote"
              rows="2"
              value={form.receiptFooterNote}
              onChange={handleChange}
              className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 resize-none"
            />
          </div>
        </div>

        {/* Botones de Previsualización */}
        <div className="pt-4 border-t border-neutral-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Previsualizar Plantillas en Vivo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPreviewType("budget")}
              className="bg-black hover:bg-neutral-800 border border-neutral-800 p-3.5 rounded-xl text-left transition-all cursor-pointer"
            >
              <span className="block text-xs font-bold text-white">
                Presupuesto
              </span>
              <span className="text-[10px] text-neutral-500">
                Ver cotización
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewType("loan")}
              className="bg-black hover:bg-neutral-800 border border-neutral-800 p-3.5 rounded-xl text-left transition-all cursor-pointer"
            >
              <span className="block text-xs font-bold text-white">
                Entrega Préstamo
              </span>
              <span className="text-[10px] text-neutral-500">
                Ver comprobante de salida
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewType("payment")}
              className="bg-black hover:bg-neutral-800 border border-neutral-800 p-3.5 rounded-xl text-left transition-all cursor-pointer"
            >
              <span className="block text-xs font-bold text-white">
                Pago Parcial
              </span>
              <span className="text-[10px] text-neutral-500">
                Ver ticket de abono
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
