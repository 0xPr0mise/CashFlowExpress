export default function ClientForm({
  isOpen,
  onClose,
  form,
  handleChange,
  handleSubmit,
  loading,
  clients = [], // Recibimos la lista de clientes
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              ></path>
            </svg>
            Registrar Nuevo Cliente
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs font-bold px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                name="name"
                placeholder="Ej. Juan Pérez"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Teléfono *
              </label>
              <input
                type="text"
                name="phone"
                placeholder="Ej. 1123456789"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            {/* DNI y Dirección juntos */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                DNI
              </label>
              <input
                type="text"
                name="dni"
                placeholder="Ej. 35123456"
                value={form.dni}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                placeholder="Ej. Av. Siempre Viva 123"
                value={form.address}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Referencia de Ubicación
              </label>
              <input
                type="text"
                name="reference"
                placeholder="Ej. Casa verde / Esquina"
                value={form.reference}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors placeholder:text-neutral-600"
              />
            </div>

            {/* Cliente que Referencia */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                ¿Qué cliente lo refirió? (Opcional)
              </label>
              <select
                name="referredById"
                value={form.referredById}
                onChange={handleChange}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
              >
                <option value="">-- Sin cliente referidor --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.phone ? `(${client.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}